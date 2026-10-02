const pool = require("../config/db");

const getOfficerApplications = async (officerUserId) => {
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
    return null;
  }

  const departmentId = officerResult.rows[0].department_id;

  const applicationsResult = await pool.query(
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
      d.name AS department_name,

      u.full_name AS entrepreneur_name,
      u.email AS entrepreneur_email

    FROM applications a

    JOIN project_approvals pa
      ON a.project_approval_id = pa.id

    JOIN projects p
      ON pa.project_id = p.id

    JOIN approval_types at
      ON pa.approval_type_id = at.id

    JOIN departments d
      ON at.department_id = d.id

    JOIN users u
      ON a.submitted_by = u.id

    WHERE d.id = $1

    ORDER BY a.created_at DESC
    `,
    [departmentId]
  );

  return {
    officer: officerResult.rows[0],
    applications: applicationsResult.rows,
  };
};

module.exports = {
  getOfficerApplications,
};