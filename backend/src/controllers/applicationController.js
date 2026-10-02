const {
  createApplication,
  getMyApplications,
  submitApplication,
} = require("../services/applicationService");

const createApplicationController = async (req, res) => {
  try {
    const projectApprovalId =
      req.body.projectApprovalId;

    const submittedBy = req.user.userId;

    if (!projectApprovalId) {
      return res.status(400).json({
        success: false,
        message: "projectApprovalId is required",
      });
    }

    const result = await createApplication(
      projectApprovalId,
      submittedBy
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
        application: result.application || null,
      });
    }

    res.status(201).json({
      success: true,
      message: "Application draft created successfully",
      application: result.application,
    });
  } catch (error) {
    console.error(
      "CREATE APPLICATION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create application",
    });
  }
};

const getMyApplicationsController = async (
  req,
  res
) => {
  try {
    const userId = req.user.userId;

    const applications =
      await getMyApplications(userId);

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error(
      "GET APPLICATIONS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve applications",
    });
  }
};

const submitApplicationController = async (
  req,
  res
) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.userId;

    const result = await submitApplication(
      applicationId,
      userId
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      application: result.application,
    });
  } catch (error) {
    console.error(
      "SUBMIT APPLICATION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};

module.exports = {
  createApplicationController,
  getMyApplicationsController,
  submitApplicationController,
};