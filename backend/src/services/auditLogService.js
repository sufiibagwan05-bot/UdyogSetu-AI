const pool = require("../config/db");

const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) => {
  const result = await pool.query(
    `
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      ip_address
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `,
    [
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
    ]
  );

  return result.rows[0];
};

module.exports = {
  createAuditLog,
};