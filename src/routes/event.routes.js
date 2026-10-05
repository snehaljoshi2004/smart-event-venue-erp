const express = require("express");

const eventController = require("../controllers/event.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("admin", "staff"),
  eventController.createEvent
);

router.post(
  "/:id/confirm",
  authorize("admin"),
  eventController.confirmEvent
);

router.patch(
  "/:id/status",
  authorize("admin", "staff"),
  eventController.updateEventStatus
);

router.get(
  "/",
  authorize("admin", "staff"),
  eventController.getEvents
);

router.patch(
  "/:id/cancel",
  authorize("admin"),
  eventController.cancelEvent
);

module.exports = router;