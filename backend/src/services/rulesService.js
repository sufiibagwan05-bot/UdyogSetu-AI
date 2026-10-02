const pool = require("../config/db");

const evaluateCondition = (conditionKey, conditionValue, project) => {
  switch (conditionKey) {
    case "state":
      return project.state_code === conditionValue;

    case "sector":
      return project.sector_code === conditionValue;

    case "business_type":
  return (
    typeof project.business_type === "string" &&
    project.business_type.trim().toUpperCase() ===
      String(conditionValue).trim().toUpperCase()
  );

    case "environment_required":
      return project.environment_required === conditionValue;

    case "water_required":
      return project.water_required === conditionValue;

    case "electricity_required":
      return project.electricity_required === conditionValue;

    case "fire_safety_required":
      return project.fire_safety_required === conditionValue;

    case "employee_count_min":
      return (
        project.employee_count !== null &&
        project.employee_count >= Number(conditionValue)
      );

    default:
      return false;
  }
};

const evaluateRule = (conditions, project) => {
  const conditionEntries = Object.entries(conditions || {});

  if (conditionEntries.length === 0) {
    return false;
  }

  return conditionEntries.every(([key, value]) =>
    evaluateCondition(key, value, project)
  );
};

const evaluateProjectRules = async (projectId, ownerUserId) => {
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.owner_user_id,
      p.project_name,
      p.business_type,
      p.employee_count,
      p.environment_required,
      p.water_required,
      p.electricity_required,
      p.fire_safety_required,

      st.code AS state_code,

      s.code AS sector_code

    FROM projects p

    JOIN states st
      ON st.id = p.state_id

    JOIN industry_sectors s
      ON s.id = p.sector_id

    WHERE p.id = $1
      AND p.owner_user_id = $2
    `,
    [projectId, ownerUserId]
  );

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  const rulesResult = await pool.query(
    `
    SELECT
      rr.id,
      rr.approval_type_id,
      rr.rule_name,
      rr.description,
      rr.conditions,
      rr.priority,
      rr.source_reference,

      at.code AS approval_code,
      at.name AS approval_name,
      at.description AS approval_description,

      d.id AS department_id,
      d.code AS department_code,
      d.name AS department_name

    FROM regulatory_rules rr

    JOIN approval_types at
      ON at.id = rr.approval_type_id

    JOIN departments d
      ON d.id = at.department_id

    WHERE rr.is_active = true
      AND at.is_active = true
    ORDER BY rr.priority DESC, rr.id ASC
    `
  );

  const applicableRules = rulesResult.rows.filter((rule) =>
  evaluateRule(rule.conditions, project)
);

for (const rule of applicableRules) {
  await pool.query(
    `
    INSERT INTO project_approvals
    (
      project_id,
      approval_type_id,
      department_id,
      applicability_status,
      reason,
      conditions,
      status,
      required_documents_summary,
      inspection_required,
      renewal_required
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'NOT_STARTED',
      '[]'::jsonb,
      false,
      false
    )
    ON CONFLICT (project_id, approval_type_id)
    DO UPDATE SET
      department_id = EXCLUDED.department_id,
      applicability_status = EXCLUDED.applicability_status,
      reason = EXCLUDED.reason,
      conditions = EXCLUDED.conditions,
      updated_at = NOW()
    `,
    [
      project.id,
      rule.approval_type_id,
      rule.department_id,
      "POTENTIALLY_APPLICABLE",
      rule.description,
      rule.conditions,
    ]
  );
}

return {
  project,
  applicableRules,
};
};

module.exports = {
  evaluateProjectRules,
};