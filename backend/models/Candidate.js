const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, default: "Independent" },
  voteCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);