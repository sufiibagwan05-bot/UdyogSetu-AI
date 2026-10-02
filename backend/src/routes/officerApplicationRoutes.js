const express = require("express");

const {
  getOfficerApplicationsController,
} = require("../controllers/officerApplicationController");

const {
  assignApplicationToOfficerController,
} = require("../controllers/officerAssignmentController");

const {
  reviewApplicationController,
} = require("../controllers/officerReviewController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("OFFICER"),
  getOfficerApplicationsController
);

router.post(
  "/:applicationId/assign",
  authenticateToken,
  authorizeRoles("OFFICER"),
  assignApplicationToOfficerController
);

router.put(
  "/:applicationId/review",
  authenticateToken,
  authorizeRoles("OFFICER"),
  reviewApplicationController
);

module.exports = router;