const express = require("express");

const {
  register,
  login,
  demoLogin,
} = require("../controllers/authController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/demo-login", demoLogin);

router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

module.exports = router;
// SIH Demo update