const { getApplicationSLA } = require("../services/slaService");

const getApplicationSLAController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await getApplicationSLA(applicationId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      sla: result.sla,
    });
  } catch (error) {
    console.error("Get application SLA error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get application SLA",
    });
  }
};

module.exports = {
  getApplicationSLAController,
};