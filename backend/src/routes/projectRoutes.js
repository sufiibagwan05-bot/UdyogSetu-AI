const express = require("express");

const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

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
  createProject
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getMyProjects
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  getProjectById
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  updateProject
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ENTREPRENEUR"),
  deleteProject
);

module.exports = router;