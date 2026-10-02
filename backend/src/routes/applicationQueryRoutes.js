const express = require("express");

const {
  raiseQueryController,
} = require("../controllers/applicationQueryController");

const {
  respondToQueryController,
} = require("../controllers/applicationQueryResponseController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:applicationId",
  authenticateToken,
  raiseQueryController
);

router.put(
  "/:queryId/respond",
  authenticateToken,
  respondToQueryController
);

module.exports = router;