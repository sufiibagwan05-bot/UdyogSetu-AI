const {
  respondToQuery,
} = require("../services/applicationQueryResponseService");

const respondToQueryController = async (req, res) => {
  try {
    const queryId = Number(req.params.queryId);
    const entrepreneurUserId = req.user.userId;
    const { responseText } = req.body;

    if (!queryId) {
      return res.status(400).json({
        message: "Invalid query ID",
      });
    }

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({
        message: "Response text is required",
      });
    }

    const result = await respondToQuery(
      queryId,
      entrepreneurUserId,
      responseText
    );

    if (result.error) {
      const statusMap = {
        QUERY_NOT_FOUND: 404,
        ACCESS_DENIED: 403,
        INVALID_QUERY_STATUS: 400,
        RESPONSE_TEXT_REQUIRED: 400,
      };

      return res.status(statusMap[result.error] || 400).json({
        message: result.error,
      });
    }

    return res.status(200).json({
      message: "Query response submitted successfully",
      query: result.query,
    });
  } catch (error) {
    console.error(
      "Respond to query controller error:",
      error
    );

    return res.status(500).json({
      message: "Failed to submit query response",
    });
  }
};

module.exports = {
  respondToQueryController,
};