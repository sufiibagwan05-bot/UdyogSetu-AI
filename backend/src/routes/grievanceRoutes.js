const express = require("express");

const {
  createGrievanceController,
  getGrievancesController,
  assignGrievanceController,
  updateGrievanceStatusController,
  escalateGrievanceController,
} = require("../controllers/grievanceController");

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
  createGrievanceController
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ENTREPRENEUR",
    "OFFICER",
    "ADMIN"
  ),
  getGrievancesController
);

router.put(
  "/:grievanceId/assign",
  authenticateToken,
  authorizeRoles("OFFICER"),
  assignGrievanceController
);

router.put(
  "/:grievanceId/status",
  authenticateToken,
  authorizeRoles("OFFICER", "ADMIN"),
  updateGrievanceStatusController
);

router.put(
  "/:grievanceId/escalate",
  authenticateToken,
  authorizeRoles("OFFICER"),
  escalateGrievanceController
);

module.exports = router;