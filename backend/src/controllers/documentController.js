const path = require("path");

const pool = require("../config/db");
const { createAuditLog } = require("../services/auditLogService");

const {
  getProjectDocuments,
} = require("../services/documentService");

const getDocumentsForProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const ownerUserId = req.user.userId;

    const result = await getProjectDocuments(
      projectId,
      ownerUserId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project documents retrieved successfully",
      project: result.project,
      documents: result.documents,
    });
  } catch (error) {
    console.error("GET PROJECT DOCUMENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve project documents",
    });
  }
};

const uploadProjectDocument = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const ownerUserId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    const projectResult = await pool.query(
      `
      SELECT
        id,
        project_name
      FROM projects
      WHERE id = $1
        AND owner_user_id = $2
      `,
      [projectId, ownerUserId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const {
      documentType,
      documentName,
      expiryDate,
    } = req.body;

    if (!documentType || !documentName) {
      return res.status(400).json({
        success: false,
        message: "documentType and documentName are required",
      });
    }

    const requirementResult = await pool.query(
  `
  SELECT
    document_code,
    allowed_file_types,
    max_file_size_mb
  FROM required_documents
  WHERE document_code = $1
    AND document_name = $2
    AND is_active = true
  LIMIT 1
  `,
  [documentType, documentName]
);

if (requirementResult.rows.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid or unsupported document type",
  });
}

const requirement = requirementResult.rows[0];

const allowedFileTypes = requirement.allowed_file_types || [];
const maxFileSizeMb = requirement.max_file_size_mb;

const uploadedExtension = req.file.originalname
  .split(".")
  .pop()
  .toLowerCase();

if (
  allowedFileTypes.length > 0 &&
  !allowedFileTypes
    .map((type) => type.toLowerCase())
    .includes(uploadedExtension)
) {
  return res.status(400).json({
    success: false,
    message: `Invalid file type. Allowed types: ${allowedFileTypes.join(", ")}`,
  });
}

if (
  maxFileSizeMb !== null &&
  req.file.size > Number(maxFileSizeMb) * 1024 * 1024
) {
  return res.status(400).json({
    success: false,
    message: `File size exceeds the maximum allowed size of ${maxFileSizeMb} MB`,
  });
}

    const versionResult = await pool.query(
  `
  SELECT
    COALESCE(MAX(version), 0) AS latest_version
  FROM project_documents
  WHERE project_id = $1
    AND document_type = $2
  `,
  [projectId, documentType]
);

const latestVersion = Number(
  versionResult.rows[0].latest_version
);

const newVersion = latestVersion + 1;

await pool.query(
  `
  UPDATE project_documents
  SET is_active = false
  WHERE project_id = $1
    AND document_type = $2
    AND is_active = true
  `,
  [projectId, documentType]
);

    const fileUrl = `/uploads/${req.file.filename}`;

    const documentResult = await pool.query(
      `
      INSERT INTO project_documents
      (
        project_id,
        uploaded_by,
        document_type,
        document_name,
        file_name,
        file_url,
        file_size,
        mime_type,
        expiry_date,
        verification_status,
        version,
        is_active
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        'PENDING',
$10,
true
      )
      RETURNING
        id,
        project_id,
        uploaded_by,
        document_type,
        document_name,
        file_name,
        file_url,
        file_size,
        mime_type,
        uploaded_at,
        expiry_date,
        verification_status,
        version,
        is_active
      `,
      [
        projectId,
        ownerUserId,
        documentType,
        documentName,
        req.file.originalname,
        fileUrl,
        req.file.size,
        req.file.mimetype,
        expiryDate || null,
        newVersion,
      ]
    );

        await createAuditLog({
      userId: ownerUserId,
      action: "UPLOAD_DOCUMENT",
      entityType: "PROJECT_DOCUMENT",
      entityId: documentResult.rows[0].id,
      oldValue: null,
      newValue: {
        projectId: documentResult.rows[0].project_id,
        documentType: documentResult.rows[0].document_type,
        documentName: documentResult.rows[0].document_name,
        version: documentResult.rows[0].version,
        verificationStatus: documentResult.rows[0].verification_status,
      },
    });

    res.status(201).json({
      success: true,
      message: "Project document uploaded successfully",
      document: documentResult.rows[0],
    });
  } catch (error) {
    console.error("UPLOAD PROJECT DOCUMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload project document",
    });
  }
};

module.exports = {
  getDocumentsForProject,
  uploadProjectDocument,
};