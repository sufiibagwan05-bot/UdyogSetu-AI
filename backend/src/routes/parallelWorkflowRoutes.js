const express = require("express");

const {
  getProjectApprovalWorkflowController,
} = require("../controllers/parallelWorkflowController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/:projectId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getProjectApprovalWorkflowController
);

module.exports = router;