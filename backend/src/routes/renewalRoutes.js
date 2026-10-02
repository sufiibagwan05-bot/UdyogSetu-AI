const express = require("express");
const {
  getRenewalByApplicationController,
  createRenewalApplicationController,
} = require("../controllers/renewalController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  checkRenewalReminders,
  checkRenewalDue,
} = require("../services/renewalService");
const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/:applicationId",
  authenticateToken,
  getRenewalByApplicationController
);

router.post(
  "/:applicationId/create",
  authenticateToken,
  createRenewalApplicationController
);

router.post(
  "/check-reminders",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const result = await checkRenewalReminders();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Check renewal reminders route error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check renewal reminders",
      });
    }
  }
);

router.post(
  "/check-due",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const result = await checkRenewalDue();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Check renewal due route error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check renewal due notifications",
      });
    }
  }
);

module.exports = router;