require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Message = require("./models/Message");

// ---------------------------
// MongoDB Connection
// ---------------------------
const mongoURL = process.env.MONGO_URI;
if (!mongoURL) {
  console.error("Error: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(mongoURL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // stop server if DB fails
  });

// ---------------------------
// Express App Setup
// ---------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// HTTP Server + Socket.io
// ---------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // User joins chat
  socket.on("join", async (username) => {
    if (!username) return;
    onlineUsers[socket.id] = username;
    io.emit("online_users", Object.values(onlineUsers));

    try {
      const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
      socket.emit("message_history", messages);
    } catch (err) {
      console.error("Error fetching message history:", err);
    }
  });

  // Receive and broadcast message
  socket.on("send_message", async (data) => {
    if (!data.message || !data.username) return;

    const newMessage = new Message({
      username: data.username,
      message: data.message,
      time: new Date().toLocaleTimeString(),
      avatar: data.avatar || "/default-avatar.png",
    });

    try {
      const saved = await newMessage.save();
      io.emit("receive_message", saved);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // User disconnects
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("online_users", Object.values(onlineUsers));
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ---------------------------
// Start Server
// ---------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
