const pool = require("../config/db");

const getProjectDocuments = async (projectId, ownerUserId) => {
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
    return null;
  }

  const documentsResult = await pool.query(
    `
    SELECT
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
    FROM project_documents
    WHERE project_id = $1
      AND is_active = true
    ORDER BY uploaded_at DESC, id DESC
    `,
    [projectId]
  );

  return {
    project: projectResult.rows[0],
    documents: documentsResult.rows,
  };
};

module.exports = {
  getProjectDocuments,
};