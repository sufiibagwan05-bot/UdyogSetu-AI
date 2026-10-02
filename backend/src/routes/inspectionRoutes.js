const express = require("express");

const {
  createInspectionController,
  getInspectionController,
  startInspectionController,
  completeInspectionController,
   createInspectionReportController,
  getInspectionReportController,
} = require("../controllers/inspectionController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Schedule an inspection
router.post(
  "/:applicationId",
  authenticateToken,
  authorizeRoles("OFFICER"),
  createInspectionController
);

// Get inspections for an application
router.get(
  "/:applicationId",
  authenticateToken,
  authorizeRoles("OFFICER"),
  getInspectionController
);

// Start an inspection
router.put(
  "/:inspectionId/start",
  authenticateToken,
  authorizeRoles("OFFICER"),
  startInspectionController
);

// Complete an inspection
router.put(
  "/:inspectionId/complete",
  authenticateToken,
  authorizeRoles("OFFICER"),
  completeInspectionController
);

// Create inspection report
router.post(
  "/:inspectionId/report",
  authenticateToken,
  authorizeRoles("OFFICER"),
  createInspectionReportController
);

// Get inspection report
router.get(
  "/:inspectionId/report",
  authenticateToken,
  authorizeRoles("OFFICER"),
  getInspectionReportController
);

module.exports = router;