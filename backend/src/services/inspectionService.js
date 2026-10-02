const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const { createAuditLog } = require("./auditLogService");

const createInspection = async ({
  applicationId,
  officerId,
  scheduledDate,
  location,
  remarks,
}) => {
  // Verify the officer
  const officerResult = await pool.query(
    `
    SELECT
      u.id,
      u.is_active,
      r.name AS role_name
    FROM users u
    JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
    `,
    [officerId]
  );

  if (officerResult.rows.length === 0) {
    return { error: "Officer not found" };
  }

  const officer = officerResult.rows[0];

  if (!officer.is_active || officer.role_name !== "OFFICER") {
    return { error: "Invalid or inactive officer" };
  }

  // Verify the application and its assigned officer
  const applicationResult = await pool.query(
    `
    SELECT
      a.id AS application_id,
      a.application_number,
      a.status AS application_status,
      a.assigned_officer_id,
      a.submitted_by,
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
    return { error: "Application not found" };
  }

  const application = applicationResult.rows[0];

  if (application.assigned_officer_id !== officerId) {
    return { error: "Officer is not assigned to this application" };
  }

  if (application.application_status !== "UNDER_REVIEW") {
    return {
      error: "Inspection can only be created for an application under review",
    };
  }

  // Prevent multiple active inspections
  const existingInspectionResult = await pool.query(
    `
    SELECT id
    FROM inspections
    WHERE application_id = $1
      AND status IN ('SCHEDULED', 'IN_PROGRESS')
    LIMIT 1
    `,
    [applicationId]
  );

  if (existingInspectionResult.rows.length > 0) {
    return {
      error: "An active inspection already exists for this application",
    };
  }

  const result = await pool.query(
    `
    INSERT INTO inspections
    (
      application_id,
      assigned_officer_id,
      scheduled_date,
      status,
      location,
      remarks
    )
    VALUES
    (
      $1,
      $2,
      $3,
      'SCHEDULED',
      $4,
      $5
    )
    RETURNING
      id,
      application_id,
      assigned_officer_id,
      scheduled_date,
      inspection_date,
      status,
      location,
      remarks,
      created_at,
      updated_at
    `,
    [
      applicationId,
      officerId,
      scheduledDate,
      location || null,
      remarks || null,
    ]
  );

    await createAuditLog({
    userId: officerId,
    action: "CREATE_INSPECTION",
    entityType: "INSPECTION",
    entityId: result.rows[0].id,
    oldValue: null,
    newValue: {
      applicationId: result.rows[0].application_id,
      status: result.rows[0].status,
      scheduledDate: result.rows[0].scheduled_date,
      location: result.rows[0].location,
    },
  });

  await createNotification({
    userId: application.submitted_by,
    type: "INSPECTION_SCHEDULED",
    title: "Inspection Scheduled",
    message: `An inspection has been scheduled for your application ${applicationId}.`,
    relatedEntityType: "APPLICATION",
    relatedEntityId: applicationId,
    channels: {
      inApp: true,
      email: false,
    },
  });

  return {
    inspection: result.rows[0],
  };
};

const getInspectionByApplication = async (applicationId, officerId) => {
  const applicationResult = await pool.query(
    `
    SELECT
      a.id AS application_id,
      a.assigned_officer_id
    FROM applications a
    WHERE a.id = $1
    `,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return { error: "Application not found" };
  }

  const application = applicationResult.rows[0];

  if (application.assigned_officer_id !== officerId) {
    return { error: "Officer is not assigned to this application" };
  }

  const result = await pool.query(
    `
    SELECT
      i.id,
      i.application_id,
      i.assigned_officer_id,
      i.scheduled_date,
      i.inspection_date,
      i.status,
      i.location,
      i.remarks,
      i.created_at,
      i.updated_at
    FROM inspections i
    WHERE i.application_id = $1
    ORDER BY i.created_at DESC
    `,
    [applicationId]
  );

  return {
    inspections: result.rows,
  };
};

const startInspection = async (inspectionId, officerId) => {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.application_id,
      i.assigned_officer_id,
      i.status
    FROM inspections i
    WHERE i.id = $1
    `,
    [inspectionId]
  );

  if (result.rows.length === 0) {
    return { error: "Inspection not found" };
  }

  const inspection = result.rows[0];

  if (inspection.assigned_officer_id !== officerId) {
    return { error: "Officer is not assigned to this inspection" };
  }

  if (inspection.status !== "SCHEDULED") {
    return {
      error: "Only a scheduled inspection can be started",
    };
  }

  const updateResult = await pool.query(
    `
    UPDATE inspections
    SET
      status = 'IN_PROGRESS',
      inspection_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      application_id,
      assigned_officer_id,
      scheduled_date,
      inspection_date,
      status,
      location,
      remarks,
      created_at,
      updated_at
    `,
    [inspectionId]
  );

  return {
    inspection: updateResult.rows[0],
  };
};

