const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  register_number: { type: String, required: true, unique: true },
  voted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Voter", voterSchema);