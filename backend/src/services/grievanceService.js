const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const createGrievance = async ({
  projectId,
  applicationId = null,
  raisedBy,
  category,
  description,
  priority = "MEDIUM",
}) => {
  try {
    // 1. Validate priority
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (!allowedPriorities.includes(priority)) {
      return {
        error: "INVALID_PRIORITY",
      };
    }

    // 2. Verify project ownership
    const projectResult = await pool.query(
      `
      SELECT
        p.id,
        p.project_name
      FROM projects p
      WHERE p.id = $1
        AND p.owner_user_id = $2
      `,
      [projectId, raisedBy]
    );

    if (projectResult.rows.length === 0) {
      return {
        error: "PROJECT_NOT_FOUND",
      };
    }

    const project = projectResult.rows[0];

    // 3. Department identification
    let departmentId = null;
    let applicationNumber = null;

    // 4. If application is provided, validate it
    if (applicationId) {
      const applicationResult = await pool.query(
        `
        SELECT
          a.id,
          a.application_number,
          pa.project_id,
          at.department_id
        FROM applications a

        JOIN project_approvals pa
          ON a.project_approval_id = pa.id

        JOIN approval_types at
          ON pa.approval_type_id = at.id

        WHERE a.id = $1
        `,
        [applicationId]
      );

      if (applicationResult.rows.length === 0) {
        return {
          error: "APPLICATION_NOT_FOUND",
        };
      }

      const application = applicationResult.rows[0];

      // 5. Ensure application belongs to selected project
      if (application.project_id !== projectId) {
        return {
          error: "APPLICATION_PROJECT_MISMATCH",
        };
      }

      departmentId = application.department_id;
      applicationNumber = application.application_number;
    }

    // 6. Create grievance
    const grievanceResult = await pool.query(
      `
      INSERT INTO grievances (
        project_id,
        application_id,
        raised_by,
        category,
        description,
        priority,
        status,
        department_id,
        assigned_officer_id,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'RAISED',
        $7,
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        projectId,
        applicationId,
        raisedBy,
        category,
        description,
        priority,
        departmentId,
      ]
    );

    const grievance = grievanceResult.rows[0];

    // 7. Notify entrepreneur that grievance was created
    await createNotification({
      userId: raisedBy,
      type: "GRIEVANCE_CREATED",
      title: "Grievance Created",
      message: applicationNumber
        ? `Your grievance for application ${applicationNumber} has been created successfully.`
        : `Your grievance for project ${project.project_name} has been created successfully.`,
      relatedEntityType: "GRIEVANCE",
      relatedEntityId: grievance.id,
      channels: {
        inApp: true,
        email: false,
      },
    });

    return {
      grievance,
    };
  } catch (error) {
    console.error("Create grievance error:", error);

    return {
      error: "CREATE_GRIEVANCE_FAILED",
      message: error.message,
    };
  }
};

const getGrievances = async ({
  userId,
  role,
}) => {
  try {
    let query = `
      SELECT
        g.id,
        g.project_id,
        g.application_id,
        g.raised_by,
        g.category,
        g.description,
        g.priority,
        g.status,
        g.department_id,
        g.assigned_officer_id,
        g.created_at,
        g.updated_at,
        g.resolved_at,

        p.project_name,

        a.application_number,

        d.name AS department_name,

        u.full_name AS assigned_officer_name

      FROM grievances g

      JOIN projects p
        ON g.project_id = p.id

      LEFT JOIN applications a
        ON g.application_id = a.id

      LEFT JOIN departments d
        ON g.department_id = d.id

      LEFT JOIN users u
        ON g.assigned_officer_id = u.id
    `;

    const params = [];

    // Entrepreneur → only own grievances
    if (role === "ENTREPRENEUR") {
      query += `
        WHERE g.raised_by = $1
      `;

      params.push(userId);
    }

    // Officer → only grievances from their department
    else if (role === "OFFICER") {
      query += `
        JOIN users officer
          ON officer.id = $1

        JOIN roles officer_role
          ON officer.role_id = officer_role.id

        WHERE officer_role.name = 'OFFICER'
          AND officer.is_active = true
          AND g.department_id = officer.department_id
      `;

      params.push(userId);
    }

    // Admin → all grievances
    else if (role === "ADMIN") {
      // No additional WHERE condition
    }

    else {
      return {
        error: "UNAUTHORIZED_ROLE",
      };
    }

    query += `
      ORDER BY g.created_at DESC
    `;

    const result = await pool.query(
      query,
      params
    );

    return {
      grievances: result.rows,
    };
  } catch (error) {
    console.error(
      "Get grievances error:",
      error
    );

    return {
      error: "GET_GRIEVANCES_FAILED",
      message: error.message,
    };
  }
};

const assignGrievance = async ({
  grievanceId,
  officerUserId,
}) => {
  try {
    // 1. Verify officer
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
      return {
        error: "OFFICER_NOT_FOUND",
      };
    }

    const officer = officerResult.rows[0];

    // 2. Find grievance
    const grievanceResult = await pool.query(
      `
      SELECT
        id,
        raised_by,
        department_id,
        assigned_officer_id,
        status
      FROM grievances
      WHERE id = $1
      `,
      [grievanceId]
    );

    if (grievanceResult.rows.length === 0) {
      return {
        error: "GRIEVANCE_NOT_FOUND",
      };
    }

    const grievance = grievanceResult.rows[0];

    // 3. Verify department
    if (
      grievance.department_id !==
      officer.department_id
    ) {
      return {
        error: "DEPARTMENT_MISMATCH",
      };
    }

    // 4. Only RAISED grievances can be taken
    if (grievance.status !== "RAISED") {
      return {
        error: "INVALID_STATUS",
      };
    }

    // 5. Prevent double assignment
    if (grievance.assigned_officer_id) {
      return {
        error: "ALREADY_ASSIGNED",
      };
    }

    // 6. Assign grievance to officer
    const updateResult = await pool.query(
      `
      UPDATE grievances
      SET
        assigned_officer_id = $1,
        status = 'IN_PROGRESS',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        officerUserId,
        grievanceId,
      ]
    );

    const updatedGrievance =
      updateResult.rows[0];

    // 7. Notify entrepreneur
    await createNotification({
      userId: grievance.raised_by,
      type: "GRIEVANCE_ASSIGNED",
      title: "Grievance Assigned",
      message:
        "Your grievance has been assigned to an officer and is now being processed.",
      relatedEntityType: "GRIEVANCE",
      relatedEntityId: grievanceId,
      channels: {
        inApp: true,
        email: false,
      },
    });

    return {
      grievance: updatedGrievance,
    };
  } catch (error) {
    console.error(
      "Assign grievance error:",
      error
    );

    return {
      error: "ASSIGN_GRIEVANCE_FAILED",
      message: error.message,
    };
  }
};

