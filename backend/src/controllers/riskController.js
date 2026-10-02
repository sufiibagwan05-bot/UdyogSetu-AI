const {
  calculateRisk,
} = require("../services/riskService");

const calculateRiskController = async (req, res) => {
  try {
    const applicationId = Number(
      req.params.applicationId
    );

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await calculateRisk(
      applicationId,
      req.user.userId
    );

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Risk assessment completed successfully",
      assessment: result.assessment,
    });
  } catch (error) {
    console.error(
      "Calculate risk error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to calculate risk assessment",
    });
  }
};

module.exports = {
  calculateRiskController,
};