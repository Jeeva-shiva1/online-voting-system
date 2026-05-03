const jwt = require('jsonwebtoken');
const Voter = require('../models/Voter');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');

// 🔐 ADMIN LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (email === "admin@example.com" && password === "admin123") {
    const token = jwt.sign(
      { email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: "Invalid admin credentials" });
};

// 👥 GET ALL VOTERS
const getAllVoters = async (req, res) => {
  try {
    const voters = await Voter.find({}).select("-__v");
    res.json({ success: true, voters });
  } catch {
    res.status(500).json({ error: "Failed to fetch voters" });
  }
};

// 📊 STATS
const getStats = async (req, res) => {
  try {
    const totalVoters = await Voter.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const totalCandidates = await Candidate.countDocuments();

    res.json({ success: true, totalVoters, totalVotes, totalCandidates });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// ❌ DELETE VOTER
const deleteVoter = async (req, res) => {
  const { email } = req.params;
  try {
    const voter = await Voter.findOneAndDelete({ email });
    if (!voter) return res.status(404).json({ error: "User not found" });

    await Vote.deleteMany({ voterEmail: email });
    res.json({ success: true, message: "User and related votes deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
};

// ➕ ADD CANDIDATE
const addCandidate = async (req, res) => {
  const { name, party } = req.body;

  if (!name || !party) {
    return res.status(400).json({ error: "Name and party are required" });
  }

  try {
    const existing = await Candidate.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "Candidate already exists" });
    }

    const candidate = await Candidate.create({ name, party });
    res.json({ success: true, message: "Candidate added", candidate });
  } catch {
    res.status(500).json({ error: "Failed to add candidate" });
  }
};

// 📋 GET ALL CANDIDATES
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({}).select("-__v");
    res.json({ success: true, candidates });
  } catch {
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

// ❌ DELETE CANDIDATE
const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await Candidate.findByIdAndDelete(id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    res.json({ success: true, message: "Candidate deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete candidate" });
  }
};

// 📊 RESULTS — show vote counts per candidate
const getResults = async (req, res) => {
  try {
    const candidates = await Candidate.find({}).select("name party voteCount");
    res.json({ success: true, results: candidates });
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
};

// 📊 DASHBOARD
const getAdminDashboard = (req, res) => {
  res.json({ message: "Admin Dashboard Working ✅" });
};

module.exports = {
  login,
  getStats,
  getAllVoters,
  deleteVoter,
  addCandidate,
  getCandidates,
  deleteCandidate,
  getResults,
  getAdminDashboard
};