const express = require("express");

const {
  createApplicationController,
  getMyApplicationsController,
  submitApplicationController,
} = require("../controllers/applicationController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  createApplicationController
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getMyApplicationsController
);

router.post(
  "/:applicationId/submit",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  submitApplicationController
);

module.exports = router;