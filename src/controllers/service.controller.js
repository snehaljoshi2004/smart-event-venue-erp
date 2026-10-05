const serviceService = require("../services/service.service");

async function createService(req, res, next) {
  try {
    const result = await serviceService.createService(req.body);

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getServices(req, res, next) {
  try {
    const result = await serviceService.getServices();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function addServiceToEvent(req, res, next) {
  try {
    const result = await serviceService.addServiceToEvent(
      req.params.eventId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Service added to event successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createService,
  getServices,
  addServiceToEvent
};