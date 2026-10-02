const pool = require("../config/db");
const { createAuditLog } = require("../services/auditLogService");

const createProject = async (req, res) => {
  try {
    const {
      projectName,
      sectorId,
      stateId,
      districtId,
      location,
      investmentAmount,
      projectSize,
      landStatus,
      businessType,
      productionActivity,
      employeesCount,
      projectStage,
      environmentalRequirement,
      waterRequirement,
      electricityRequirement,
    } = req.body;

    const ownerUserId = req.user.userId;

    if (
      !projectName ||
      !sectorId ||
      !stateId ||
      !districtId ||
      !location ||
      !businessType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project name, sector, state, district, location and business type are required",
      });
    }

    const sectorResult = await pool.query(
      "SELECT id FROM industry_sectors WHERE id = $1",
      [sectorId]
    );

    if (sectorResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sector",
      });
    }

    const stateResult = await pool.query(
      "SELECT id FROM states WHERE id = $1",
      [stateId]
    );

    if (stateResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid state",
      });
    }

    const districtResult = await pool.query(
      `
      SELECT id
      FROM districts
      WHERE id = $1
        AND state_id = $2
      `,
      [districtId, stateId]
    );

    if (districtResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid district for the selected state",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO projects
      (
        owner_user_id,
        project_name,
        sector_id,
        state_id,
        district_id,
        location,
        investment_amount,
        project_size,
        land_status,
        business_type,
        production_activity,
        employee_count,
        project_stage,
        environment_required,
        water_required,
        electricity_required
      )
      VALUES
      (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
      RETURNING
        id,
        owner_user_id,
        project_name,
        sector_id,
        state_id,
        district_id,
        location,
        investment_amount,
        project_size,
        land_status,
        business_type,
        production_activity,
        employee_count,
        project_stage,
        environment_required,
        water_required,
        electricity_required,
        status,
        created_at,
        updated_at
      `,
      [
        ownerUserId,
        projectName.trim(),
        sectorId,
        stateId,
        districtId,
        location.trim(),
        investmentAmount || null,
        projectSize || null,
        landStatus || null,
        businessType.trim(),
        productionActivity || null,
        employeesCount || null,
        projectStage || null,
        environmentalRequirement || false,
        waterRequirement || false,
        electricityRequirement || false,
      ]
    );

        await createAuditLog({
      userId: ownerUserId,
      action: "CREATE_PROJECT",
      entityType: "PROJECT",
      entityId: result.rows[0].id,
      oldValue: null,
      newValue: {
        projectName: result.rows[0].project_name,
        sectorId: result.rows[0].sector_id,
        stateId: result.rows[0].state_id,
        districtId: result.rows[0].district_id,
        businessType: result.rows[0].business_type,
        status: result.rows[0].status,
      },
    });

    res.status(201).json({
      success: true,
      message: "Industrial project created successfully",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create industrial project",
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const ownerUserId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.project_name,
        p.business_type,
        p.location,
        p.investment_amount,
        p.project_size,
        p.land_status,
        p.production_activity,
        p.employee_count,
        p.project_stage,
        p.environment_required,
        p.water_required,
        p.electricity_required,
        p.status,
        p.created_at,
        p.updated_at,
        s.name AS sector,
        st.name AS state,
        d.name AS district
      FROM projects p
      JOIN industry_sectors s
        ON s.id = p.sector_id
      JOIN states st
        ON st.id = p.state_id
      JOIN districts d
        ON d.id = p.district_id
      WHERE p.owner_user_id = $1
      ORDER BY p.created_at DESC
      `,
      [ownerUserId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      projects: result.rows,
    });
  } catch (error) {
    console.error("GET MY PROJECTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const ownerUserId = req.user.userId;
    const projectId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.owner_user_id,
        p.project_name,
        p.business_type,
        p.location,
        p.investment_amount,
        p.project_size,
        p.land_status,
        p.production_activity,
        p.employee_count,
        p.project_stage,
        p.environment_required,
        p.water_required,
        p.electricity_required,
        p.status,
        p.created_at,
        p.updated_at,
        s.name AS sector,
        st.name AS state,
        d.name AS district
      FROM projects p
      JOIN industry_sectors s
        ON s.id = p.sector_id
      JOIN states st
        ON st.id = p.state_id
      JOIN districts d
        ON d.id = p.district_id
      WHERE p.id = $1
        AND p.owner_user_id = $2
      `,
      [projectId, ownerUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    console.error("GET PROJECT BY ID ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const ownerUserId = req.user.userId;
    const projectId = req.params.id;

    const {
      projectName,
      sectorId,
      stateId,
      districtId,
      location,
      investmentAmount,
      projectSize,
      landStatus,
      businessType,
      productionActivity,
      employeesCount,
      projectStage,
      environmentalRequirement,
      waterRequirement,
      electricityRequirement,
    } = req.body;

    if (
      !projectName ||
      !sectorId ||
      !stateId ||
      !districtId ||
      !location ||
      !businessType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project name, sector, state, district, location and business type are required",
      });
    }

    const existingProject = await pool.query(
      `
      SELECT id, status
      FROM projects
      WHERE id = $1
        AND owner_user_id = $2
      `,
      [projectId, ownerUserId]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const sectorResult = await pool.query(
      "SELECT id FROM industry_sectors WHERE id = $1",
      [sectorId]
    );

    if (sectorResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sector",
      });
    }

    const stateResult = await pool.query(
      "SELECT id FROM states WHERE id = $1",
      [stateId]
    );

    if (stateResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid state",
      });
    }

    const districtResult = await pool.query(
      `
      SELECT id
      FROM districts
      WHERE id = $1
        AND state_id = $2
      `,
      [districtId, stateId]
    );

    if (districtResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid district for the selected state",
      });
    }

    const result = await pool.query(
      `
      UPDATE projects
      SET
        project_name = $1,
        sector_id = $2,
        state_id = $3,
        district_id = $4,
        location = $5,
        investment_amount = $6,
        project_size = $7,
        land_status = $8,
        business_type = $9,
        production_activity = $10,
        employee_count = $11,
        project_stage = $12,
        environment_required = $13,
        water_required = $14,
        electricity_required = $15,
        updated_at = NOW()
      WHERE id = $16
        AND owner_user_id = $17
      RETURNING
        id,
        owner_user_id,
        project_name,
        sector_id,
        state_id,
        district_id,
        location,
        investment_amount,
        project_size,
        land_status,
        business_type,
        production_activity,
        employee_count,
        project_stage,
        environment_required,
        water_required,
        electricity_required,
        status,
        created_at,
        updated_at
      `,
      [
        projectName.trim(),
        sectorId,
        stateId,
        districtId,
        location.trim(),
        investmentAmount || null,
        projectSize || null,
        landStatus || null,
        businessType.trim(),
        productionActivity || null,
        employeesCount || null,
        projectStage || null,
        environmentalRequirement || false,
        waterRequirement || false,
        electricityRequirement || false,
        projectId,
        ownerUserId,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Industrial project updated successfully",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update industrial project",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const ownerUserId = req.user.userId;
    const projectId = req.params.id;

    const existingProject = await pool.query(
      `
      SELECT id, status
      FROM projects
      WHERE id = $1
        AND owner_user_id = $2
      `,
      [projectId, ownerUserId]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (existingProject.rows[0].status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft projects can be deleted",
      });
    }

    await pool.query(
      `
      DELETE FROM projects
      WHERE id = $1
        AND owner_user_id = $2
      `,
      [projectId, ownerUserId]
    );

    res.status(200).json({
      success: true,
      message: "Industrial project deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete industrial project",
    });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
};