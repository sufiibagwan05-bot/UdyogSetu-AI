const express = require("express");

const {
  getChecklistForProject,
} = require("../controllers/checklistController");

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
  getChecklistForProject
);

module.exports = router;