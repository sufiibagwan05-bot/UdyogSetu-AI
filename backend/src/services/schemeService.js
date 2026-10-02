const pool = require("../config/db");

const getMatchedSchemes = async ({ projectId, userId }) => {
  try {
    // 1. Get project details and verify ownership
    const projectResult = await pool.query(
      `
      SELECT
        p.id,
        p.project_name,
        p.owner_user_id,
        p.state_id,
        p.sector_id,
        p.business_type,
        p.investment_amount,
        p.employee_count,
        p.environment_required,
        s.name AS state_name,
        s.code AS state_code,
        sec.name AS sector_name
      FROM projects p
      JOIN states s
        ON p.state_id = s.id
      JOIN industry_sectors sec
        ON p.sector_id = sec.id
      WHERE p.id = $1
        AND p.owner_user_id = $2
      `,
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return {
        error: "PROJECT_NOT_FOUND",
      };
    }

    const project = projectResult.rows[0];

    // 2. Get all active schemes
    const schemesResult = await pool.query(
      `
      SELECT
        s.id,
        s.name,
        s.description,
        s.state_id,
        s.sector_id,
        s.min_investment,
        s.max_investment,
        s.business_type,
        s.employment_requirement,
        s.source_reference
      FROM schemes s
      WHERE s.is_active = true
      ORDER BY s.id
      `
    );

    const schemes = schemesResult.rows;

    const matchedSchemes = [];

    // 3. Check each scheme
    for (const scheme of schemes) {
      const reasons = [];
      let isEligible = true;

      // State check
      if (
        scheme.state_id !== null &&
        scheme.state_id !== project.state_id
      ) {
        isEligible = false;
      } else {
        reasons.push(
          `State: ${project.state_name}`
        );
      }

      // Sector check
      if (
        scheme.sector_id !== null &&
        scheme.sector_id !== project.sector_id
      ) {
        isEligible = false;
      } else if (scheme.sector_id !== null) {
        reasons.push(
          `Sector: ${project.sector_name}`
        );
      }

      // Business type check
      if (
  scheme.business_type &&
  scheme.business_type.toUpperCase() !==
    project.business_type?.toUpperCase()
) {
  isEligible = false;
} else if (scheme.business_type) {
  reasons.push(
    `Business Type: ${project.business_type}`
  );
}


      // Investment check
      const investment = Number(
        project.investment_amount || 0
      );

      if (
        scheme.min_investment !== null &&
        investment < Number(scheme.min_investment)
      ) {
        isEligible = false;
      }

      if (
        scheme.max_investment !== null &&
        investment > Number(scheme.max_investment)
      ) {
        isEligible = false;
      }

      if (
        scheme.min_investment !== null ||
        scheme.max_investment !== null
      ) {
        reasons.push(
          `Investment: ₹${investment.toLocaleString("en-IN")}`
        );
      }

      

      // 4. Get additional eligibility rules
      const eligibilityResult = await pool.query(
        `
        SELECT
          criterion_name,
          criterion_type,
          criterion_value
        FROM scheme_eligibility
        WHERE scheme_id = $1
        ORDER BY id
        `,
        [scheme.id]
      );

      for (const rule of eligibilityResult.rows) {
        if (rule.criterion_type === "STATE") {
          const requiredState =
            rule.criterion_value?.state_code;

          if (
            requiredState &&
            requiredState !== project.state_code
          ) {
            isEligible = false;
          } else if (requiredState) {
            reasons.push(
              `State eligibility: ${requiredState}`
            );
          }
        }

        if (rule.criterion_type === "SECTOR") {
          const requiredSector =
            rule.criterion_value?.sector_code;

          const projectSectorCode =
            project.sector_name
              ?.toUpperCase()
              .replace(/\s+/g, "_");

          if (
            requiredSector &&
            requiredSector !== projectSectorCode
          ) {
            isEligible = false;
          } else if (requiredSector) {
            reasons.push(
              `Sector eligibility: ${requiredSector}`
            );
          }
        }

        if (rule.criterion_type === "EMPLOYMENT") {
          const minimumEmployees = Number(
            rule.criterion_value?.minimum_employees || 0
          );

          const employees = Number(
            project.employee_count || 0
          );

          if (employees < minimumEmployees) {
            isEligible = false;
          } else {
            reasons.push(
              `Minimum employees: ${minimumEmployees}`
            );
          }
        }

        if (rule.criterion_type === "ENVIRONMENT") {
          const environmentRequired =
            rule.criterion_value?.environment_required;

          if (
            environmentRequired === true &&
            project.environment_required !== true
          ) {
            isEligible = false;
          } else if (environmentRequired === true) {
            reasons.push(
              "Environment requirement satisfied"
            );
          }
        }
      }

      // 5. Add only eligible schemes
      if (isEligible) {
        matchedSchemes.push({
          id: scheme.id,
          name: scheme.name,
          description: scheme.description,
          sourceReference: scheme.source_reference,
          reasons,
        });
      }
    }

    return {
      project: {
        id: project.id,
        projectName: project.project_name,
        state: project.state_name,
        sector: project.sector_name,
        businessType: project.business_type,
        investmentAmount: project.investment_amount,
        employeeCount: project.employee_count,
        environmentRequired:
          project.environment_required,
      },
      schemes: matchedSchemes,
    };
  } catch (error) {
    console.error(
      "Get matched schemes error:",
      error
    );

    return {
      error: "GET_MATCHED_SCHEMES_FAILED",
      message: error.message,
    };
  }
};

module.exports = {
  getMatchedSchemes,
};