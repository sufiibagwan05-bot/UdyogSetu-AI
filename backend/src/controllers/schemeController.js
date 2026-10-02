const {
  getMatchedSchemes,
} = require("../services/schemeService");

const getMatchedSchemesController = async (req, res) => {
  try {
    const projectId = parseInt(
      req.params.projectId,
      10
    );

    const userId = req.user.userId;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const result = await getMatchedSchemes({
      projectId,
      userId,
    });

    if (result.error) {
      if (result.error === "PROJECT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message:
            "Project not found or you are not the owner",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch matched schemes",
      });
    }

    return res.status(200).json({
      success: true,
      project: result.project,
      schemes: result.schemes,
    });
  } catch (error) {
    console.error(
      "Get matched schemes controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getMatchedSchemesController,
};