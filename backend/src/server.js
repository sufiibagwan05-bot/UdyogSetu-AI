const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const rulesRoutes = require("./routes/rulesRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const documentRoutes = require("./routes/documentRoutes");
const documentPrecheckRoutes = require("./routes/documentPrecheckRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const applicationQueryRoutes = require("./routes/applicationQueryRoutes");
const officerApplicationRoutes = require("./routes/officerApplicationRoutes");
const parallelWorkflowRoutes = require("./routes/parallelWorkflowRoutes");
const riskRoutes = require("./routes/riskRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const slaRoutes = require("./routes/slaRoutes");
const { checkApproachingSLAs,
        checkBreachedSLAs,
 } = require("./services/slaService");
 const { checkRenewalReminders,
         checkRenewalDue,
  } = require("./services/renewalService");
 const renewalRoutes = require("./routes/renewalRoutes");
 const grievanceRoutes = require("./routes/grievanceRoutes");
 const schemeRoutes = require("./routes/schemeRoutes");
 const analyticsRoutes = require("./routes/analyticsRoutes");
 const adminRoutes = require("./routes/adminRoutes");


const pool = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/rules", rulesRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/documents", documentRoutes);
app.use(
  "/api/document-prechecks",
  documentPrecheckRoutes
);
app.use(
  "/api/applications",
  applicationRoutes
);
app.use("/api/queries", applicationQueryRoutes);
app.use("/api/officer/applications", officerApplicationRoutes);
app.use("/api/parallel-workflow", parallelWorkflowRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/sla", slaRoutes);
app.use("/api/renewals", renewalRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);


// Health check route
app.get("/", (req, res) => {
  res.send("INDUSTRIA360 Backend API is running");
});

// Database test route
app.get("/api/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Database connection successful",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Start server
app.listen(PORT, () => {
  const runSLACheck = async () => {
  console.log("Checking SLAs and renewals...");

  await checkApproachingSLAs();
  await checkBreachedSLAs();
  await checkRenewalReminders();
  await checkRenewalDue();
};

runSLACheck();

setInterval(runSLACheck, 60 * 60 * 1000);
  console.log(`INDUSTRIA360 Backend running on port ${PORT}`);
});
