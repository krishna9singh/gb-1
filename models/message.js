const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    sender: {
      type: ObjectId,
      ref: "User",
    },
    text: {
      type: String,
    },
    topicId: {
      type: ObjectId,
      ref: "Topic",
    },
    hidden: [{ type: ObjectId, ref: "User" }],
    mesId: { type: Number, required: true, unique: true },
    dissapear: { type: Boolean, default: false },
    typ: { type: String, default: "message" },
    status: { type: String, default: "active" },
    ques: { type: String },
    totalVotes: { type: Number, default: 0 },
    option: [
      {
        content: {
          type: String,
          required: true,
        },
        voteCount: { type: Number, default: 0 },
        votedBy: [{ type: ObjectId, ref: "User", default: [] }],
      },
    ],
    voted: [{ type: ObjectId, ref: "User" }],
    expression: { type: String },
    image: { type: String },
    video: { type: String },
    audio: { type: String },
    doc: { type: String },
    contact: { type: String },
    reply: { type: String },
    comId: { type: ObjectId, ref: "Community" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