const completeInspection = async (
  inspectionId,
  officerId,
  remarks
) => {
  const result = await pool.query(
    `
    SELECT
      id,
      application_id,
      assigned_officer_id,
      status
    FROM inspections
    WHERE id = $1
    `,
    [inspectionId]
  );

  if (result.rows.length === 0) {
    return { error: "Inspection not found" };
  }

  const inspection = result.rows[0];

  if (inspection.assigned_officer_id !== officerId) {
    return { error: "Officer is not assigned to this inspection" };
  }

  if (inspection.status !== "IN_PROGRESS") {
    return {
      error: "Only an in-progress inspection can be completed",
    };
  }

  const updateResult = await pool.query(
    `
    UPDATE inspections
    SET
      status = 'COMPLETED',
      remarks = COALESCE($2, remarks),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      application_id,
      assigned_officer_id,
      scheduled_date,
      inspection_date,
      status,
      location,
      remarks,
      created_at,
      updated_at
    `,
    [inspectionId, remarks || null]
  );

  const applicationResult = await pool.query(
    `
    SELECT submitted_by
    FROM applications
    WHERE id = $1
    `,
    [inspection.application_id]
  );

  if (applicationResult.rows.length > 0) {
    await createNotification({
      userId: applicationResult.rows[0].submitted_by,
      type: "INSPECTION_COMPLETED",
      title: "Inspection Completed",
      message: `The inspection for your application ${inspection.application_id} has been completed.`,
      relatedEntityType: "APPLICATION",
      relatedEntityId: inspection.application_id,
      channels: {
        inApp: true,
        email: false,
      },
    });
  }

  return {
    inspection: updateResult.rows[0],
  };
};

const createInspectionReport = async ({
  inspectionId,
  inspectorId,
  result,
  findings,
  issues,
  recommendation,
}) => {
  // Verify inspection
  const inspectionResult = await pool.query(
    `
    SELECT
      id,
      application_id,
      assigned_officer_id,
      status
    FROM inspections
    WHERE id = $1
    `,
    [inspectionId]
  );

  if (inspectionResult.rows.length === 0) {
    return { error: "Inspection not found" };
  }

  const inspection = inspectionResult.rows[0];

  if (inspection.assigned_officer_id !== inspectorId) {
    return {
      error: "Officer is not assigned to this inspection",
    };
  }

  if (inspection.status !== "COMPLETED") {
    return {
      error: "Inspection must be completed before creating a report",
    };
  }

  const allowedResults = [
    "PASSED",
    "ISSUES_FOUND",
    "FAILED",
  ];

  if (!allowedResults.includes(result)) {
    return {
      error: "Invalid inspection result",
    };
  }

  // Prevent duplicate report
  const existingReportResult = await pool.query(
    `
    SELECT id
    FROM inspection_reports
    WHERE inspection_id = $1
    `,
    [inspectionId]
  );

  if (existingReportResult.rows.length > 0) {
    return {
      error: "Inspection report already exists",
    };
  }

  const reportResult = await pool.query(
    `
    INSERT INTO inspection_reports
    (
      inspection_id,
      inspector_id,
      result,
      findings,
      issues,
      recommendation
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )
    RETURNING
      id,
      inspection_id,
      inspector_id,
      result,
      findings,
      issues,
      recommendation,
      report_file_url,
      created_at
    `,
    [
      inspectionId,
      inspectorId,
      result,
      findings || null,
      issues || null,
      recommendation || null,
    ]
  );

  // Send important notification when inspection fails
  if (result === "FAILED") {
    const applicationResult = await pool.query(
      `
      SELECT submitted_by
      FROM applications
      WHERE id = $1
      `,
      [inspection.application_id]
    );

    if (applicationResult.rows.length > 0) {
      await createNotification({
        userId: applicationResult.rows[0].submitted_by,
        type: "INSPECTION_FAILED",
        title: "Inspection Failed",
        message: `The inspection for your application ${inspection.application_id} has failed. Please review the inspection findings and required actions.`,
        relatedEntityType: "APPLICATION",
        relatedEntityId: inspection.application_id,
        channels: {
          inApp: true,
          email: true,
        },
      });
    }
  }

  return {
    report: reportResult.rows[0],
  };
};

const getInspectionReport = async (
  inspectionId,
  inspectorId
) => {
  const inspectionResult = await pool.query(
    `
    SELECT
      id,
      assigned_officer_id
    FROM inspections
    WHERE id = $1
    `,
    [inspectionId]
  );

  if (inspectionResult.rows.length === 0) {
    return { error: "Inspection not found" };
  }

  const inspection = inspectionResult.rows[0];

  if (inspection.assigned_officer_id !== inspectorId) {
    return {
      error: "Officer is not assigned to this inspection",
    };
  }

  const result = await pool.query(
    `
    SELECT
      id,
      inspection_id,
      inspector_id,
      result,
      findings,
      issues,
      recommendation,
      report_file_url,
      created_at
    FROM inspection_reports
    WHERE inspection_id = $1
    `,
    [inspectionId]
  );

  return {
    report: result.rows[0] || null,
  };
};

module.exports = {
  createInspection,
  getInspectionByApplication,
  startInspection,
  completeInspection,
  createInspectionReport,
  getInspectionReport,
};