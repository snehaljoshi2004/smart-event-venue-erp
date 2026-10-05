const pool = require("../config/database");

async function addPayment(eventId, data, userId) {
  const { amount, method, reference } = data;

  if (!amount || amount <= 0) {
    const error = new Error("Payment amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (!method) {
    const error = new Error("Payment method is required");
    error.statusCode = 400;
    throw error;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [events] = await connection.query(
      `SELECT id, total_amount
       FROM events
       WHERE id = ?
       FOR UPDATE`,
      [eventId]
    );

    if (events.length === 0) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    const [payments] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid
       FROM payments
       WHERE event_id = ?`,
      [eventId]
    );

    const paid = Number(payments[0].paid);
    const total = Number(events[0].total_amount);

    if (paid + Number(amount) > total && total > 0) {
      const error = new Error("Payment exceeds event total amount");
      error.statusCode = 400;
      throw error;
    }

    const [result] = await connection.query(
      `INSERT INTO payments
       (event_id, amount, method, reference, paid_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [eventId, amount, method, reference || null]
    );

    await connection.query(
      `INSERT INTO audit_logs
       (user_id, event_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        eventId,
        "PAYMENT_ADDED",
        JSON.stringify({
          amount,
          method,
          reference: reference || null
        })
      ]
    );

    await connection.commit();

    return {
      id: result.insertId,
      eventId,
      amount: Number(amount),
      method
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  addPayment
};