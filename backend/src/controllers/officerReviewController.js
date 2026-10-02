const {
  reviewApplication,
} = require("../services/officerReviewService");

const reviewApplicationController = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be APPROVED or REJECTED",
      });
    }

    const result = await reviewApplication(
      applicationId,
      req.user.userId,
      decision,
      rejectionReason
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

    if (result.error === "NOT_ASSIGNED_TO_OFFICER") {
      return res.status(403).json({
        success: false,
        message: "This application is not assigned to you",
      });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        message: "Only applications under review can be processed",
      });
    }

    if (result.error === "REJECTION_REASON_REQUIRED") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (result.error === "INSPECTION_NOT_PASSED") {
  return res.status(400).json({
    success: false,
    message:
      "Application cannot be approved until the required inspection is completed and passed",
  });
}

    return res.status(200).json({
      success: true,
      message:
        decision === "APPROVED"
          ? "Application approved successfully"
          : "Application rejected successfully",
      application: result.application,
    });
  } catch (error) {
    console.error("Review application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process application",
    });
  }
};

module.exports = {
  reviewApplicationController,
};