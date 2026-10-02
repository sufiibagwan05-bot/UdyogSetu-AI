const {
  assignApplicationToOfficer,
} = require("../services/officerAssignmentService");

const assignApplicationToOfficerController = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await assignApplicationToOfficer(
      applicationId,
      req.user.userId
    );

    if (result.error === "OFFICER_NOT_FOUND") {
      return res.status(403).json({
        success: false,
        message: "Officer account not found or inactive",
      });
    }

    if (result.error === "APPLICATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (result.error === "DEPARTMENT_MISMATCH") {
      return res.status(403).json({
        success: false,
        message: "This application does not belong to your department",
      });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        message: "Only submitted applications can be assigned",
      });
    }

    if (result.error === "ALREADY_ASSIGNED") {
      return res.status(400).json({
        success: false,
        message: "This application is already assigned",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application assigned to officer successfully",
      application: result.application,
    });
  } catch (error) {
    console.error("Assign application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign application",
    });
  }
};

module.exports = {
  assignApplicationToOfficerController,
};