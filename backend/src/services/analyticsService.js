const pool = require("../config/db");

const getEntrepreneurAnalytics = async (userId) => {
  const projectsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_projects
    FROM projects
    WHERE owner_user_id = $1
    `,
    [userId]
  );

  const applicationsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_applications,
      COUNT(*) FILTER (WHERE a.status = 'SUBMITTED') AS pending,
      COUNT(*) FILTER (WHERE a.status = 'UNDER_REVIEW') AS under_review,
      COUNT(*) FILTER (WHERE a.status = 'APPROVED') AS approved,
      COUNT(*) FILTER (WHERE a.status = 'REJECTED') AS rejected
    FROM applications a
    JOIN project_approvals pa
      ON pa.id = a.project_approval_id
    JOIN projects p
      ON p.id = pa.project_id
    WHERE p.owner_user_id = $1
    `,
    [userId]
  );

  return {
    projects: projectsResult.rows[0],
    applications: applicationsResult.rows[0],
  };
};

const getOfficerAnalytics = async (userId) => {
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
    [userId]
  );

  if (officerResult.rows.length === 0) {
    return null;
  }

  const departmentId = officerResult.rows[0].department_id;

  const applicationCountsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_applications,
      COUNT(*) FILTER (WHERE a.status = 'SUBMITTED') AS pending,
      COUNT(*) FILTER (WHERE a.status = 'UNDER_REVIEW') AS under_review,
      COUNT(*) FILTER (WHERE a.status = 'APPROVED') AS approved,
      COUNT(*) FILTER (WHERE a.status = 'REJECTED') AS rejected,
      COUNT(*) FILTER (
        WHERE a.assigned_officer_id = $1
      ) AS assigned_to_me
    FROM applications a
    JOIN project_approvals pa
      ON pa.id = a.project_approval_id
    JOIN approval_types at
      ON at.id = pa.approval_type_id
    WHERE at.department_id = $2
    `,
    [userId, departmentId]
  );

  const slaNearLimitResult = await pool.query(
    `
    SELECT
      COUNT(*) AS count
    FROM application_sla asla
    JOIN applications a
      ON a.id = asla.application_id
    JOIN project_approvals pa
      ON pa.id = a.project_approval_id
    JOIN approval_types at
      ON at.id = pa.approval_type_id
    JOIN sla_rules sr
      ON sr.id = asla.sla_rule_id
    WHERE at.department_id = $1
      AND asla.status = 'ACTIVE'
      AND CURRENT_TIMESTAMP < asla.due_date
      AND CURRENT_TIMESTAMP >= (
        asla.due_date -
        (sr.warning_threshold_days * INTERVAL '1 day')
      )
    `,
    [departmentId]
  );

  const slaBreachedResult = await pool.query(
    `
    SELECT
      COUNT(*) AS count
    FROM application_sla asla
    JOIN applications a
      ON a.id = asla.application_id
    JOIN project_approvals pa
      ON pa.id = a.project_approval_id
    JOIN approval_types at
      ON at.id = pa.approval_type_id
    WHERE at.department_id = $1
      AND asla.status = 'BREACHED'
    `,
    [departmentId]
  );

  return {
    officer: officerResult.rows[0],
    applications: applicationCountsResult.rows[0],
    sla: {
      near_limit: slaNearLimitResult.rows[0].count,
      breached: slaBreachedResult.rows[0].count,
    },
  };
};

const getAdminAnalytics = async () => {
  const applicationsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_applications,
      COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS pending,
      COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
      COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
      COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
    FROM applications
    `
  );

  const projectsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_projects
    FROM projects
    `
  );

  const departmentWorkloadResult = await pool.query(
    `
    SELECT
      d.id AS department_id,
      d.name AS department_name,
      COUNT(a.id) AS application_count
    FROM departments d
    LEFT JOIN approval_types at
      ON at.department_id = d.id
    LEFT JOIN project_approvals pa
      ON pa.approval_type_id = at.id
    LEFT JOIN applications a
      ON a.project_approval_id = pa.id
    GROUP BY d.id, d.name
    ORDER BY application_count DESC
    `
  );

  const slaResult = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (
        WHERE status = 'BREACHED'
      ) AS breached,
      COUNT(*) FILTER (
        WHERE status = 'ACTIVE'
          AND CURRENT_TIMESTAMP < due_date
      ) AS active
    FROM application_sla
    `
  );

  return {
    projects: projectsResult.rows[0],
    applications: applicationsResult.rows[0],
    department_workload: departmentWorkloadResult.rows,
    sla: slaResult.rows[0],
  };
};

const getAdminProjects = async () => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.business_type,
      p.investment_amount,
      p.project_size,
      p.project_stage,
      p.status,
      p.location,
      p.created_at,

      u.id AS owner_user_id,
      u.full_name AS entrepreneur_name,
      u.email AS entrepreneur_email

    FROM projects p

    JOIN users u
      ON u.id = p.owner_user_id

    ORDER BY p.created_at DESC
    `
  );

  return result.rows;
};

const getAdminApplications = async () => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.application_number,
      a.status,
      a.submitted_at,
      a.approved_at,
      a.rejected_at,
      a.rejection_reason,
      a.created_at,

      p.id AS project_id,
      p.project_name,

      at.id AS approval_type_id,
      at.name AS approval_name,

      d.id AS department_id,
      d.name AS department_name,

      u.id AS entrepreneur_id,
      u.full_name AS entrepreneur_name,
      u.email AS entrepreneur_email,

      a.assigned_officer_id

    FROM applications a

    JOIN project_approvals pa
      ON pa.id = a.project_approval_id

    JOIN projects p
      ON p.id = pa.project_id

    JOIN approval_types at
      ON at.id = pa.approval_type_id

    JOIN departments d
      ON d.id = at.department_id

    JOIN users u
      ON u.id = a.submitted_by

    ORDER BY a.created_at DESC
    `
  );

  return result.rows;
};

module.exports = {
  getEntrepreneurAnalytics,
  getOfficerAnalytics,
  getAdminAnalytics,
  getAdminProjects,
  getAdminApplications,
};