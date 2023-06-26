const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const SubscrpitionsSchema = new mongoose.Schema(
  {
    topic: { type: ObjectId, ref: "Topic" },
    validity: { type: String },
  },
  { timestamps: true }
);

SubscrpitionsSchema.index({ title: "text" });

module.exports = mongoose.model("Subscrpitions", SubscrpitionsSchema);
