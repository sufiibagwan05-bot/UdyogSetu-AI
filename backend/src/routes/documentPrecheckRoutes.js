const express = require("express");

const {
  precheckDocument,
  getPrecheckResult,
} = require("../controllers/documentPrecheckController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/:documentId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  precheckDocument
);

router.get(
  "/:documentId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getPrecheckResult
);

module.exports = router;