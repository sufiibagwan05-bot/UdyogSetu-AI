const pool = require("../config/db");

const getProjectChecklist = async (projectId, ownerUserId) => {
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name
    FROM projects p
    WHERE p.id = $1
      AND p.owner_user_id = $2
    `,
    [projectId, ownerUserId]
  );

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  const checklistResult = await pool.query(
    `
    SELECT
      pa.id AS project_approval_id,
      pa.approval_type_id,
      pa.applicability_status,
      pa.status,
      pa.reason,
      pa.conditions,
      pa.sla_days,
      pa.inspection_required,
      pa.renewal_required,

      at.code AS approval_code,
      at.name AS approval_name,
      at.description AS approval_description,

      d.id AS department_id,
      d.code AS department_code,
      d.name AS department_name,

      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', rd.id,
            'documentName', rd.document_name,
            'documentCode', rd.document_code,
            'description', rd.description,
            'isMandatory', rd.is_mandatory,
            'allowedFileTypes', rd.allowed_file_types,
            'maxFileSizeMb', rd.max_file_size_mb,
            'validityRequired', rd.validity_required
          )
          ORDER BY rd.id
        ) FILTER (WHERE rd.id IS NOT NULL),
        '[]'::json
      ) AS required_documents

    FROM project_approvals pa

    JOIN approval_types at
      ON at.id = pa.approval_type_id

    JOIN departments d
      ON d.id = pa.department_id

    LEFT JOIN required_documents rd
      ON rd.approval_type_id = pa.approval_type_id
      AND rd.is_active = true

    WHERE pa.project_id = $1

    GROUP BY
      pa.id,
      pa.approval_type_id,
      pa.applicability_status,
      pa.status,
      pa.reason,
      pa.conditions,
      pa.sla_days,
      pa.inspection_required,
      pa.renewal_required,
      at.code,
      at.name,
      at.description,
      d.id,
      d.code,
      d.name

    ORDER BY pa.id
    `,
    [projectId]
  );

  return {
    project,
    checklist: checklistResult.rows,
  };
};

module.exports = {
  getProjectChecklist,
};