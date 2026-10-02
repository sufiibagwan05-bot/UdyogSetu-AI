const {
  getOfficerApplications,
} = require("../services/officerApplicationService");

const getOfficerApplicationsController = async (req, res) => {
  try {
    const result = await getOfficerApplications(req.user.userId);

    if (!result) {
      return res.status(403).json({
        success: false,
        message: "Officer account not found or inactive",
      });
    }

    res.status(200).json({
      success: true,
      count: result.applications.length,
      officer: result.officer,
      applications: result.applications,
    });
  } catch (error) {
    console.error("Get officer applications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch officer applications",
    });
  }
};

module.exports = {
  getOfficerApplicationsController,
};