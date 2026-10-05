// const pool = require("../config/database");

// const BLOCKING_STATUSES = ["CONFIRMED", "IN PROGRESS"];

// function isOverlapping(newStart, newEnd, existingStart, existingEnd) {
//   return newStart < existingEnd && newEnd > existingStart;
// }

// async function createEvent(data, userId) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const {
//       customerId,
//       hallId,
//       title,
//       startAt,
//       endAt,
//       guestCount,
//       staff = [],
//       equipment = []
//     } = data;

//     if (!customerId || !hallId || !title || !startAt || !endAt || !guestCount) {
//       const error = new Error("Required event fields are missing");
//       error.statusCode = 400;
//       throw error;
//     }

//     if (new Date(endAt) <= new Date(startAt)) {
//       const error = new Error("Event end time must be after start time");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Check hall exists
//     const [halls] = await connection.query(
//       `SELECT id, capacity
//        FROM halls
//        WHERE id = ? AND is_active = TRUE`,
//       [hallId]
//     );

//     if (halls.length === 0) {
//       const error = new Error("Hall not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     if (guestCount > halls[0].capacity) {
//       const error = new Error("Guest count exceeds hall capacity");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Create event as PLANNED.
//     // PLANNED events do not block resources.
//     const [eventResult] = await connection.query(
//       `INSERT INTO events
//        (customer_id, hall_id, title, start_at, end_at, guest_count, status, total_amount)
//        VALUES (?, ?, ?, ?, ?, ?, 'PLANNED', 0)`,
//       [
//         customerId,
//         hallId,
//         title,
//         startAt,
//         endAt,
//         guestCount
//       ]
//     );

//     const eventId = eventResult.insertId;

//     // Add staff
//     for (const staffId of staff) {
//       await connection.query(
//         `INSERT INTO event_staff (event_id, staff_id)
//          VALUES (?, ?)`,
//         [eventId, staffId]
//       );
//     }

//     // Add equipment
//     for (const item of equipment) {
//       await connection.query(
//         `INSERT INTO event_equipment
//          (event_id, equipment_id, quantity)
//          VALUES (?, ?, ?)`,
//         [eventId, item.equipmentId, item.quantity]
//       );
//     }

//     // Audit
//     await connection.query(
//       `INSERT INTO audit_logs
//        (user_id, event_id, action, details)
//        VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         eventId,
//         "EVENT_CREATED",
//         JSON.stringify({ status: "PLANNED" })
//       ]
//     );

//     await connection.commit();

//     return {
//       id: eventId,
//       status: "PLANNED"
//     };
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// async function confirmEvent(eventId, userId) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     // Lock event
//     const [events] = await connection.query(
//       `SELECT *
//        FROM events
//        WHERE id = ?
//        FOR UPDATE`,
//       [eventId]
//     );

//     if (events.length === 0) {
//       const error = new Error("Event not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     const event = events[0];

//     if (event.status !== "PLANNED") {
//       const error = new Error(
//         `Cannot confirm event from ${event.status} status`
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     // -------------------------
//     // VENUE / HALL CONFLICT
//     // -------------------------

//     const [hallConflicts] = await connection.query(
//       `SELECT id
//        FROM events
//        WHERE hall_id = ?
//          AND id != ?
//          AND status IN ('CONFIRMED', 'IN PROGRESS')
//          AND start_at < ?
//          AND end_at > ?
//        FOR UPDATE`,
//       [
//         event.hall_id,
//         event.id,
//         event.end_at,
//         event.start_at
//       ]
//     );

//     if (hallConflicts.length > 0) {
//       const error = new Error(
//         "Hall is already booked during this time"
//       );
//       error.statusCode = 409;
//       throw error;
//     }

//     // -------------------------
//     // STAFF CONFLICT
//     // -------------------------

//     const [staffAssignments] = await connection.query(
//       `SELECT staff_id
//        FROM event_staff
//        WHERE event_id = ?`,
//       [eventId]
//     );

