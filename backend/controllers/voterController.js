require("dotenv").config();

const Voter = require("../models/Voter");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// In-memory OTP store { email: { otp, expiresAt } }
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= REGISTER =================
exports.register = async (req, res) => {
  const { name, email, register_number } = req.body;

  if (!name || !email || !register_number) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const existing = await Voter.findOne({
      $or: [{ email }, { register_number }],
    });

    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const voter = await Voter.create({ name, email, register_number });

    return res.json({ success: true, message: "Registration successful", voter });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GENERATE OTP =================
exports.generateKey = async (req, res) => {
  const { email, register_number } = req.body;

  if (!email || !register_number) {
    return res.status(400).json({ error: "Email and register number required" });
  }

  try {
    const voter = await Voter.findOne({ email, register_number });

    if (!voter) {
      return res.status(400).json({ error: "Invalid voter credentials" });
    }

    if (voter.voted) {
      return res.status(400).json({ error: "Already voted" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with 10 minute expiry
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    // Send OTP email
    await transporter.sendMail({
      from: `"Voting System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Voting OTP",
      html: `
        <h2>Your One-Time Password</h2>
        <p>Use this OTP to complete your vote:</p>
        <h1 style="letter-spacing:8px; color:#4f46e5;">${otp}</h1>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>Do not share this with anyone.</p>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return res.status(500).json({
      error: "Failed to send OTP. Check your EMAIL_USER and EMAIL_PASS in .env",
    });
  }
};

// ================= VERIFY OTP =================
exports.verifyKey = async (req, res) => {
  const { email, register_number, key } = req.body;

  if (!email || !register_number || !key) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const voter = await Voter.findOne({ email, register_number });

    if (!voter) {
      return res.status(400).json({ error: "Invalid voter" });
    }

    // Check OTP exists
    const record = otpStore[email];
    if (!record) {
      return res.status(400).json({ error: "OTP not generated. Request a new one." });
    }

    // Check OTP expiry
    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP expired. Request a new one." });
    }

    // Check OTP match
    if (record.otp !== key.trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP valid — clear it
    delete otpStore[email];

    const token = jwt.sign(
      { email, register_number, role: "voter", voterId: voter._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ success: true, token, email, register_number });
  } catch (err) {
    console.error("Verify Key Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= VOTER STATUS =================
exports.voterStatus = async (req, res) => {
  const { email, register_number } = req.query;

  if (!email || !register_number) {
    return res.status(400).json({ error: "Email and register_number required" });
  }

  try {
    const voter = await Voter.findOne({ email, register_number });

    if (!voter) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ success: true, name: voter.name, voted: voter.voted });
  } catch (err) {
    console.error("Status Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};