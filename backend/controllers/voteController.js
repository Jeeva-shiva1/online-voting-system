require("dotenv").config();

const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory OTP store
const otpStore = {};

// ================= GET CANDIDATES =================
exports.getCandidates = async (_, res) => {
  try {
    const candidates = await Candidate.find({});
    return res.json({ success: true, candidates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= CAST VOTE =================
exports.castVote = async (req, res) => {
  const { email, register_number, candidate_id } = req.body;

  if (!email || !register_number || !candidate_id) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const voter = await Voter.findOne({ email, register_number });
    if (!voter) {
      return res.status(400).json({ error: "Invalid voter" });
    }
    if (voter.voted) {
      return res.status(400).json({ error: "Already voted" });
    }

    const candidate = await Candidate.findById(candidate_id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Encrypt vote
    const voteStr = `{"voterId":"${voter._id}","candidateId":"${candidate._id}"}`;
    const encryptedVote = crypto.createHash("sha256").update(voteStr).digest("hex");

    // Save vote
    await Vote.create({ candidateId: candidate._id, encryptedVote });

    // ✅ Increment voteCount on candidate
    await Candidate.findByIdAndUpdate(candidate._id, { $inc: { voteCount: 1 } });

    // Mark voter as voted
    voter.voted = true;
    await voter.save();

    return res.json({ success: true, message: "Vote submitted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET RESULTS =================
exports.getResult = async (_, res) => {
  try {
    const candidates = await Candidate.find({})
      .select("name party voteCount")
      .sort({ voteCount: -1 });

    if (!candidates.length) {
      return res.json({ success: true, results: [], winner: null });
    }

    const winner = candidates[0];

    return res.json({
      success: true,
      results: candidates,
      winner: winner.voteCount > 0 ? winner.name : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= REQUEST VOTE OTP =================
exports.requestVoteOtp = async (req, res) => {
  const { email, register_number } = req.body;

  if (!email || !register_number) {
    return res.status(400).json({ error: "Email and register number required" });
  }

  try {
    const voter = await Voter.findOne({ email, register_number });
    if (!voter) {
      return res.status(400).json({ error: "Invalid voter" });
    }
    if (voter.voted) {
      return res.status(400).json({ error: "You have already voted" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with 10 min expiry
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
        <p>Use this OTP to cast your vote:</p>
        <h1 style="letter-spacing:8px; color:#4f46e5;">${otp}</h1>
        <p>Expires in <strong>10 minutes</strong>. Do not share this.</p>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ OTP Error:", err.message);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

// ================= VERIFY VOTE OTP =================
exports.verifyVoteOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ error: "OTP not found. Request a new one." });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired. Request a new one." });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  delete otpStore[email];
  return res.json({ success: true, message: "OTP verified. You may now vote." });
};