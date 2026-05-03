const mongoose = require("mongoose");
const crypto = require("crypto");

const voteSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  encryptedVote: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Vote", voteSchema);