const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
    avatar: { type: String, default: "/default-avatar.png" }, // optional
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", MessageSchema);
