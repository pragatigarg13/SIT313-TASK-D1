const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

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
      console.error("EmailJS configuration is missing.");

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

    console.log("EmailJS API status:", response.status);

    if (!response.ok) {
      console.error("EmailJS API error:", result);

      return res.status(502).json({
        message: "We could not send your welcome email. Please try again."
      });
    }

    console.log("Welcome email request accepted by EmailJS.");

    return res.status(200).json({
      message: "Thank you for subscribing! Your welcome email has been sent."
    });
  } catch (error) {
    console.error("Subscription error:", error.message);

    return res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});





