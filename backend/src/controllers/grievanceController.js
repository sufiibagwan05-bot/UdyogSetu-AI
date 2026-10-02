const {
  createGrievance,
  getGrievances,
  assignGrievance,
  updateGrievanceStatus,
  escalateGrievance,
} = require("../services/grievanceService");

const createGrievanceController = async (req, res) => {
  try {
    const {
      projectId,
      applicationId,
      category,
      description,
      priority,
    } = req.body;

    const raisedBy = req.user.userId;

    // Basic validation
    if (!projectId || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, category and description are required",
      });
    }

    const result = await createGrievance({
      projectId,
      applicationId: applicationId || null,
      raisedBy,
      category,
      description,
      priority: priority || "MEDIUM",
    });

    if (result.error) {
      switch (result.error) {
        case "INVALID_PRIORITY":
          return res.status(400).json({
            success: false,
            message: "Invalid priority",
          });

        case "PROJECT_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message:
              "Project not found or you are not the owner",
          });

        case "APPLICATION_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });

        case "APPLICATION_PROJECT_MISMATCH":
          return res.status(400).json({
            success: false,
            message:
              "Application does not belong to the selected project",
          });

        default:
          return res.status(500).json({
            success: false,
            message:
              "Failed to create grievance",
          });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Grievance created successfully",
      grievance: result.grievance,
    });
  } catch (error) {
    console.error(
      "Create grievance controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getGrievancesController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const result = await getGrievances({
      userId,
      role,
    });

    if (result.error) {
      if (result.error === "UNAUTHORIZED_ROLE") {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view grievances",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch grievances",
      });
    }

    return res.status(200).json({
      success: true,
      grievances: result.grievances,
    });
  } catch (error) {
    console.error(
      "Get grievances controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const assignGrievanceController = async (req, res) => {
  try {
    const grievanceId = parseInt(
      req.params.grievanceId,
      10
    );

    const officerUserId = req.user.userId;

    if (Number.isNaN(grievanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grievance ID",
      });
    }

    const result = await assignGrievance({
      grievanceId,
      officerUserId,
    });

    if (result.error) {
      switch (result.error) {
        case "OFFICER_NOT_FOUND":
          return res.status(403).json({
            success: false,
            message: "Officer not found or inactive",
          });

        case "GRIEVANCE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Grievance not found",
          });

        case "DEPARTMENT_MISMATCH":
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to handle this grievance",
          });

        case "INVALID_STATUS":
          return res.status(400).json({
            success: false,
            message:
              "Only RAISED grievances can be assigned",
          });

        case "ALREADY_ASSIGNED":
          return res.status(400).json({
            success: false,
            message:
              "Grievance is already assigned",
          });

        default:
          return res.status(500).json({
            success: false,
            message:
              "Failed to assign grievance",
          });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Grievance assigned successfully",
      grievance: result.grievance,
    });
  } catch (error) {
    console.error(
      "Assign grievance controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateGrievanceStatusController = async (req, res) => {
  try {
    const grievanceId = parseInt(
      req.params.grievanceId,
      10
    );

    const userId = req.user.userId;
const userRole = req.user.role;

    const { status } = req.body;

    if (Number.isNaN(grievanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grievance ID",
      });
    }

    const result = await updateGrievanceStatus({
  grievanceId,
  userId,
  userRole,
  status,
});

    if (result.error) {
      switch (result.error) {
        case "INVALID_STATUS":
          return res.status(400).json({
            success: false,
            message: "Only RESOLVED status is allowed",
          });

        case "GRIEVANCE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Grievance not found",
          });

        case "INVALID_CURRENT_STATUS":
          return res.status(400).json({
            success: false,
            message:
              "Grievance cannot be resolved from its current status",
          });

        case "NOT_ASSIGNED_OFFICER":
          return res.status(403).json({
            success: false,
            message:
              "Only the assigned officer can resolve this grievance",
          });

        default:
          return res.status(500).json({
            success: false,
            message:
              "Failed to update grievance status",
          });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Grievance resolved successfully",
      grievance: result.grievance,
    });
  } catch (error) {
    console.error(
      "Update grievance status controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const escalateGrievanceController = async (req, res) => {
  try {
    const grievanceId = parseInt(
      req.params.grievanceId,
      10
    );

    const officerUserId = req.user.userId;

    const { reason } = req.body;

    if (Number.isNaN(grievanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grievance ID",
      });
    }

    const result = await escalateGrievance({
      grievanceId,
      officerUserId,
      reason,
    });

    if (result.error) {
      switch (result.error) {
        case "INVALID_REASON":
          return res.status(400).json({
            success: false,
            message: "Escalation reason is required",
          });

        case "GRIEVANCE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Grievance not found",
          });

        case "INVALID_CURRENT_STATUS":
          return res.status(400).json({
            success: false,
            message:
              "Only IN_PROGRESS grievances can be escalated",
          });

        case "NOT_ASSIGNED_OFFICER":
          return res.status(403).json({
            success: false,
            message:
              "Only the assigned officer can escalate this grievance",
          });

        default:
          return res.status(500).json({
            success: false,
            message:
              "Failed to escalate grievance",
          });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Grievance escalated successfully",
      grievance: result.grievance,
    });
  } catch (error) {
    console.error(
      "Escalate grievance controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createGrievanceController,
  getGrievancesController,
  assignGrievanceController,
  updateGrievanceStatusController,
  escalateGrievanceController,
};