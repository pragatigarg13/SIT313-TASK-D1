const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
require("dotenv").config();

const serviceAccount = require("./firebase-admin-key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const app = express();

app.use(cors());
app.use(express.json());

// Register
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please complete all required fields."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
    }

    const users = await db.collection("users")
      .where("email", "==", cleanEmail)
      .get();

    if (users.docs.some(user => user.data().passwordHash)) {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userRef = users.empty
      ? db.collection("users").doc()
      : users.docs[0].ref;

    await userRef.set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      passwordHash,
      plan: users.empty
        ? "Free"
        : users.docs[0].data().plan || "Free",
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(201).json({
      message: "Registration successful. Please log in."
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Registration failed."
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Please enter your email and password."
      });
    }

    const users = await db.collection("users")
      .where("email", "==", email.trim().toLowerCase())
      .get();

    const userDoc = users.docs.find(
      user => user.data().passwordHash
    );

    if (!userDoc) {
      return res.status(401).json({
        message: "Invalid email or password. Register through D1 first."
      });
    }

    const user = userDoc.data();

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing.");
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        userId: userDoc.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        plan: user.plan || "Free"
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Login failed."
    });
  }
});

// Upgrade to Paid Plan
app.post("/upgrade", async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please log in first."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRef = db.collection("users").doc(decoded.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (userDoc.data().plan === "Paid") {
      return res.status(400).json({
        message: "You already have the Paid Plan."
      });
    }

    await userRef.update({
      plan: "Paid"
    });

    res.json({
      message: "Your plan has been upgraded to Paid."
    });
  } catch (error) {
    console.error("Upgrade error:", error.message);
    res.status(401).json({
      message: "Invalid or expired login session."
    });
  }
});

// Newsletter subscription
app.post("/subscribe", async (req, res) => {
  try {
    const email = req.body?.email;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email address."
      });
    }

    const cleanEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      return res.status(500).json({
        message: "Email service is not configured."
      });
    }

    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            subscriber_email: cleanEmail
          }
        })
      }
    );

    const result = await response.text();

    if (!response.ok) {
      console.error("EmailJS error:", result);
      return res.status(502).json({
        message: "We could not send your welcome email."
      });
    }

    res.json({
      message: "Thank you for subscribing! Your welcome email has been sent."
    });
  } catch (error) {
    console.error("Subscription error:", error.message);
    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
