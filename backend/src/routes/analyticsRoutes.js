const express = require("express");

const {
  getEntrepreneurAnalyticsController,
  getOfficerAnalyticsController,
  getAdminAnalyticsController,
  getAdminProjectsController,
  getAdminApplicationsController,
} = require("../controllers/analyticsController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/entrepreneur",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getEntrepreneurAnalyticsController
);

router.get(
  "/officer",
  authenticateToken,
  authorizeRoles("OFFICER"),
  getOfficerAnalyticsController
);

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAdminAnalyticsController
);

router.get(
  "/admin/projects",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAdminProjectsController
);

router.get(
  "/admin/applications",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAdminApplicationsController
);

module.exports = router;