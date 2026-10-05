const pool = require("../config/database");

async function createVendor(data) {
  const { name, email, phone, service_type } = data;

  if (!name) {
    const error = new Error("Vendor name is required");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO vendors (name, email, phone, service_type)
     VALUES (?, ?, ?, ?)`,
    [name, email || null, phone || null, service_type || null]
  );

  return {
    id: result.insertId,
    name,
    email: email || null,
    phone: phone || null,
    service_type: service_type || null
  };
}

async function getVendors() {
  const [rows] = await pool.query(
    `SELECT * FROM vendors ORDER BY id DESC`
  );

  return rows;
}

module.exports = {
  createVendor,
  getVendors
};