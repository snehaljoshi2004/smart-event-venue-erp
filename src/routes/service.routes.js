const express = require("express");

const serviceController = require("../controllers/service.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin", "staff"),
  serviceController.getServices
);

router.post(
  "/",
  authorize("admin"),
  serviceController.createService
);

router.post(
  "/events/:eventId",
  authorize("admin", "staff"),
  serviceController.addServiceToEvent
);

module.exports = router;