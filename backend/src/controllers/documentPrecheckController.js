

const {
  runDocumentPrecheck,
  getLatestDocumentPrecheck,
} = require("../services/documentPrecheckService");

const precheckDocument = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const ownerUserId = req.user.userId;

    const result = await runDocumentPrecheck(
      documentId,
      ownerUserId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Document pre-check completed successfully",
      document: result.document,
      precheck: result.precheck,
    });
  } catch (error) {
    console.error(
      "DOCUMENT PRECHECK ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to complete document pre-check",
    });
  }
};

const getPrecheckResult = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const ownerUserId = req.user.userId;

    const result = await getLatestDocumentPrecheck(
      documentId,
      ownerUserId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No pre-check result found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Latest document pre-check retrieved successfully",
      precheck: result,
    });
  } catch (error) {
    console.error(
      "GET DOCUMENT PRECHECK ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve document pre-check",
    });
  }
};

module.exports = {
  precheckDocument,
  getPrecheckResult,
};