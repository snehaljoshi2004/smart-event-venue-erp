const paymentService = require("../services/payment.service");

async function addPayment(req, res, next) {
  try {
    const result = await paymentService.addPayment(
      req.params.eventId,
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addPayment
};