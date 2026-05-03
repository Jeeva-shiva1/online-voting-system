const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const auth = require("../middleware/auth.middleware");

router.get("/candidates", voteController.getCandidates);
router.post("/cast", auth, voteController.castVote);
router.get("/result", voteController.getResult);

// OTP routes
router.post("/request-vote-otp", voteController.requestVoteOtp);
router.post("/verify-vote-otp", voteController.verifyVoteOtp);

module.exports = router;