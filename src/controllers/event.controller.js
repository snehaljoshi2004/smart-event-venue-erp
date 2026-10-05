const eventService = require("../services/event.service");

async function createEvent(req, res, next) {
  try {
    const result = await eventService.createEvent(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function confirmEvent(req, res, next) {
  try {
    const result = await eventService.confirmEvent(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Event confirmed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function updateEventStatus(req, res, next) {
  try {
    const result = await eventService.updateEventStatus(
      req.params.id,
      req.body.status,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Event status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function cancelEvent(req, res, next) {
  try {
    const result = await eventService.cancelEvent(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Event cancelled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getEvents(req, res, next) {
  try {
    const result = await eventService.getEvents({
      status: req.query.status,
      customerId: req.query.customerId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  confirmEvent,
  updateEventStatus,
  cancelEvent,
  getEvents
};