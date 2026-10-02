const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const { createAuditLog } = require("./auditLogService");

const reviewApplication = async (
  applicationId,
  officerUserId,
  decision,
  rejectionReason = null
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

  if (application.assigned_officer_id !== officerUserId) {
    return {
      error: "NOT_ASSIGNED_TO_OFFICER",
    };
  }

  if (application.status !== "UNDER_REVIEW") {
    return {
      error: "INVALID_STATUS",
    };
  }

  if (decision === "REJECTED" && !rejectionReason) {
    return {
      error: "REJECTION_REASON_REQUIRED",
    };
  }

  if (decision === "APPROVED") {
    const inspectionResult = await pool.query(
      `
      SELECT
        i.id AS inspection_id,
        i.status AS inspection_status,
        ir.result AS inspection_result
      FROM inspections i

      LEFT JOIN inspection_reports ir
        ON ir.inspection_id = i.id

      WHERE i.application_id = $1
      ORDER BY i.created_at DESC
      LIMIT 1
      `,
      [applicationId]
    );

    if (inspectionResult.rows.length > 0) {
      const inspection = inspectionResult.rows[0];

      if (
        inspection.inspection_status !== "COMPLETED" ||
        inspection.inspection_result !== "PASSED"
      ) {
        return {
          error: "INSPECTION_NOT_PASSED",
        };
      }
    }
  }

  let updateQuery;
  let values;

  if (decision === "APPROVED") {
    updateQuery = `
      UPDATE applications
      SET
        status = 'APPROVED',
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        application_number,
        assigned_officer_id,
        status,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        updated_at
    `;

    values = [applicationId];
  } else {
    updateQuery = `
      UPDATE applications
      SET
        status = 'REJECTED',
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        application_number,
        assigned_officer_id,
        status,
        submitted_at,
        approved_at,
        rejected_at,
        rejection_reason,
        updated_at
    `;

    values = [rejectionReason, applicationId];
  }

  const updateResult = await pool.query(
    updateQuery,
    values
  );

  const renewalResult = await pool.query(
  `
  SELECT
    id,
    application_id
  FROM renewals
  WHERE renewal_application_id = $1
  `,
  [applicationId]
);

if (
  renewalResult.rows.length > 0 &&
  decision === "APPROVED"
) {
  await pool.query(
    `
    UPDATE renewals
    SET
      status = 'RENEWED',
      current_valid_from = current_valid_until + INTERVAL '1 day',
      current_valid_until = current_valid_until + INTERVAL '1 year',
      renewal_due_date = current_valid_until + INTERVAL '1 year' - INTERVAL '5 days',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    `,
    [renewalResult.rows[0].id]
  );
}

if (
  renewalResult.rows.length > 0 &&
  decision === "REJECTED"
) {
  await pool.query(
    `
    UPDATE renewals
    SET
      status = 'RENEWAL_REJECTED',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    `,
    [renewalResult.rows[0].id]
  );
}

  await pool.query(
    `
    UPDATE project_approvals
    SET
      status = $1
    WHERE id = (
      SELECT project_approval_id
      FROM applications
      WHERE id = $2
    )
    `,
    [decision, applicationId]
  );

  await createAuditLog({
  userId: officerUserId,
  action:
    decision === "APPROVED"
      ? "APPROVE_APPLICATION"
      : "REJECT_APPLICATION",
  entityType: "APPLICATION",
  entityId: applicationId,
  oldValue: {
    status: application.status,
  },
  newValue: {
    status: decision,
  },
});

  // ============================================
  // APPLICATION APPROVED NOTIFICATION
  // ============================================

  if (decision === "APPROVED") {
    await createNotification({
      userId: application.submitted_by,
      type: "APPLICATION_APPROVED",
      title: "Application Approved",
      message: `Your application ${updateResult.rows[0].application_number} has been approved successfully.`,
      relatedEntityType: "APPLICATION",
      relatedEntityId: applicationId,
      channels: {
        inApp: true,
        email: true,
      },
    });
  }

  // ============================================
  // APPLICATION REJECTED NOTIFICATION
  // ============================================

  if (decision === "REJECTED") {
    await createNotification({
      userId: application.submitted_by,
      type: "APPLICATION_REJECTED",
      title: "Application Rejected",
      message: `Your application ${updateResult.rows[0].application_number} has been rejected. Reason: ${rejectionReason}`,
      relatedEntityType: "APPLICATION",
      relatedEntityId: applicationId,
      channels: {
        inApp: true,
        email: true,
      },
    });
  }

  return {
    application: updateResult.rows[0],
  };
};

module.exports = {
  reviewApplication,
};