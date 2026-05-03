const express = require("express");
const router = express.Router();
const voterController = require("../controllers/voterController");

router.post("/register", voterController.register);
router.post("/generate-key", voterController.generateKey);
router.post("/verify-key", voterController.verifyKey);
router.get("/status", voterController.voterStatus);

module.exports = router;