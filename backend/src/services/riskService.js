const pool = require("../config/db");

const evaluateCondition = (
  condition,
  project,
  context
) => {
  if (condition.environment_required === true) {
    if (project.environment_required !== true) {
      return false;
    }
  }

  if (condition.investment_amount_min !== undefined) {
    if (
      Number(project.investment_amount) <
      Number(condition.investment_amount_min)
    ) {
      return false;
    }
  }

  if (condition.employee_count_min !== undefined) {
    if (
      Number(project.employee_count || 0) <
      Number(condition.employee_count_min)
    ) {
      return false;
    }
  }

  if (condition.missing_documents === true) {
    if (context.missingDocuments !== true) {
      return false;
    }
  }

  if (condition.inconsistent_information === true) {
    if (context.inconsistentInformation !== true) {
      return false;
    }
  }

  return true;
};

const calculateRisk = async (
  applicationId,
  assessedBy = null
) => {

     const officerResult = await pool.query(
  `
  SELECT
    u.id,
    u.role_id,
    u.department_id,
    r.name AS role_name
  FROM users u
  JOIN roles r
    ON r.id = u.role_id
  WHERE u.id = $1
    AND u.is_active = true
  `,
  [assessedBy]
);

if (officerResult.rows.length === 0) {
  return {
    error: "Officer not found or inactive",
  };
}

const officer = officerResult.rows[0];

if (officer.role_name !== "OFFICER") {
  return {
    error: "Only officers can perform risk assessment",
  };
}

  const applicationResult = await pool.query(
    `
    SELECT
      a.id AS application_id,
      a.status AS application_status,
a.assigned_officer_id,

      pa.id AS project_approval_id,
      pa.project_id,

      p.project_name,
      p.investment_amount,
      p.employee_count,
      p.environment_required,

      at.name AS approval_name,
at.department_id

    FROM applications a

    JOIN project_approvals pa
      ON pa.id = a.project_approval_id

    JOIN projects p
      ON p.id = pa.project_id

    JOIN approval_types at
      ON at.id = pa.approval_type_id

    WHERE a.id = $1
    `,
    [applicationId]
  );

  if (applicationResult.rows.length === 0) {
    return {
      error: "Application not found",
    };
  }

  const application = applicationResult.rows[0];

  if (
  officer.department_id !== application.department_id
) {
  return {
    error:
      "Officer does not belong to the application's department",
  };
}

if (
  application.assigned_officer_id !== officer.id
) {
  return {
    error:
      "Officer is not assigned to this application",
  };
}

  const documentsResult = await pool.query(
    `
    SELECT
      rd.id,
      rd.document_name,
      rd.document_code,
      rd.is_mandatory,

      pd.id AS project_document_id

    FROM required_documents rd

    JOIN project_approvals pa
      ON pa.approval_type_id = rd.approval_type_id

    LEFT JOIN project_documents pd
      ON pd.project_id = pa.project_id
      AND pd.document_type = rd.document_code
      AND pd.is_active = true

    WHERE pa.id = $1
      AND rd.is_active = true
    `,
    [application.project_approval_id]
  );

  const missingDocuments =
    documentsResult.rows.some(
      (document) =>
        document.is_mandatory === true &&
        !document.project_document_id
    );

  const inconsistentInformation = false;

  const context = {
    missingDocuments,
    inconsistentInformation,
  };

  const rulesResult = await pool.query(
    `
    SELECT
      id,
      name,
      description,
      condition,
      risk_level,
      weight
    FROM risk_rules
    WHERE is_active = true
    ORDER BY id
    `
  );

  let riskScore = 0;

  const factors = [];

  for (const rule of rulesResult.rows) {
    const matched = evaluateCondition(
      rule.condition,
      application,
      context
    );

    if (!matched) {
      continue;
    }

    riskScore += Number(rule.weight);

    factors.push({
      ruleId: rule.id,
      ruleName: rule.name,
      riskLevel: rule.risk_level,
      weight: rule.weight,
      description: rule.description,
    });
  }

  let riskLevel = "LOW";

  if (riskScore >= 60) {
    riskLevel = "HIGH";
  } else if (riskScore >= 30) {
    riskLevel = "MEDIUM";
  }

  let recommendation =
    "Proceed with normal scrutiny.";

  if (riskLevel === "MEDIUM") {
    recommendation =
      "Additional verification is recommended before approval.";
  }

  if (riskLevel === "HIGH") {
    recommendation =
      "Detailed scrutiny and inspection should be considered.";
  }

  const result = await pool.query(
  `
  INSERT INTO risk_assessments
  (
    application_id,
    risk_level,
    risk_score,
    factors,
    recommendation,
    assessed_by
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
  ON CONFLICT (application_id)
  DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    risk_score = EXCLUDED.risk_score,
    factors = EXCLUDED.factors,
    recommendation = EXCLUDED.recommendation,
    assessed_at = CURRENT_TIMESTAMP,
    assessed_by = EXCLUDED.assessed_by
  RETURNING
    id,
    application_id,
    risk_level,
    risk_score,
    factors,
    recommendation,
    assessed_at,
    assessed_by
  `,
  [
    applicationId,
    riskLevel,
    riskScore,
    JSON.stringify(factors),
    recommendation,
    assessedBy,
  ]
);

  return {
    assessment: result.rows[0],
  };
};

module.exports = {
  calculateRisk,
};