const { evaluateProjectRules } = require("../services/rulesService");

const evaluateRulesForProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const ownerUserId = req.user.userId;

    const result = await evaluateProjectRules(
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
      message: "Regulatory rules evaluated successfully",
      project: {
        id: result.project.id,
        name: result.project.project_name,
      },
      applicableApprovals: result.applicableRules.map((rule) => ({
        ruleId: rule.id,
        ruleName: rule.rule_name,
        approvalTypeId: rule.approval_type_id,
        approvalCode: rule.approval_code,
        approvalName: rule.approval_name,
        approvalDescription: rule.approval_description,
        departmentId: rule.department_id,
        departmentCode: rule.department_code,
        departmentName: rule.department_name,
        description: rule.description,
        conditions: rule.conditions,
        priority: rule.priority,
        sourceReference: rule.source_reference,
      })),
    });
  } catch (error) {
    console.error("EVALUATE RULES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to evaluate regulatory rules",
    });
  }
};

module.exports = {
  evaluateRulesForProject,
};