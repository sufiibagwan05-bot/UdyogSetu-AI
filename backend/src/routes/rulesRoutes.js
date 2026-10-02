const express = require("express");

const {
  evaluateRulesForProject,
} = require("../controllers/rulesController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/evaluate/:projectId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  evaluateRulesForProject
);

module.exports = router;