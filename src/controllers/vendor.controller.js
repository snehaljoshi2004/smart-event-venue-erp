const vendorService = require("../services/vendor.service");

async function createVendor(req, res, next) {
  try {
    const result = await vendorService.createVendor(req.body);

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getVendors(req, res, next) {
  try {
    const result = await vendorService.getVendors();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createVendor,
  getVendors
};