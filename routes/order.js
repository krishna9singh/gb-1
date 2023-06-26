const express = require("express");
const router = express.Router();

const {
  create,
  status,
  details,
  createtopicorder,
  updateorder,
} = require("../controllers/order");

router.post("/neworder/:userId/:productId", create);
router.post("/newtopicorder/:id/:topicId", createtopicorder);
router.post("/updateorder/:id/:topicId", updateorder);
router.patch("/orderstatus/:userId/:productId/:orderId", status);
router.get("/orderdetails/:userId/:orderId", details);

module.exports = router;