const updateGrievanceStatus = async ({
  grievanceId,
  userId,
  userRole,
  status,
}) => {
  try {
    if (status !== "RESOLVED") {
      return {
        error: "INVALID_STATUS",
      };
    }

    const grievanceResult = await pool.query(
      `
      SELECT
        id,
        raised_by,
        department_id,
        assigned_officer_id,
        status
      FROM grievances
      WHERE id = $1
      `,
      [grievanceId]
    );

    if (grievanceResult.rows.length === 0) {
      return {
        error: "GRIEVANCE_NOT_FOUND",
      };
    }

    const grievance = grievanceResult.rows[0];

    if (userRole === "ADMIN") {
  if (grievance.status !== "ESCALATED") {
    return {
      error: "INVALID_CURRENT_STATUS",
    };
  }
} else {
  if (grievance.status !== "IN_PROGRESS") {
    return {
      error: "INVALID_CURRENT_STATUS",
    };
  }

  if (
    grievance.assigned_officer_id !==
    userId
  ) {
    return {
      error: "NOT_ASSIGNED_OFFICER",
    };
  }
}

    const updateResult = await pool.query(
      `
      UPDATE grievances
      SET
        status = 'RESOLVED',
        resolved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [grievanceId]
    );

    const updatedGrievance =
      updateResult.rows[0];

    await createNotification({
      userId: grievance.raised_by,
      type: "GRIEVANCE_RESOLVED",
      title: "Grievance Resolved",
      message:
        "Your grievance has been resolved successfully.",
      relatedEntityType: "GRIEVANCE",
      relatedEntityId: grievanceId,
      channels: {
        inApp: true,
        email: false,
      },
    });

    return {
      grievance: updatedGrievance,
    };
  } catch (error) {
    console.error(
      "Update grievance status error:",
      error
    );

    return {
      error: "UPDATE_GRIEVANCE_STATUS_FAILED",
      message: error.message,
    };
  }
};

const escalateGrievance = async ({
  grievanceId,
  officerUserId,
  reason,
}) => {
  try {
    if (!reason || !reason.trim()) {
      return {
        error: "INVALID_REASON",
      };
    }

    const grievanceResult = await pool.query(
      `
      SELECT
        id,
        raised_by,
        department_id,
        assigned_officer_id,
        status
      FROM grievances
      WHERE id = $1
      `,
      [grievanceId]
    );

    if (grievanceResult.rows.length === 0) {
      return {
        error: "GRIEVANCE_NOT_FOUND",
      };
    }

    const grievance = grievanceResult.rows[0];

    if (grievance.status !== "IN_PROGRESS") {
      return {
        error: "INVALID_CURRENT_STATUS",
      };
    }

    if (
      grievance.assigned_officer_id !==
      officerUserId
    ) {
      return {
        error: "NOT_ASSIGNED_OFFICER",
      };
    }

    await pool.query(
      `
      INSERT INTO grievance_escalations (
        grievance_id,
        from_officer_id,
        to_officer_id,
        reason,
        escalated_at
      )
      VALUES (
        $1,
        $2,
        NULL,
        $3,
        CURRENT_TIMESTAMP
      )
      `,
      [
        grievanceId,
        officerUserId,
        reason.trim(),
      ]
    );

    const updateResult = await pool.query(
      `
      UPDATE grievances
      SET
        status = 'ESCALATED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [grievanceId]
    );

    const updatedGrievance =
      updateResult.rows[0];

    await createNotification({
      userId: grievance.raised_by,
      type: "GRIEVANCE_ESCALATED",
      title: "Grievance Escalated",
      message:
        "Your grievance has been escalated for higher-level review.",
      relatedEntityType: "GRIEVANCE",
      relatedEntityId: grievanceId,
      channels: {
        inApp: true,
        email: true,
      },
    });

    return {
      grievance: updatedGrievance,
    };
  } catch (error) {
    console.error(
      "Escalate grievance error:",
      error
    );

    return {
      error: "ESCALATE_GRIEVANCE_FAILED",
      message: error.message,
    };
  }
};

module.exports = {
  createGrievance,
  getGrievances,
  assignGrievance,
  updateGrievanceStatus,
  escalateGrievance,
};

