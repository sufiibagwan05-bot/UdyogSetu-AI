const { raiseQuery } = require("../services/applicationQueryService");

const raiseQueryController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const officerUserId = req.user.userId;
    const { queryText } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({
        message: "Query text is required",
      });
    }

    const result = await raiseQuery(
      applicationId,
      officerUserId,
      queryText
    );

    if (result.error) {
      const statusMap = {
        OFFICER_NOT_FOUND: 404,
        APPLICATION_NOT_FOUND: 404,
        DEPARTMENT_MISMATCH: 403,
        NOT_ASSIGNED_TO_OFFICER: 403,
        INVALID_STATUS: 400,
        QUERY_TEXT_REQUIRED: 400,
      };

      return res.status(statusMap[result.error] || 400).json({
        message: result.error,
      });
    }

    return res.status(201).json({
      message: "Query raised successfully",
      query: result.query,
    });
  } catch (error) {
    console.error("Raise query controller error:", error);

    return res.status(500).json({
      message: "Failed to raise query",
    });
  }
};

module.exports = {
  raiseQueryController,
}; 