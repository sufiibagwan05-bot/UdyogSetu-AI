const {
  getRenewalByApplication,
  createRenewalApplication,
} = require("../services/renewalService");

const getRenewalByApplicationController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await getRenewalByApplication(applicationId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      renewal: result.renewal,
    });
  } catch (error) {
    console.error("Get renewal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get renewal information",
    });
  }
};

const createRenewalApplicationController = async (
  req,
  res
) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const userId = req.user.userId;

    if (!Number.isInteger(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await createRenewalApplication(
      applicationId,
      userId
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Renewal application created successfully",
      application: result.application,
    });
  } catch (error) {
    console.error(
      "Create renewal application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create renewal application",
    });
  }
};

module.exports = {
  getRenewalByApplicationController,
  createRenewalApplicationController,
};