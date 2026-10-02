const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const raiseQuery = async (
  applicationId,
  officerUserId,
  queryText
) => {
  // Check officer
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
    return { error: "OFFICER_NOT_FOUND" };
  }

  const departmentId = officerResult.rows[0].department_id;

  // Check application
  const applicationResult = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.assigned_officer_id,
      a.submitted_by,
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
    return { error: "APPLICATION_NOT_FOUND" };
  }

  const application = applicationResult.rows[0];

  // Officer must belong to the application's department
  if (application.department_id !== departmentId) {
    return { error: "DEPARTMENT_MISMATCH" };
  }

  // Officer must be assigned to this application
  if (application.assigned_officer_id !== officerUserId) {
    return { error: "NOT_ASSIGNED_TO_OFFICER" };
  }

  // Query can only be raised while application is under review
  if (application.status !== "UNDER_REVIEW") {
    return { error: "INVALID_STATUS" };
  }

  // Validate query text
  if (!queryText || !queryText.trim()) {
    return { error: "QUERY_TEXT_REQUIRED" };
  }

    const result = await pool.query(
    `
    INSERT INTO application_queries
    (
      application_id,
      raised_by,
      query_text,
      status,
      raised_at
    )
    VALUES
    (
      $1,
      $2,
      $3,
      'OPEN',
      CURRENT_TIMESTAMP
    )
    RETURNING
      id,
      application_id,
      raised_by,
      query_text,
      response_text,
      status,
      raised_at,
      responded_at,
      resolved_at
    `,
    [
      applicationId,
      officerUserId,
      queryText.trim(),
    ]
  );

  await createNotification({
    userId: application.submitted_by,
    type: "QUERY_RAISED",
    title: "Query Raised",
    message: `A query has been raised for your application ${applicationId}: ${queryText.trim()}`,
    relatedEntityType: "APPLICATION",
    relatedEntityId: applicationId,
    channels: {
      inApp: true,
      email: false,
    },
  });

  return {
    query: result.rows[0],
  };
};

module.exports = {
  raiseQuery,
};