const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const { createApplicationSLA } = require("./slaService");
const { createAuditLog } = require("./auditLogService");

const createApplication = async (
  projectApprovalId,
  submittedBy
) => {
  const approvalResult = await pool.query(
    `
    SELECT
      pa.id,
      pa.project_id,
      pa.approval_type_id,
      pa.status AS approval_status
    FROM project_approvals pa

    JOIN projects p
      ON p.id = pa.project_id

    WHERE pa.id = $1
      AND p.owner_user_id = $2
    `,
    [projectApprovalId, submittedBy]
  );

  if (approvalResult.rows.length === 0) {
    return {
      error: "Approval not found or access denied",
    };
  }

  const approval = approvalResult.rows[0];

  if (
    approval.approval_status === "APPROVED" ||
    approval.approval_status === "REJECTED"
  ) {
    return {
      error:
        "An application cannot be created for an approved or rejected approval",
    };
  }

  const existingApplication = await pool.query(
    `
    SELECT
      id,
      application_number,
      status
    FROM applications
    WHERE project_approval_id = $1
      AND status NOT IN ('REJECTED')
    ORDER BY id DESC
    LIMIT 1
    `,
    [projectApprovalId]
  );

  if (existingApplication.rows.length > 0) {
    return {
      error: "An active application already exists for this approval",
      application: existingApplication.rows[0],
    };
  }

  const applicationNumber =
    `IND-${new Date().getFullYear()}-` +
    `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const result = await pool.query(
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
      projectApprovalId,
      applicationNumber,
      submittedBy,
    ]
  );

  return {
    application: result.rows[0],
  };
};

const getMyApplications = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.project_approval_id,
      a.application_number,
      a.submitted_by,
      a.assigned_officer_id,
      a.status,
      a.submitted_at,
      a.approved_at,
      a.rejected_at,
      a.rejection_reason,
      a.created_at,
      a.updated_at,

      p.id AS project_id,
      p.project_name,

      at.id AS approval_type_id,
      at.name AS approval_name,

      d.id AS department_id,
      d.name AS department_name

    FROM applications a

    JOIN project_approvals pa
      ON pa.id = a.project_approval_id

    JOIN projects p
      ON p.id = pa.project_id

    JOIN approval_types at
      ON at.id = pa.approval_type_id

    JOIN departments d
      ON d.id = at.department_id

    WHERE a.submitted_by = $1
    ORDER BY a.created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

const submitApplication = async (
  applicationId,
  userId
) => {
  const applicationResult = await pool.query(
    `
    SELECT
      a.id,
      a.project_approval_id,
      a.status,
      a.submitted_by,

      pa.project_id,
      pa.status AS approval_status

    FROM applications a

    JOIN project_approvals pa
      ON pa.id = a.project_approval_id

    JOIN projects p
      ON p.id = pa.project_id

    WHERE a.id = $1
      AND p.owner_user_id = $2
    `,
    [applicationId, userId]
  );

  if (applicationResult.rows.length === 0) {
    return {
      error: "Application not found or access denied",
    };
  }

  const application = applicationResult.rows[0];

  if (application.status !== "DRAFT") {
    return {
      error:
        "Only draft applications can be submitted",
    };
  }

  
  

  const result = await pool.query(
    `
    UPDATE applications
    SET
      status = 'SUBMITTED',
      submitted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
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
    [applicationId]
  );

  await pool.query(
  `
  UPDATE project_approvals
  SET
    status = 'SUBMITTED'
  WHERE id = $1
  `,
  [application.project_approval_id]
);

await createAuditLog({
  userId,
  action: "SUBMIT_APPLICATION",
  entityType: "APPLICATION",
  entityId: result.rows[0].id,
  oldValue: {
    status: "DRAFT",
  },
  newValue: {
    status: "SUBMITTED",
  },
});

await createApplicationSLA(applicationId);

await createNotification({
  userId,
  type: "APPLICATION_SUBMITTED",
  title: "Application Submitted",
  message: `Your application ${result.rows[0].application_number} has been successfully submitted.`,
  relatedEntityType: "APPLICATION",
  relatedEntityId: result.rows[0].id,
  channels: {
    inApp: true,
    email: false,
  },
});

  return {
    application: result.rows[0],
  };
};

module.exports = {
  createApplication,
  getMyApplications,
  submitApplication,
};