//     for (const assignment of staffAssignments) {
//       const [conflicts] = await connection.query(
//         `SELECT es.event_id
//          FROM event_staff es
//          JOIN events e ON e.id = es.event_id
//          WHERE es.staff_id = ?
//            AND es.event_id != ?
//            AND e.status IN ('CONFIRMED', 'IN PROGRESS')
//            AND e.start_at < ?
//            AND e.end_at > ?
//          LIMIT 1
//          FOR UPDATE`,
//         [
//           assignment.staff_id,
//           eventId,
//           event.end_at,
//           event.start_at
//         ]
//       );

//       if (conflicts.length > 0) {
//         const error = new Error(
//           `Staff member ${assignment.staff_id} is already assigned to another event`
//         );
//         error.statusCode = 409;
//         throw error;
//       }
//     }

//     // -------------------------
//     // EQUIPMENT CONFLICT
//     // -------------------------

//     const [equipmentAssignments] = await connection.query(
//       `SELECT equipment_id, quantity
//        FROM event_equipment
//        WHERE event_id = ?`,
//       [eventId]
//     );

//     for (const item of equipmentAssignments) {
//       const [equipmentRows] = await connection.query(
//         `SELECT total_quantity
//          FROM equipment
//          WHERE id = ?
//          FOR UPDATE`,
//         [item.equipment_id]
//       );

//       if (equipmentRows.length === 0) {
//         const error = new Error(
//           `Equipment ${item.equipment_id} not found`
//         );
//         error.statusCode = 404;
//         throw error;
//       }

//       const [reservedRows] = await connection.query(
//         `SELECT COALESCE(SUM(ee.quantity), 0) AS reserved
//          FROM event_equipment ee
//          JOIN events e ON e.id = ee.event_id
//          WHERE ee.equipment_id = ?
//            AND ee.event_id != ?
//            AND e.status IN ('CONFIRMED', 'IN PROGRESS')
//            AND e.start_at < ?
//            AND e.end_at > ?`,
//         [
//           item.equipment_id,
//           eventId,
//           event.end_at,
//           event.start_at
//         ]
//       );

//       const reserved = Number(reservedRows[0].reserved);
//       const available =
//         Number(equipmentRows[0].total_quantity) - reserved;

//       if (item.quantity > available) {
//         const error = new Error(
//           `Not enough equipment ${item.equipment_id}. Available: ${available}`
//         );
//         error.statusCode = 409;
//         throw error;
//       }
//     }

//     // Confirm event
//     await connection.query(
//       `UPDATE events
//        SET status = 'CONFIRMED'
//        WHERE id = ?`,
//       [eventId]
//     );

//     // Audit
//     await connection.query(
//       `INSERT INTO audit_logs
//        (user_id, event_id, action, details)
//        VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         eventId,
//         "EVENT_CONFIRMED",
//         JSON.stringify({
//           status: "CONFIRMED"
//         })
//       ]
//     );

//     await connection.commit();

//     return {
//       id: eventId,
//       status: "CONFIRMED"
//     };
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }


// async function updateEventStatus(eventId, newStatus, userId) {
//   const allowedTransitions = {
//     CONFIRMED: ["IN PROGRESS", "CANCELLED"],
//     "IN PROGRESS": ["COMPLETED"],
//     PLANNED: ["CANCELLED"]
//   };

//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [events] = await connection.query(
//       `SELECT id, status
//        FROM events
//        WHERE id = ?
//        FOR UPDATE`,
//       [eventId]
//     );

//     if (events.length === 0) {
//       const error = new Error("Event not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     const currentStatus = events[0].status;

