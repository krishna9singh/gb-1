const express = require("express");
const {
  getuserstotal,
  findUser,
  blockuser,
  findCreator,
  findBusiness,
  findDeliveryPartners,
  findcoms,
  blockcomms,
  findposts,
  blockposts,
  blockproducts,
  findproducts,
  findreports,
  markreports,
  getdp,
} = require("../controllers/admin");
const router = express.Router();

router.get("/totalusers/:userId", getuserstotal);
router.post("/finduser/:userId/:id", findUser);
router.post("/findcreator/:userId/:id", findCreator);
router.post("/findbusiness/:userId/:id", findBusiness);
router.post("/finddeliverypartner/:userId/:id", findDeliveryPartners);
router.post("/findcomms/:comId/:id", findcoms);
router.post("/commsblock/:comId/:id", blockcomms);
router.post("/blockuser/:userId/:id", blockuser);
router.post("/findposts/:postId/:id", findposts);
router.post("/blockposts/:postId/:id", blockposts);
router.post("/findproducts/:prodId/:id", findproducts);
router.post("/blockproducts/:prodId/:id", blockproducts);
router.post("/findreports/:id", findreports);
router.post("/markreports/:reportId/:id", markreports);
router.get("/getdp/:userId", getdp);
module.exports = router;
