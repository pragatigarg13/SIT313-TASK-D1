const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config();

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const app = express();

app.use(cors());
app.use(express.json());

// Register a new user
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const usersRef = db.collection("users");
    const existingUser = await usersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await usersRef.add({
      firstName,
      lastName,
      email,
      passwordHash,
      plan: "Free",
      createdAt: FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Unable to register user"
    });
  }
});

// Log in an existing user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const usersRef = db.collection("users");
    const userSnapshot = await usersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    if (!user.passwordHash) {
      return res.status(401).json({
        message: "Please sign in using Google"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: userDoc.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Unable to log in"
    });
  }
});

// Log in with Google
app.post("/google-login", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google ID token is required"
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const email = decodedToken.email;

    if (!email || decodedToken.email_verified !== true) {
      return res.status(401).json({
        message: "Please use a verified Google account"
      });
    }

    const usersRef = db.collection("users");

    const userSnapshot = await usersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    let userDoc;

    if (userSnapshot.empty) {
      const fullName = decodedToken.name || "";
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

      const newUser = {
        firstName: nameParts[0] || "Google",
        lastName: nameParts.slice(1).join(" ") || "User",
        email,
        plan: "Free",
        createdAt: FieldValue.serverTimestamp()
      };

      const newUserRef = await usersRef.add(newUser);

      userDoc = {
        id: newUserRef.id,
        ...newUser
      };
    } else {
      const doc = userSnapshot.docs[0];

      userDoc = {
        id: doc.id,
        ...doc.data()
      };
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { userId: userDoc.id, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: userDoc.id,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        email: userDoc.email,
        plan: userDoc.plan || "Free"
      }
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(401).json({
      message: "Google login failed"
    });
  }
});

// Upgrade a user's plan
app.post("/upgrade", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token required"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await db.collection("users").doc(decoded.userId).update({
      plan: "Paid"
    });

    res.json({
      message: "Plan upgraded successfully",
      plan: "Paid"
    });
  } catch (error) {
    console.error("Upgrade error:", error.message);
    res.status(401).json({
      message: "Unable to upgrade plan. Please log in again."
    });
  }
});

// Subscribe to the newsletter using EmailJS
app.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email"
      });
    }

    const requiredKeys = [
      "EMAILJS_SERVICE_ID",
      "EMAILJS_TEMPLATE_ID",
      "EMAILJS_PUBLIC_KEY",
      "EMAILJS_PRIVATE_KEY"
    ];

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        throw new Error(`${key} is not configured`);
      }
    }

    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            subscriber_email: email
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EmailJS error:", errorText);

      return res.status(502).json({
        message: "Unable to subscribe right now"
      });
    }

    res.json({
      message: "Subscription successful"
    });
  } catch (error) {
    console.error("Subscription error:", error.message);
    res.status(500).json({
      message: "Unable to process subscription"
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
