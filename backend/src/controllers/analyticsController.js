const {
  getEntrepreneurAnalytics,
  getOfficerAnalytics,
  getAdminAnalytics,
  getAdminProjects,
  getAdminApplications,
} = require("../services/analyticsService");

const getEntrepreneurAnalyticsController = async (req, res) => {
  try {
    const result = await getEntrepreneurAnalytics(req.user.userId);

    return res.status(200).json({
      success: true,
      role: "ENTREPRENEUR",
      analytics: result,
    });
  } catch (error) {
    console.error("Get entrepreneur analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch entrepreneur analytics",
    });
  }
};

const getOfficerAnalyticsController = async (req, res) => {
  try {
    const result = await getOfficerAnalytics(req.user.userId);

    if (!result) {
      return res.status(403).json({
        success: false,
        message: "Officer account not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      role: "OFFICER",
      analytics: result,
    });
  } catch (error) {
    console.error("Get officer analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch officer analytics",
    });
  }
};

const getAdminAnalyticsController = async (req, res) => {
  try {
    const result = await getAdminAnalytics();

    return res.status(200).json({
      success: true,
      role: "ADMIN",
      analytics: result,
    });
  } catch (error) {
    console.error("Get admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin analytics",
    });
  }
};

const getAdminProjectsController = async (req, res) => {
  try {
    const projects = await getAdminProjects();

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get admin projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin projects",
    });
  }
};

const getAdminApplicationsController = async (req, res) => {
  try {
    const applications = await getAdminApplications();

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get admin applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin applications",
    });
  }
};

module.exports = {
  getEntrepreneurAnalyticsController,
  getOfficerAnalyticsController,
  getAdminAnalyticsController,
  getAdminProjectsController,
  getAdminApplicationsController,
};