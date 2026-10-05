const pool = require("../config/database");

async function createService(data) {
  const { name, unit_price } = data;

  if (!name || unit_price === undefined) {
    const error = new Error("Service name and unit price are required");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO services (name, unit_price, is_active)
     VALUES (?, ?, TRUE)`,
    [name, unit_price]
  );

  return {
    id: result.insertId,
    name,
    unit_price
  };
}

async function getServices() {
  const [rows] = await pool.query(
    `SELECT * FROM services
     WHERE is_active = TRUE
     ORDER BY id DESC`
  );

  return rows;
}

async function addServiceToEvent(eventId, data) {
  const { serviceId, quantity } = data;

  if (!serviceId || !quantity || quantity <= 0) {
    const error = new Error("Service ID and valid quantity are required");
    error.statusCode = 400;
    throw error;
  }

  const [services] = await pool.query(
    `SELECT id, unit_price
     FROM services
     WHERE id = ? AND is_active = TRUE`,
    [serviceId]
  );

  if (services.length === 0) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO event_services
     (event_id, service_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)`,
    [
      eventId,
      serviceId,
      quantity,
      services[0].unit_price
    ]
  );

  return {
    id: result.insertId,
    eventId,
    serviceId,
    quantity,
    unitPrice: services[0].unit_price
  };
}

module.exports = {
  createService,
  getServices,
  addServiceToEvent
};