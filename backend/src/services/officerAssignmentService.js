const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const assignApplicationToOfficer = async (
  applicationId,
  officerUserId
) => {
  const officerResult = await pool.query(
    `
    SELECT
      u.id,
      u.department_id
    FROM users u
    JOIN roles r
      ON u.role_id = r.id
    WHERE u.id = $1
      AND r.name = 'OFFICER'
      AND u.is_active = true
    `,
    [officerUserId]
  );

  if (officerResult.rows.length === 0) {
    return {
      error: "OFFICER_NOT_FOUND",
    };
  }

  const departmentId = officerResult.rows[0].department_id;

  const applicationResult = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.assigned_officer_id,
      a.submitted_by,
      a.application_number,
      at.department_id
    FROM applications a

    JOIN project_approvals pa
      ON a.project_approval_id = pa.id

    JOIN approval_types at
      ON pa.approval_type_id = at.id

    WHERE a.id = $1
    `,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return {
      error: "APPLICATION_NOT_FOUND",
    };
  }

  const application = applicationResult.rows[0];

  if (application.department_id !== departmentId) {
    return {
      error: "DEPARTMENT_MISMATCH",
    };
  }

  if (application.status !== "SUBMITTED") {
    return {
      error: "INVALID_STATUS",
    };
  }

  if (application.assigned_officer_id) {
    return {
      error: "ALREADY_ASSIGNED",
    };
  }

  const updateResult = await pool.query(
    `
    UPDATE applications
    SET
      assigned_officer_id = $1,
      status = 'UNDER_REVIEW',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      application_number,
      assigned_officer_id,
      status,
      submitted_at,
      updated_at
    `,
    [officerUserId, applicationId]
  );

  // ============================================
  // CREATE IN-APP NOTIFICATION FOR ENTREPRENEUR
  // ============================================

  await createNotification({
    userId: application.submitted_by,
    type: "APPLICATION_ASSIGNED",
    title: "Application Assigned",
    message: `Your application ${application.application_number} has been assigned to an officer for processing.`,
    relatedEntityType: "APPLICATION",
    relatedEntityId: applicationId,
    channels: {
      inApp: true,
      email: false,
    },
  });

  return {
    application: updateResult.rows[0],
  };
};

module.exports = {
  assignApplicationToOfficer,
};