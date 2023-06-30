const Community = require("../models/community");
const User = require("../models/userAuth");
const uuid = require("uuid").v4;
const Minio = require("minio");
const Topic = require("../models/topic");
const sharp = require("sharp");

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

exports.create = async (req, res) => {
  const { title, desc, topic, type, price, category } = req.body;
  const { userId } = req.params;
  const image = req.file;
  const uuidString = uuid();
  if (!image) {
    res.status(400).json({ message: "Please upload an image" });
  } else if (topic) {
    try {
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
      );
      const community = new Community({
        title,
        creator: userId,
        dp: objectName,
        desc: desc,
        category: category,
      });
      const savedcom = await community.save();
      const topic1 = new Topic({
        title: "Posts",
        creator: userId,
        community: savedcom._id,
      });
      await topic1.save();

      const topic2 = new Topic({
        title: "All",
        creator: userId,
        community: savedcom._id,
      });
      await topic2.save();

      const topic3 = new Topic({
        title: topic,
        creator: userId,
        community: savedcom._id,
        type: type,
        price: price,
      });
      await topic3.save();

      await Community.updateOne(
        { _id: savedcom._id },
        {
          $push: { members: userId, admins: user._id },
          $inc: { memberscount: 1 },
        }
      );

      await Community.updateMany(
        { _id: savedcom._id },
        {
          $push: { topics: [topic1._id, topic2._id, topic3._id] },
          $inc: { totaltopics: 1 },
        }
      );

      await Topic.updateOne(
        { _id: topic1._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );
      await Topic.updateOne(
        { _id: topic2._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );
      await Topic.updateOne(
        { _id: topic3._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );

      await User.updateMany(
        { _id: userId },
        {
          $push: {
            topicsjoined: [topic1._id, topic2._id, topic3._id],
            communityjoined: savedcom._id,
          },
          $inc: { totaltopics: 3, totalcom: 1 },
        }
      );
      res.status(200).json(savedcom);
    } catch (e) {
      res.status(400).json(e.message);
    }
  } else {
    try {
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
      );
      const community = new Community({
        title,
        creator: userId,
        dp: objectName,
        desc: desc,
        category: category,
      });
      const savedcom = await community.save();
      const topic1 = new Topic({
        title: "Posts",
        creator: userId,
        community: savedcom._id,
      });
      await topic1.save();
      const topic2 = new Topic({
        title: "All",
        creator: userId,
        community: savedcom._id,
      });
      await topic2.save();

      await Community.updateOne(
        { _id: savedcom._id },
        {
          $push: { members: userId, admins: user._id },
          $inc: { memberscount: 1 },
        }
      );
      await Community.updateMany(
        { _id: savedcom._id },
        { $push: { topics: [topic1._id, topic2._id] } }
      );

      await Topic.updateOne(
        { _id: topic1._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );
      await Topic.updateOne(
        { _id: topic2._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );

      await User.updateMany(
        { _id: userId },
        {
          $push: {
            topicsjoined: [topic1._id, topic2._id],
            communityjoined: savedcom._id,
          },
          $inc: { totaltopics: 2, totalcom: 1 },
        }
      );
      res.status(200).json(savedcom);
    } catch (e) {
      res.status(400).json(e.message);
    }
  }
};

//community join
exports.joinmember = async (req, res) => {
  const { userId, comId } = req.params;
  const user = await User.findById(userId);
  const community = await Community.findById(comId);

  if (!community) {
    res.status(400).json({ message: "Community not found" });
  } else {
    let publictopic = [];
    for (let i = 0; i < community.topics.length; i++) {
      const topic = await Topic.findById({ _id: community.topics[i] });
      if (topic.type === "public") {
        publictopic.push(topic);
      }
    }

    const topic1 = await Topic.find(
      { community: community._id },
      { title: "All" }
    );
    const topic2 = await Topic.find(
      { community: community._id },
      { title: "Posts" }
    );
    try {
      const isOwner = community.creator.equals(user._id);
      const isSubscriber = community.members.includes(user._id);
      if (isOwner) {
        res.status(201).json({
          message: "You already have joined your own community!",
          success: false,
        });
      } else if (isSubscriber) {
        res
          .status(201)
          .json({ message: "Already Subscriber", success: false, publictopic });
      } else if (community.type === "public") {
        await Community.updateOne(
          { _id: comId },
          { $push: { members: user._id }, $inc: { memberscount: 1 } }
        );
        await User.updateOne(
          { _id: userId },
          { $push: { communityjoined: community._id }, $inc: { totalcom: 1 } }
        );
        await User.updateOne(
          { _id: userId },
          { $push: { communityjoined: community._id }, $inc: { totalcom: 1 } }
        );
        await Topic.updateOne(
          { _id: topic1._id },
          { $push: { members: user._id }, $inc: { memberscount: 1 } }
        );
        await Topic.updateOne(
          { _id: topic2._id },
          { $push: { members: user._id }, $inc: { memberscount: 1 } }
        );
        await User.updateMany(
          { _id: userId },
          {
            $push: { topicsjoined: [topic1._id, topic2._id] },
            $inc: { totaltopics: 2 },
          }
        );
        res.status(200).json({ success: true });
      }
    } catch (e) {
      res.status(400).json(e.message);
    }
  }
};

//community unjoin
exports.unjoinmember = async (req, res) => {
  const { userId, comId } = req.params;
  const user = await User.findById(userId);
  const community = await Community.findById(comId);

  const isOwner = community.creator.equals(user._id);
  const isSubscriber = community.members.includes(user._id);
  try {
    if (isOwner) {
      res.status(201).json({
        message: "You can't unjoin your own community!",
        success: false,
      });
    } else if (!isSubscriber) {
      res.status(201).json({ message: "Not Subscribed", success: false });
    } else {
      await Community.updateOne(
        { _id: comId },
        { $pull: { members: user._id }, $inc: { memberscount: -1 } }
      );
      await User.updateOne(
        { _id: userId },
        { $pull: { communityjoined: community._id }, $inc: { totalcom: -1 } }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//get community
exports.getcommunity = async (req, res) => {
  const { comId, id } = req.params;
  const community = await Community.findById(comId).populate(
    "topics",
    "title type price"
  );
  const user = await User.findById(id);
  try {
    if (!community) {
      res.status(404).json({ message: "No community found", success: false });
    } else if (!user) {
      res.status(404).json({ message: "No User found", success: false });
    } else {
      const canedit =
        community.admins.includes(user._id) ||
        community.moderators.includes(user._id);

      const dp = await generatePresignedUrl(
        "images",
        community.dp.toString(),
        60 * 60
      );

      res.status(200).json({ dp, community, canedit, success: true });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//get a topic
exports.addTopic = async (req, res) => {
  const { comId, userId } = req.params;
  const { text } = req.body;
  try {
    const topic1 = new Topic({
      title: text,
      creator: userId,
      community: comId,
    });
    await topic1.save();

    await Community.findByIdAndUpdate(
      { _id: comId },
      { $set: { topics: [topic1._id] } }
    );
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//update community
exports.udpatecommunity = async (req, res) => {
  const { comId, userId } = req.params;
  const { category, name, desc, topicId, message, price, topicname, type } =
    req.body;
  const uuidString = uuid();
  try {
    const user = await User.findById(userId);
    const com = await Community.findById(comId);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else if (!com) {
      res.status(404).json({ message: "Community not found", success: false });
    } else {
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
      a1 = objectName;
      a2 = req.file.mimetype;

      await sharp(req.file.buffer)
        .jpeg({ quality: 50 })
        .toBuffer()
        .then(async (data) => {
          await minioClient.putObject(bucketName, objectName, data);
        })
        .catch((err) => {
          console.log(err.message, "-error");
        });
      await Community.updateOne(
        { _id: com._id },
        {
          $set: { category: category, title: name, desc: desc, dp: objectName },
        }
      );
      await Topic.updateOne(
        { _id: topicId },
        {
          $set: {
            title: topicname,
            message: message,
            price: price,
            type: type,
          },
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};
