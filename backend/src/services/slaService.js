const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const createApplicationSLA = async (applicationId) => {
  // Get application approval type and department
  const applicationResult = await pool.query(
    `
    SELECT
      a.id AS application_id,
      pa.approval_type_id,
      at.department_id
    FROM applications a
    JOIN project_approvals pa
      ON pa.id = a.project_approval_id
    JOIN approval_types at
      ON at.id = pa.approval_type_id
    WHERE a.id = $1
    `,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return {
      error: "Application not found",
    };
  }

  const application = applicationResult.rows[0];

  // Find matching active SLA rule
  const slaRuleResult = await pool.query(
    `
    SELECT
      id,
      approval_type_id,
      department_id,
      duration_days,
      warning_threshold_days
    FROM sla_rules
    WHERE approval_type_id = $1
      AND department_id = $2
      AND is_active = true
    LIMIT 1
    `,
    [
      application.approval_type_id,
      application.department_id,
    ]
  );

  if (slaRuleResult.rows.length === 0) {
    return {
      error: "No active SLA rule found for this application",
    };
  }

  const slaRule = slaRuleResult.rows[0];

  // Prevent duplicate SLA
  const existingSLAResult = await pool.query(
    `
    SELECT
      id,
      application_id,
      sla_rule_id,
      start_date,
      due_date,
      completed_date,
      status,
      breached_at
    FROM application_sla
    WHERE application_id = $1
    `,
    [applicationId]
  );

  if (existingSLAResult.rows.length > 0) {
    return {
      sla: existingSLAResult.rows[0],
      alreadyExists: true,
    };
  }

  // Create SLA
  const result = await pool.query(
    `
    INSERT INTO application_sla
    (
      application_id,
      sla_rule_id,
      start_date,
      due_date,
      status
    )
    VALUES
    (
      $1,
      $2,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + ($3 * INTERVAL '1 day'),
      'ACTIVE'
    )
    RETURNING
      id,
      application_id,
      sla_rule_id,
      start_date,
      due_date,
      completed_date,
      status,
      breached_at
    `,
    [
      applicationId,
      slaRule.id,
      slaRule.duration_days,
    ]
  );

  return {
    sla: result.rows[0],
    alreadyExists: false,
  };
};

const getApplicationSLA = async (applicationId) => {
  const result = await pool.query(
    `
    SELECT
      asla.id,
      asla.application_id,
      asla.sla_rule_id,
      asla.start_date,
      asla.due_date,
      asla.completed_date,
      asla.status,
      asla.breached_at,
      sr.duration_days,
      sr.warning_threshold_days
    FROM application_sla asla
    JOIN sla_rules sr
      ON sr.id = asla.sla_rule_id
    WHERE asla.application_id = $1
    `,
    [applicationId]
  );

  if (result.rows.length === 0) {
    return {
      error: "SLA not found for this application",
    };
  }

  return {
    sla: result.rows[0],
  };
};

const checkApproachingSLAs = async () => {
  try {
    const result = await pool.query(
      `
      SELECT
        asla.id AS sla_id,
        asla.application_id,
        asla.due_date,
        a.application_number,
        a.submitted_by,
        sr.warning_threshold_days
      FROM application_sla asla
      JOIN applications a
        ON a.id = asla.application_id
      JOIN sla_rules sr
        ON sr.id = asla.sla_rule_id
      WHERE asla.status = 'ACTIVE'
  AND CURRENT_TIMESTAMP < asla.due_date
  AND CURRENT_TIMESTAMP >= (
    asla.due_date -
    (sr.warning_threshold_days * INTERVAL '1 day')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.user_id = a.submitted_by
      AND n.type = 'SLA_APPROACHING'
      AND n.related_entity_type = 'APPLICATION'
      AND n.related_entity_id = a.id
      AND n.created_at >= asla.start_date
  )
      `
    );

    for (const sla of result.rows) {
      await createNotification({
        userId: sla.submitted_by,
        type: "SLA_APPROACHING",
        title: "SLA Approaching",
        message: `Your application ${sla.application_number} is approaching its SLA deadline.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: sla.application_id,
        channels: {
          inApp: true,
          email: false,
        },
      });
    }

    return {
      checked: result.rows.length,
    };
  } catch (error) {
    console.error("Check approaching SLAs error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

const checkBreachedSLAs = async () => {
  try {
    const result = await pool.query(`
      SELECT
        asla.id AS sla_id,
        asla.application_id,
        asla.due_date,
        a.application_number,
        a.submitted_by
      FROM application_sla asla
      JOIN applications a
        ON a.id = asla.application_id
      WHERE asla.status = 'ACTIVE'
        AND CURRENT_TIMESTAMP > asla.due_date
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = a.submitted_by
            AND n.type = 'SLA_BREACHED'
            AND n.related_entity_type = 'APPLICATION'
            AND n.related_entity_id = a.id
            AND n.created_at >= asla.start_date
        )
    `);

    for (const sla of result.rows) {
      await pool.query(`
        UPDATE application_sla
        SET
          status = 'BREACHED',
          breached_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND status = 'ACTIVE'
      `, [sla.sla_id]);

      await createNotification({
        userId: sla.submitted_by,
        type: "SLA_BREACHED",
        title: "SLA Breached",
        message: `The SLA deadline for your application ${sla.application_number} has been breached.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: sla.application_id,
        channels: {
          inApp: true,
          email: true,
        },
      });
    }

    return {
      checked: result.rows.length,
    };
  } catch (error) {
    console.error("Check breached SLAs error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

module.exports = {
  createApplicationSLA,
  getApplicationSLA,
  checkApproachingSLAs,
  checkBreachedSLAs,
};