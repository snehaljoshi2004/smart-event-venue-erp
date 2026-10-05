const express = require("express");

const vendorController = require("../controllers/vendor.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin", "staff"),
  vendorController.getVendors
);

router.post(
  "/",
  authorize("admin"),
  vendorController.createVendor
);

module.exports = router;