const {
  getProjectApprovalWorkflow,
} = require("../services/parallelWorkflowService");

const getProjectApprovalWorkflowController = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const result = await getProjectApprovalWorkflow(
      projectId,
      req.user.userId
    );

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      project: result.project,
      count: result.approvals.length,
      approvals: result.approvals,
    });
  } catch (error) {
    console.error(
      "Get project approval workflow error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project approval workflow",
    });
  }
};

module.exports = {
  getProjectApprovalWorkflowController,
};