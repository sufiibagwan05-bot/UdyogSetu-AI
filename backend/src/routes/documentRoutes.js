const express = require("express");

const {
  getDocumentsForProject,
  uploadProjectDocument,
} = require("../controllers/documentController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
  "/:projectId",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getDocumentsForProject
);

router.post(
  "/:projectId/upload",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  upload.single("document"),
  uploadProjectDocument
);

module.exports = router;