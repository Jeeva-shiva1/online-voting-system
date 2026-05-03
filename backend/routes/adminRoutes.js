const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth.middleware");

// 🔐 Admin Login
router.post("/login", adminController.login);

// 📊 Stats
router.get("/stats", auth, adminController.getStats);

// 👥 Voters
router.get("/voters", auth, adminController.getAllVoters);
router.delete("/voter/:email", auth, adminController.deleteVoter);

// 🧑‍💼 Candidates
router.post("/candidate", auth, adminController.addCandidate);
router.get("/candidates", auth, adminController.getCandidates);
router.delete("/candidate/:id", auth, adminController.deleteCandidate);

// 📈 Results
router.get("/results", auth, adminController.getResults);

// 📊 Dashboard
router.get("/dashboard", auth, adminController.getAdminDashboard);

module.exports = router;