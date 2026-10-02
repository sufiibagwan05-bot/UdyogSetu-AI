const pool = require("../config/db");

const getProjectApprovalWorkflow = async (
  projectId,
  userId
) => {
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.owner_user_id,
      p.status
    FROM projects p
    WHERE p.id = $1
      AND p.owner_user_id = $2
    `,
    [projectId, userId]
  );

  if (projectResult.rows.length === 0) {
    return {
      error: "Project not found or access denied",
    };
  }

  const approvalsResult = await pool.query(
    `
    SELECT
      pa.id AS project_approval_id,

      at.id AS approval_type_id,
      at.name AS approval_name,

      d.id AS department_id,
      d.name AS department_name,

      pa.status AS approval_status,

      a.id AS application_id,
      a.application_number,
      a.status AS application_status,
      a.assigned_officer_id,
      a.submitted_at,
      a.approved_at,
      a.rejected_at,
      a.rejection_reason

    FROM project_approvals pa

    JOIN approval_types at
      ON at.id = pa.approval_type_id

    JOIN departments d
      ON d.id = at.department_id

    LEFT JOIN applications a
      ON a.project_approval_id = pa.id

    WHERE pa.project_id = $1

    ORDER BY pa.id
    `,
    [projectId]
  );

  return {
    project: projectResult.rows[0],
    approvals: approvalsResult.rows,
  };
};

module.exports = {
  getProjectApprovalWorkflow,
};