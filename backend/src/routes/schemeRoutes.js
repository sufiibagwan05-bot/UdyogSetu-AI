const express = require("express");

const {
  getMatchedSchemesController,
} = require("../controllers/schemeController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/project/:projectId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getMatchedSchemesController
);

module.exports = router;