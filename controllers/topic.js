const Topic = require("../models/topic");
const Message = require("../models/message");
const Community = require("../models/community");
const User = require("../models/userAuth");
const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.site",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

//function to generate a presignedurl of minio
async function generatePresignedUrl(bucketName, objectName, expiry = 604800) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
    return presignedUrl;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate presigned URL");
  }
}

//create a new topic
exports.create = async (req, res) => {
  const { title, message, type, price } = req.body;
  const { userId, comId } = req.params;
  try {
    const topic = new Topic({
      title,
      creator: userId,
      community: comId,
      message: message,
      type: type,
      price: price,
    });
    await topic.save();
    await Topic.updateOne(
      { _id: topic._id },
      { $push: { members: userId }, $inc: { memberscount: 1 } }
    );
    await Community.updateOne(
      { _id: comId },
      {
        $push: { topics: topic._id },
        $inc: { totaltopics: 1 },
      }
    );
    await User.updateOne(
      { _id: userId },
      { $push: { topicsjoined: topic._id }, $inc: { totaltopics: 1 } }
    );

    res.status(200).json({ topic, success: true });
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//Delete Topic
exports.deletetopic = async (req, res) => {
  const { topicId } = req.params;
  const topic = await Topic.findById(topicId);
  try {
    if (!topicId) {
      res.status(400).json({ message: "No topic found", success: false });
    } else if (topic.creator.toString() != topicId) {
      res
        .status(400)
        .json({ message: "Not Authorized - You can't delete others topic" });
    } else {
      await Topic.findByIdAndDelete(topicId);

      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

//get all messages of a topic
exports.getmessages = async (req, res) => {
  const { topicId, userId } = req.params;
  const user = await User.findById(userId);
  const topic = await Topic.findById(topicId);
  const community = await Community.find({ topics: { $in: [topic._id] } });

  try {
    const messages = await Message.find({ topicId: topicId })
      .limit(20)
      .sort({ createdAt: -1 })
      .populate("sender", "profilepic fullname isverified");

    const reversed = messages.reverse();
    const dps = [];

    for (let i = 0; i < reversed.length; i++) {
      if (reversed[i].sender === null) {
        reversed[i].remove();
      }

      const a = await generatePresignedUrl(
        "images",
        reversed[i].sender.profilepic.toString(),
        60 * 60
      );
      dps.push(a);
    }
    if (!topic) {
      res.status(404).json({ message: "No topic found", success: false });
    } else if (!community) {
      res.status(404).json({ message: "No Community found", success: false });
    } else if (!user) {
      res.status(404).json({ message: "No User found", success: false });
    } else if (!community[0].members.includes(user._id)) {
      res.status(400).json({
        reversed,
        dps,
        message: "You are not the member of the Community",
        success: false,
      });
    } else if (topic.type === "Private") {
      if (!topic.members.includes(user._id)) {
        res.status(400).json({
          message: "You need to join this topic first",
          success: true,
          issubs: false,
        });
      } else {
        res.status(200).json({ success: true, reversed, dps, issubs: true });
      }
    } else if (topic.type === "Paid") {
      if (
        !topic.members.includes(user._id) &&
        !user.topicsjoined.includes(topic._id)
      ) {
        res.status(400).json({
          message: "Unsubscribed",
          success: true,
          topic,
          issubs: false,
        });
      } else {
        res.status(200).json({ success: true, reversed, dps, issubs: true });
      }
    } else if (topic.type === "Public") {
      res.status(200).json({ success: true, reversed, dps, issubs: true });
    } else {
      res.status(200).json({ success: true, reversed, dps, issubs: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

//hidden messages
exports.hiddenmes = async (req, res) => {
  const { comId, id } = req.params;
  try {
    const com = await Community.findById(comId);
    const user = await User.findById(id);
    if (user && com) {
      const mes = await Message.find({
        comId: com._id,
        hidden: { $in: [user._id] },
      });
      res.status(200).json({ mes });
    } else {
      res
        .status(404)
        .json({ message: "Something went wrong...", success: false });
    }
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

//message
exports.newmessage = async (req, res) => {
  const { topicId } = req.params;
  const { text, sender, typ, mesId, reply, dissapear, comId } = req.body;

  try {
    const message = new Message({
      text: text,
      sender: sender,
      topicId: topicId,
      typ: typ,
      mesId: mesId,
      reply: reply,
      dissapear: dissapear,
      comId: comId,
    });
    await message.save();
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

//join a topic
