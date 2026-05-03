require('dotenv').config(); // MUST be first line

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const voterRoutes = require("./routes/voterRoutes");
const voteRoutes = require("./routes/voteRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend (make sure path is correct)
app.use(express.static("../frontend"));

// API Routes
app.use("/api/voters", voterRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);

// Test route (optional but useful)
app.get("/", (req, res) => {
  res.send("Server is running successfully 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});