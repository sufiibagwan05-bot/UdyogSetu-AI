const express = require("express");
const { getApplicationSLAController } = require("../controllers/slaController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getApplicationSLA,
  checkApproachingSLAs,
  checkBreachedSLAs,
} = require("../services/slaService");
const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/:applicationId",
  authenticateToken,
  getApplicationSLAController
);

router.post(
  "/check-approaching",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const result = await checkApproachingSLAs();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Check approaching SLA route error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check approaching SLAs",
      });
    }
  }
);

router.post(
  "/check-breached",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const result = await checkBreachedSLAs();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Check breached SLA route error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check breached SLAs",
      });
    }
  }
);

module.exports = router;