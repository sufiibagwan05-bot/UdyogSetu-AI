const { getProjectChecklist } = require("../services/checklistService");

const getChecklistForProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const ownerUserId = req.user.userId;

    const result = await getProjectChecklist(
      projectId,
      ownerUserId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project approval checklist retrieved successfully",
      project: result.project,
      checklist: result.checklist,
    });
  } catch (error) {
    console.error("GET CHECKLIST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve project approval checklist",
    });
  }
};

module.exports = {
  getChecklistForProject,
};