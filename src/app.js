const express = require("express");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const paymentRoutes = require("./routes/payment.routes");
const vendorRoutes = require("./routes/vendor.routes");
const serviceRoutes = require("./routes/service.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Event ERP API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", paymentRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/services", serviceRoutes);

app.use(errorHandler);

module.exports = app;