const express = require("express");
const router = express.Router();

const {
  create,
  deletetopic,
  getmessages,
  newmessage,
  hiddenmes,
} = require("../controllers/topic");

router.post("/createtopic/:userId/:comId", create);

router.delete("/deletetopic/:topicId", deletetopic);

router.get("/getmessages/:topicId/:userId", getmessages);

router.get("/hiddenmes/:comId/:id", hiddenmes);

router.post("/newmessage/:topicId", newmessage);

module.exports = router;
