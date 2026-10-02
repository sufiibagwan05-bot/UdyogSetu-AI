const {
  createInspection,
  getInspectionByApplication,
  startInspection,
  completeInspection,
  createInspectionReport,
  getInspectionReport,
} = require("../services/inspectionService");

const createInspectionController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const { scheduledDate, location, remarks } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date is required",
      });
    }

    const result = await createInspection({
      applicationId,
      officerId: req.user.userId,
      scheduledDate,
      location,
      remarks,
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Inspection scheduled successfully",
      inspection: result.inspection,
    });
  } catch (error) {
    console.error("Create inspection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule inspection",
    });
  }
};

const getInspectionController = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const result = await getInspectionByApplication(
      applicationId,
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
      inspections: result.inspections,
    });
  } catch (error) {
    console.error("Get inspection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inspections",
    });
  }
};

const startInspectionController = async (req, res) => {
  try {
    const inspectionId = Number(req.params.inspectionId);

    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID",
      });
    }

    const result = await startInspection(
      inspectionId,
      req.user.userId
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inspection started successfully",
      inspection: result.inspection,
    });
  } catch (error) {
    console.error("Start inspection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start inspection",
    });
  }
};

const completeInspectionController = async (req, res) => {
  try {
    const inspectionId = Number(req.params.inspectionId);

    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID",
      });
    }

    const { remarks } = req.body;

    const result = await completeInspection(
      inspectionId,
      req.user.userId,
      remarks
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inspection completed successfully",
      inspection: result.inspection,
    });
  } catch (error) {
    console.error("Complete inspection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete inspection",
    });
  }
};

const createInspectionReportController = async (req, res) => {
  try {
    const inspectionId = Number(req.params.inspectionId);

    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID",
      });
    }

    const {
      result,
      findings,
      issues,
      recommendation,
    } = req.body;

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Inspection result is required",
      });
    }

    const response = await createInspectionReport({
      inspectionId,
      inspectorId: req.user.userId,
      result,
      findings,
      issues,
      recommendation,
    });

    if (response.error) {
      return res.status(400).json({
        success: false,
        message: response.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Inspection report created successfully",
      report: response.report,
    });
  } catch (error) {
    console.error("Create inspection report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create inspection report",
    });
  }
};

const getInspectionReportController = async (req, res) => {
  try {
    const inspectionId = Number(req.params.inspectionId);

    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID",
      });
    }

    const response = await getInspectionReport(
      inspectionId,
      req.user.userId
    );

    if (response.error) {
      return res.status(404).json({
        success: false,
        message: response.error,
      });
    }

    return res.status(200).json({
      success: true,
      report: response.report,
    });
  } catch (error) {
    console.error("Get inspection report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inspection report",
    });
  }
};

module.exports = {
  createInspectionController,
  getInspectionController,
  startInspectionController,
  completeInspectionController,
  createInspectionReportController,
  getInspectionReportController,
};