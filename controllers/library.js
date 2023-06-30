const Minio = require("minio");
const uuid = require("uuid").v4;
const Post = require("../models/post");
const User = require("../models/userAuth");
const Product = require("../models/product");
const Order = require("../models/orders");
const Cart = require("../models/Cart");
const Subscriptions = require("../models/Subscriptions");

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

exports.fetchapplause = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const post = await Post.find({ likedby: user._id })
        .populate("community", "title isverified dp")
        .populate("sender", "fullname");
      if (post) {
        const url = [];
        for (let i = 0; i < post.length; i++) {
          const urls = await generatePresignedUrl(
            "posts",
            post[i].post[0].toString(),
            60 * 60
          );
          url.push(urls);
        }
        const dp = [];
        for (let i = 0; i < post.length; i++) {
          const a = await generatePresignedUrl(
            "images",
            post[i].community.dp.toString(),
            60 * 60
          );
          dp.push(a);
        }
        res.status(200).json({ post, url, dp, success: true });
      } else {
        res.status(203).json({ success: false });
      }
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//fetch orders
exports.fetchorders = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const orders = [];

      for (let i = 0; i < user.puchase_history.length; i++) {
        const order = await Order.findById(user.puchase_history[i].toString())
          .populate(
            "productId",
            "name brandname creator images inclusiveprice price percentoff sellername totalstars"
          )
          .populate("sellerId", "isverified fullname");
        orders.push(order);
      }

      const image = [];
      if (orders) {
        for (let j = 0; j < orders.length; j++) {
          const a = await generatePresignedUrl(
            "products",
            orders[j].productId[0].images[0].toString(),
            60 * 60
          );
          image.push(a);
        }
      }
      res
        .status(200)
        .json({ orders, image, address: user.location, success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//fetch cart
exports.fetchcart = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate({
      path: "cart",
      populate: {
        path: "product",
        model: "Product",
      },
    });
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const ids = [];
      const image = [];
      for (let j = 0; j < user.cart.length; j++) {
        ids.push(user.cart[j].product._id);
      }

      if (user) {
        for (let j = 0; j < user.cart.length; j++) {
          const a = await generatePresignedUrl(
            "products",
            user.cart[j].product.images[0].toString(),
            60 * 60
          );
          image.push(a);
        }
      }
      const total = [];
      let count = 0;
      for (let i = 0; i < user.cart.length; i++) {
        const t = user.cart[i].product.price;
        count += t;
      }
      total.push(count);
      const discount = [];
      let dis = 0;
      for (let i = 0; i < user.cart.length; i++) {
        const t = user.cart[i].product.percentoff;
        dis += t;
      }
      discount.push(dis);

      res.status(200).json({
        total: total,
        cart: user.cart,
        discount: discount,
        address: user.address,
        image,
        success: true,
        ids,
      });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//add to cart
exports.addtocart = async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const c = new Cart({ product: productId, quantity: quantity });
      await c.save();
      await User.updateOne({ _id: userId }, { $push: { cart: c._id } });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//update quantity
exports.updatequantity = async (req, res) => {
  const { userId, cartId } = req.params;
  const { quantity } = req.body;
  try {
    const user = await User.findById(userId);
    const cart = await user.cart.includes(cartId);
    if (!user || !cart) {
      res.status(404).json({ message: "Not found", success: false });
    } else {
      await Cart.updateOne({ _id: cartId }, { $set: { quantity: quantity } });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//remove from cart
exports.removecart = async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      await User.updateOne({ _id: userId }, { $pull: { cart: productId } });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//udpate address
exports.updateaddress = async (req, res) => {
  const { userId } = req.params;
  const { address } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      await User.updateOne({ _id: userId }, { $set: { address: address } });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//fetch subscriptions
exports.subscriptions = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate({
      path: "subscriptions",
      populate: {
        path: "topic",
        model: "Topic",
      },
    });
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      res.status(200).json({ subs: user.subscriptions, success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.addsubs = async (req, res) => {
  const { userId, topicId } = req.params;
  const { validity } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "No user found", success: false });
    } else {
      const s = new Subscriptions({ topic: topicId, validity: validity });
      await s.save();
      await User.updateOne(
        { _id: userId },
        { $push: { subscriptions: s._id } }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};
