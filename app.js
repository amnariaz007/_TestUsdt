const express = require("express");
const app = express();
//const dotenv = require("dotenv");
const transferAPI = require("./transferAPI"); // import the transfer route


// Middleware to parse JSON requests
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "USDT Transfer API is running" });
});

// API route for USDT transfer
app.use("/api", transferAPI);

// 404 handler for unknown routes
app.all("*", (req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});