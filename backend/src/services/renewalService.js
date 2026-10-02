const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const getRenewalByApplication = async (applicationId) => {
  const result = await pool.query(
    `
      SELECT
        r.id,
        r.application_id,
        r.approval_type_id,
        r.current_valid_from,
        r.current_valid_until,
        r.renewal_due_date,
        r.status,
        r.renewal_application_id,
        r.created_at,
        r.updated_at
      FROM renewals r
      WHERE r.application_id = $1
    `,
    [applicationId]
  );

  if (result.rows.length === 0) {
    return {
      error: "Renewal record not found",
    };
  }

  return {
    renewal: result.rows[0],
  };
};

const createRenewalApplication = async (
  applicationId,
  userId
) => {
  try {
    const renewalResult = await pool.query(
      `
      SELECT
        r.id AS renewal_id,
        r.application_id,
        r.status AS renewal_status,
        r.renewal_application_id,

        a.application_number,
        a.submitted_by,
        a.status AS application_status,

        a.project_approval_id,
        pa.project_id,
        pa.approval_type_id

      FROM renewals r

      JOIN applications a
        ON a.id = r.application_id

      JOIN project_approvals pa
        ON pa.id = a.project_approval_id

      JOIN projects p
        ON p.id = pa.project_id

      WHERE r.application_id = $1
        AND p.owner_user_id = $2
      `,
      [applicationId, userId]
    );

    if (renewalResult.rows.length === 0) {
      return {
        error: "Renewal record not found or access denied",
      };
    }

    const renewal = renewalResult.rows[0];

    if (renewal.application_status !== "APPROVED") {
      return {
        error:
          "Renewal can only be created for an approved application",
      };
    }

    if (renewal.renewal_status !== "ACTIVE") {
      return {
        error: "This renewal is not active",
      };
    }

    if (renewal.renewal_application_id) {
      return {
        error: "A renewal application already exists",
        renewalApplicationId:
          renewal.renewal_application_id,
      };
    }

    const applicationNumber =
      `REN-${new Date().getFullYear()}-` +
      `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const applicationResult = await pool.query(
      `
      INSERT INTO applications
      (
        project_approval_id,
        application_number,
        submitted_by,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'DRAFT'
      )
      RETURNING
        id,
        project_approval_id,
        application_number,
        submitted_by,
        assigned_officer_id,
        status,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        created_at,
        updated_at
      `,
      [
        renewal.project_approval_id,
        applicationNumber,
        userId,
      ]
    );

    const newApplication = applicationResult.rows[0];

    await pool.query(
      `
      UPDATE renewals
      SET
        renewal_application_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [
        newApplication.id,
        renewal.renewal_id,
      ]
    );

    return {
      application: newApplication,
    };
  } catch (error) {
    console.error(
      "Create renewal application error:",
      error
    );

    return {
      error: error.message,
    };
  }
};

const checkRenewalReminders = async () => {
  try {
    const result = await pool.query(`
      SELECT
        r.id AS renewal_id,
        r.application_id,
        r.renewal_due_date,
        a.application_number,
        a.submitted_by
      FROM renewals r
      JOIN applications a
        ON a.id = r.application_id
      WHERE r.status = 'ACTIVE'
        AND CURRENT_DATE < r.renewal_due_date
        AND CURRENT_DATE >= r.renewal_due_date - INTERVAL '5 days'
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = a.submitted_by
            AND n.type = 'RENEWAL_REMINDER'
            AND n.related_entity_type = 'APPLICATION'
            AND n.related_entity_id = a.id
            AND n.created_at >= r.created_at
        )
    `);

    for (const renewal of result.rows) {
      await createNotification({
        userId: renewal.submitted_by,
        type: "RENEWAL_REMINDER",
        title: "Renewal Reminder",
        message: `Your approval for application ${renewal.application_number} is approaching its renewal due date.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: renewal.application_id,
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
    console.error("Check renewal reminders error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

const checkRenewalDue = async () => {
  try {
    const result = await pool.query(`
      SELECT
        r.id AS renewal_id,
        r.application_id,
        r.renewal_due_date,
        a.application_number,
        a.submitted_by
      FROM renewals r
      JOIN applications a
        ON a.id = r.application_id
      WHERE r.status = 'ACTIVE'
        AND CURRENT_DATE >= r.renewal_due_date
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = a.submitted_by
            AND n.type = 'RENEWAL_DUE'
            AND n.related_entity_type = 'APPLICATION'
            AND n.related_entity_id = a.id
            AND n.created_at >= r.created_at
        )
    `);

    for (const renewal of result.rows) {
      await createNotification({
        userId: renewal.submitted_by,
        type: "RENEWAL_DUE",
        title: "Renewal Due",
        message: `Your approval for application ${renewal.application_number} has reached its renewal due date. Please submit the renewal application.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: renewal.application_id,
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
    console.error("Check renewal due error:", error);

    return {
      checked: 0,
      error: error.message,
    };
  }
};

module.exports = {
  getRenewalByApplication,
  createRenewalApplication,
  checkRenewalReminders,
  checkRenewalDue,
};