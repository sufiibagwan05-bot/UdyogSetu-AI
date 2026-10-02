const pool = require("../config/db");

const runDocumentPrecheck = async (documentId, ownerUserId) => {
  const documentResult = await pool.query(
    `
    SELECT
      pd.id,
      pd.project_id,
      pd.document_type,
      pd.document_name,
      pd.file_name,
      pd.file_size,
      pd.mime_type,
      pd.expiry_date,
      pd.verification_status,
      pd.version,
      pd.is_active,

      p.owner_user_id,

      rd.id AS required_document_id,
      rd.document_name AS required_document_name,
      rd.document_code,
      rd.is_mandatory,
      rd.allowed_file_types,
      rd.max_file_size_mb,
      rd.validity_required

    FROM project_documents pd

    JOIN projects p
      ON p.id = pd.project_id

    LEFT JOIN required_documents rd
      ON rd.document_code = pd.document_type
      AND rd.document_name = pd.document_name
      AND rd.is_active = true

    WHERE pd.id = $1
      AND p.owner_user_id = $2
      AND pd.is_active = true
    `,
    [documentId, ownerUserId]
  );

  if (documentResult.rows.length === 0) {
    return null;
  }

  const document = documentResult.rows[0];

  const issues = [];

  if (!document.required_document_id) {
    issues.push({
      code: "REQUIREMENT_NOT_FOUND",
      severity: "ERROR",
      message:
        "No active document requirement was found for this document.",
    });
  }

  if (document.required_document_id) {
    const allowedFileTypes =
      document.allowed_file_types || [];

    const uploadedExtension = document.file_name
      .split(".")
      .pop()
      .toLowerCase();

    if (
      allowedFileTypes.length > 0 &&
      !allowedFileTypes
        .map((type) => type.toLowerCase())
        .includes(uploadedExtension)
    ) {
      issues.push({
        code: "INVALID_FILE_TYPE",
        severity: "ERROR",
        message:
          `Uploaded file type .${uploadedExtension} is not allowed.`,
      });
    }

    if (
      document.max_file_size_mb !== null &&
      document.file_size >
        Number(document.max_file_size_mb) * 1024 * 1024
    ) {
      issues.push({
        code: "FILE_SIZE_EXCEEDED",
        severity: "ERROR",
        message:
          `File size exceeds the configured maximum of ${document.max_file_size_mb} MB.`,
      });
    }

    if (
      document.validity_required &&
      !document.expiry_date
    ) {
      issues.push({
        code: "EXPIRY_DATE_MISSING",
        severity: "WARNING",
        message:
          "An expiry date is required for this document but has not been provided.",
      });
    }

    if (
      document.validity_required &&
      document.expiry_date
    ) {
      const expiryDate = new Date(
        document.expiry_date
      );

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        issues.push({
          code: "DOCUMENT_EXPIRED",
          severity: "ERROR",
          message:
            "The document expiry date has already passed.",
        });
      }
    }
  }

  let overallStatus = "PASS";

  if (
    issues.some(
      (issue) => issue.severity === "ERROR"
    )
  ) {
    overallStatus = "ERROR";
  } else if (
    issues.some(
      (issue) => issue.severity === "WARNING"
    )
  ) {
    overallStatus = "WARNING";
  }

  const precheckResult = await pool.query(
    `
    INSERT INTO document_prechecks
    (
      project_document_id,
      overall_status,
      issues
    )
    VALUES
    (
      $1,
      $2,
      $3
    )
    RETURNING
      id,
      project_document_id,
      overall_status,
      issues,
      checked_at
    `,
    [
      documentId,
      overallStatus,
      JSON.stringify(issues),
    ]
  );

  return {
    document,
    precheck: precheckResult.rows[0],
  };
};

const getLatestDocumentPrecheck = async (
  documentId,
  ownerUserId
) => {
  const result = await pool.query(
    `
    SELECT
      dp.id,
      dp.project_document_id,
      dp.overall_status,
      dp.issues,
      dp.checked_at
    FROM document_prechecks dp

    JOIN project_documents pd
      ON pd.id = dp.project_document_id

    JOIN projects p
      ON p.id = pd.project_id

    WHERE dp.project_document_id = $1
      AND p.owner_user_id = $2

    ORDER BY dp.checked_at DESC, dp.id DESC
    LIMIT 1
    `,
    [documentId, ownerUserId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

module.exports = {
  runDocumentPrecheck,
  getLatestDocumentPrecheck,
};