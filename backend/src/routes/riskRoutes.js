const express = require("express");

const {
  calculateRiskController,
} = require("../controllers/riskController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/:applicationId/assess",
  authenticateToken,
  authorizeRoles("OFFICER"),
  calculateRiskController
);

module.exports = router;