//     if (
//       !allowedTransitions[currentStatus] ||
//       !allowedTransitions[currentStatus].includes(newStatus)
//     ) {
//       const error = new Error(
//         `Invalid status transition from ${currentStatus} to ${newStatus}`
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     await connection.query(
//       `UPDATE events
//        SET status = ?
//        WHERE id = ?`,
//       [newStatus, eventId]
//     );

//     await connection.query(
//       `INSERT INTO audit_logs
//        (user_id, event_id, action, details)
//        VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         eventId,
//         "STATUS_CHANGED",
//         JSON.stringify({
//           from: currentStatus,
//           to: newStatus
//         })
//       ]
//     );

//     await connection.commit();

//     return {
//       id: eventId,
//       status: newStatus
//     };
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// async function cancelEvent(eventId, userId) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [events] = await connection.query(
//       `SELECT id, status
//        FROM events
//        WHERE id = ?
//        FOR UPDATE`,
//       [eventId]
//     );

//     if (events.length === 0) {
//       const error = new Error("Event not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     const currentStatus = events[0].status;

//     if (currentStatus === "COMPLETED") {
//       const error = new Error("Completed events cannot be cancelled");
//       error.statusCode = 400;
//       throw error;
//     }

//     if (currentStatus === "CANCELLED") {
//       const error = new Error("Event is already cancelled");
//       error.statusCode = 400;
//       throw error;
//     }

//     await connection.query(
//       `UPDATE events
//        SET status = 'CANCELLED'
//        WHERE id = ?`,
//       [eventId]
//     );

//     await connection.query(
//       `INSERT INTO audit_logs
//        (user_id, event_id, action, details)
//        VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         eventId,
//         "EVENT_CANCELLED",
//         JSON.stringify({
//           from: currentStatus,
//           to: "CANCELLED"
//         })
//       ]
//     );

//     await connection.commit();

//     return {
//       id: eventId,
//       status: "CANCELLED"
//     };
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// async function getEvents(filters = {}) {
//   let query = `
//     SELECT
//       e.id,
//       e.title,
//       e.start_at,
//       e.end_at,
//       e.guest_count,
//       e.status,
//       e.total_amount,
//       c.name AS customer_name,
//       h.name AS hall_name
//     FROM events e
//     JOIN customers c ON c.id = e.customer_id
//     JOIN halls h ON h.id = e.hall_id
//     WHERE 1 = 1
//   `;

//   const params = [];

//   if (filters.status) {
//     query += ` AND e.status = ?`;
//     params.push(filters.status);
//   }

//   if (filters.customerId) {
//     query += ` AND e.customer_id = ?`;
//     params.push(filters.customerId);
//   }

//   query += ` ORDER BY e.start_at DESC`;

//   const [rows] = await pool.query(query, params);

//   return rows;
// }

// module.exports = {
//   createEvent,
//   confirmEvent,
//   updateEventStatus,
//   cancelEvent,
//   getEvents
// };





const pool = require("../config/database");

function isOverlapping(newStart, newEnd, existingStart, existingEnd) {
  return newStart < existingEnd && newEnd > existingStart;
}

// ======================================================
// CREATE EVENT
// ======================================================

async function createEvent(data, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      customerId,
      hallId,
      title,
      startAt,
      endAt,
      guestCount,
      staff = [],
      equipment = [],
      services = []
    } = data;

    if (
      !customerId ||
      !hallId ||
      !title ||
      !startAt ||
      !endAt ||
      !guestCount
    ) {
      const error = new Error("Required event fields are missing");
      error.statusCode = 400;
      throw error;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      const error = new Error("Event end time must be after start time");
      error.statusCode = 400;
      throw error;
    }

    // Check customer exists
    const [customers] = await connection.query(
      `SELECT id
       FROM customers
       WHERE id = ?`,
      [customerId]
    );

    if (customers.length === 0) {
      const error = new Error("Customer not found");
      error.statusCode = 404;
      throw error;
    }

    // Check hall exists and capacity
    const [halls] = await connection.query(
      `SELECT id, capacity
       FROM halls
       WHERE id = ? AND is_active = TRUE`,
      [hallId]
    );

    if (halls.length === 0) {
      const error = new Error("Hall not found");
      error.statusCode = 404;
      throw error;
    }

    if (Number(guestCount) > Number(halls[0].capacity)) {
      const error = new Error("Guest count exceeds hall capacity");
      error.statusCode = 400;
      throw error;
    }

    // ==================================================
    // SERVER-SIDE PRICE CALCULATION
    // Never trust totalAmount from the client.
    // ==================================================

    let totalAmount = 0;
    const serviceDetails = [];

    for (const item of services) {
      if (
        !item.serviceId ||
        !item.quantity ||
        Number(item.quantity) <= 0
      ) {
        const error = new Error(
          "Each service must have a valid serviceId and quantity"
        );
        error.statusCode = 400;
        throw error;
      }

      const [serviceRows] = await connection.query(
        `SELECT id, name, unit_price
         FROM services
         WHERE id = ? AND is_active = TRUE`,
        [item.serviceId]
      );

      if (serviceRows.length === 0) {
        const error = new Error(
          `Service ${item.serviceId} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      const service = serviceRows[0];

      const quantity = Number(item.quantity);
      const unitPrice = Number(service.unit_price);

      totalAmount += quantity * unitPrice;

      serviceDetails.push({
        serviceId: service.id,
        quantity,
        unitPrice
      });
    }

    // ==================================================
    // CREATE EVENT AS PLANNED
    // ==================================================

    const [eventResult] = await connection.query(
      `INSERT INTO events
       (
         customer_id,
         hall_id,
         title,
         start_at,
         end_at,
         guest_count,
         status,
         total_amount
       )
       VALUES (?, ?, ?, ?, ?, ?, 'PLANNED', ?)`,
      [
        customerId,
        hallId,
        title,
        startAt,
        endAt,
        guestCount,
        totalAmount
      ]
    );

    const eventId = eventResult.insertId;

    // ==================================================
    // ADD SERVICES
    // ==================================================

    for (const service of serviceDetails) {
      await connection.query(
        `INSERT INTO event_services
         (
           event_id,
           service_id,
           quantity,
           unit_price
         )
         VALUES (?, ?, ?, ?)`,
        [
          eventId,
          service.serviceId,
          service.quantity,
          service.unitPrice
        ]
      );
    }

    // ==================================================
    // ADD STAFF
    // ==================================================

    for (const staffId of staff) {
      const [staffRows] = await connection.query(
        `SELECT id
         FROM staff
         WHERE id = ? AND is_active = TRUE`,
        [staffId]
      );

      if (staffRows.length === 0) {
        const error = new Error(
          `Staff member ${staffId} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      await connection.query(
        `INSERT INTO event_staff
         (event_id, staff_id)
         VALUES (?, ?)`,
        [eventId, staffId]
      );
    }

    // ==================================================
    // ADD EQUIPMENT
    // ==================================================

    for (const item of equipment) {
      if (
        !item.equipmentId ||
        !item.quantity ||
        Number(item.quantity) <= 0
      ) {
        const error = new Error(
          "Each equipment item must have a valid equipmentId and quantity"
        );
        error.statusCode = 400;
        throw error;
      }

      const [equipmentRows] = await connection.query(
        `SELECT id, total_quantity
         FROM equipment
         WHERE id = ? AND is_active = TRUE`,
        [item.equipmentId]
      );

      if (equipmentRows.length === 0) {
        const error = new Error(
          `Equipment ${item.equipmentId} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      if (
        Number(item.quantity) >
        Number(equipmentRows[0].total_quantity)
      ) {
        const error = new Error(
          `Requested equipment quantity exceeds total available quantity`
        );
        error.statusCode = 400;
        throw error;
      }

      await connection.query(
        `INSERT INTO event_equipment
         (event_id, equipment_id, quantity)
         VALUES (?, ?, ?)`,
        [
          eventId,
          item.equipmentId,
          item.quantity
        ]
      );
    }

    // ==================================================
    // AUDIT
    // ==================================================

    await connection.query(
      `INSERT INTO audit_logs
       (user_id, event_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        eventId,
        "EVENT_CREATED",
        JSON.stringify({
          status: "PLANNED",
          totalAmount
        })
      ]
    );

    await connection.commit();

    return {
      id: eventId,
      status: "PLANNED",
      totalAmount
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// CONFIRM EVENT
// ======================================================

async function confirmEvent(eventId, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock event
    const [events] = await connection.query(
      `SELECT *
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

    const event = events[0];

    if (event.status !== "PLANNED") {
      const error = new Error(
        `Cannot confirm event from ${event.status} status`
      );
      error.statusCode = 400;
      throw error;
    }

    // ==================================================
    // RE-CALCULATE PRICE FROM DATABASE
    // ==================================================

    const [eventServices] = await connection.query(
      `SELECT
         es.service_id,
         es.quantity,
         s.unit_price
       FROM event_services es
       JOIN services s ON s.id = es.service_id
       WHERE es.event_id = ?
       FOR UPDATE`,
      [eventId]
    );

    let recalculatedTotal = 0;

    for (const service of eventServices) {
      recalculatedTotal +=
        Number(service.quantity) *
        Number(service.unit_price);
    }

    await connection.query(
      `UPDATE events
       SET total_amount = ?
       WHERE id = ?`,
      [recalculatedTotal, eventId]
    );

    // ==================================================
    // HALL CONFLICT
    // ==================================================

    const [hallConflicts] = await connection.query(
      `SELECT id
       FROM events
       WHERE hall_id = ?
         AND id != ?
         AND status IN ('CONFIRMED', 'IN PROGRESS')
         AND start_at < ?
         AND end_at > ?
       FOR UPDATE`,
      [
        event.hall_id,
        event.id,
        event.end_at,
        event.start_at
      ]
    );

    if (hallConflicts.length > 0) {
      const error = new Error(
        "Hall is already booked during this time"
      );
      error.statusCode = 409;
      throw error;
    }

    // ==================================================
    // STAFF CONFLICT
    // ==================================================

    const [staffAssignments] = await connection.query(
      `SELECT staff_id
       FROM event_staff
       WHERE event_id = ?`,
      [eventId]
    );

    for (const assignment of staffAssignments) {
      const [conflicts] = await connection.query(
        `SELECT es.event_id
         FROM event_staff es
         JOIN events e ON e.id = es.event_id
         WHERE es.staff_id = ?
           AND es.event_id != ?
           AND e.status IN ('CONFIRMED', 'IN PROGRESS')
           AND e.start_at < ?
           AND e.end_at > ?
         LIMIT 1
         FOR UPDATE`,
        [
          assignment.staff_id,
          eventId,
          event.end_at,
          event.start_at
        ]
      );

      if (conflicts.length > 0) {
        const error = new Error(
          `Staff member ${assignment.staff_id} is already assigned to another event`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // ==================================================
    // EQUIPMENT CONFLICT / AVAILABILITY
    // ==================================================

    const [equipmentAssignments] = await connection.query(
      `SELECT equipment_id, quantity
       FROM event_equipment
       WHERE event_id = ?`,
      [eventId]
    );

    for (const item of equipmentAssignments) {
      const [equipmentRows] = await connection.query(
        `SELECT total_quantity
         FROM equipment
         WHERE id = ?
         FOR UPDATE`,
        [item.equipment_id]
      );

      if (equipmentRows.length === 0) {
        const error = new Error(
          `Equipment ${item.equipment_id} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      const [reservedRows] = await connection.query(
        `SELECT COALESCE(SUM(ee.quantity), 0) AS reserved
         FROM event_equipment ee
         JOIN events e ON e.id = ee.event_id
         WHERE ee.equipment_id = ?
           AND ee.event_id != ?
           AND e.status IN ('CONFIRMED', 'IN PROGRESS')
           AND e.start_at < ?
           AND e.end_at > ?`,
        [
          item.equipment_id,
          eventId,
          event.end_at,
          event.start_at
        ]
      );

      const reserved = Number(reservedRows[0].reserved);

      const available =
        Number(equipmentRows[0].total_quantity) -
        reserved;

      if (Number(item.quantity) > available) {
        const error = new Error(
          `Not enough equipment ${item.equipment_id}. Available: ${available}`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // ==================================================
    // CONFIRM
    // ==================================================

    await connection.query(
      `UPDATE events
       SET status = 'CONFIRMED'
       WHERE id = ?`,
      [eventId]
    );

    // ==================================================
    // AUDIT
    // ==================================================

    await connection.query(
      `INSERT INTO audit_logs
       (user_id, event_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        eventId,
        "EVENT_CONFIRMED",
        JSON.stringify({
          status: "CONFIRMED",
          totalAmount: recalculatedTotal
        })
      ]
    );

    await connection.commit();

    return {
      id: eventId,
      status: "CONFIRMED",
      totalAmount: recalculatedTotal
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// UPDATE EVENT STATUS
// ======================================================

async function updateEventStatus(eventId, newStatus, userId) {
  const allowedTransitions = {
    CONFIRMED: ["IN PROGRESS", "CANCELLED"],
    "IN PROGRESS": ["COMPLETED"],
    PLANNED: ["CANCELLED"]
  };

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [events] = await connection.query(
      `SELECT id, status
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

    const currentStatus = events[0].status;

    if (
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(newStatus)
    ) {
      const error = new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
      error.statusCode = 400;
      throw error;
    }

    await connection.query(
      `UPDATE events
       SET status = ?
       WHERE id = ?`,
      [newStatus, eventId]
    );

    await connection.query(
      `INSERT INTO audit_logs
       (user_id, event_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        eventId,
        "STATUS_CHANGED",
        JSON.stringify({
          from: currentStatus,
          to: newStatus
        })
      ]
    );

    await connection.commit();

    return {
      id: eventId,
      status: newStatus
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// CANCEL EVENT
// ======================================================

async function cancelEvent(eventId, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [events] = await connection.query(
      `SELECT id, status
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

    const currentStatus = events[0].status;

    if (currentStatus === "COMPLETED") {
      const error = new Error(
        "Completed events cannot be cancelled"
      );
      error.statusCode = 400;
      throw error;
    }

    if (currentStatus === "CANCELLED") {
      const error = new Error("Event is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    await connection.query(
      `UPDATE events
       SET status = 'CANCELLED'
       WHERE id = ?`,
      [eventId]
    );

    await connection.query(
      `INSERT INTO audit_logs
       (user_id, event_id, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        eventId,
        "EVENT_CANCELLED",
        JSON.stringify({
          from: currentStatus,
          to: "CANCELLED"
        })
      ]
    );

    await connection.commit();

    return {
      id: eventId,
      status: "CANCELLED"
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// GET EVENTS
// ======================================================

async function getEvents(filters = {}) {
  let query = `
    SELECT
      e.id,
      e.title,
      e.start_at,
      e.end_at,
      e.guest_count,
      e.status,
      e.total_amount,
      c.name AS customer_name,
      h.name AS hall_name
    FROM events e
    JOIN customers c ON c.id = e.customer_id
    JOIN halls h ON h.id = e.hall_id
    WHERE 1 = 1
  `;

  const params = [];

  if (filters.status) {
    query += ` AND e.status = ?`;
    params.push(filters.status);
  }

  if (filters.customerId) {
    query += ` AND e.customer_id = ?`;
    params.push(filters.customerId);
  }

  query += ` ORDER BY e.start_at DESC`;

  const [rows] = await pool.query(query, params);

  return rows;
}

module.exports = {
  createEvent,
  confirmEvent,
  updateEventStatus,
  cancelEvent,
  getEvents
};