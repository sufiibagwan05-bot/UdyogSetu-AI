
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import SchemeMatching from "./pages/SchemeMatching";
import Analytics from "./pages/Analytics";
import AnalyticsRecords from "./pages/AnalyticsRecords";

import { useAuth } from "./context/AuthContext.jsx";
import Projects from "./pages/entrepreneur/Projects";
import Approvals from "./pages/entrepreneur/Approvals";
import Checklist from "./pages/entrepreneur/Checklist";
import Documents from "./pages/entrepreneur/Documents";
import Applications from "./pages/entrepreneur/Applications";
import OfficerApplications from "./pages/officer/Applications";
import RegulatoryManagement from "./pages/admin/RegulatoryManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Renewals from "./pages/entrepreneur/Renewals";
import Grievances from "./pages/entrepreneur/Grievances";
import RiskScrutiny from "./pages/officer/RiskScrutiny";
import Queries from "./pages/officer/Queries";
import Inspections from "./pages/officer/Inspections";
import SLAMonitoring from "./pages/officer/SLAMonitoring";

function DemoLogin() {
  const {
    demoLogin,
    loading,
    isAuthenticated,
  } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = new FormData(event.target);

    const email = form.get("email");
    const password = form.get("password");
    const role = form.get("role");

    try {
      await demoLogin(email, password, role);

      window.location.href = "/dashboard";
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "SIH Demo Login failed"
      );
    }
  };

  if (loading) {
    return <p>Loading UdyogSetu AI...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="demo-login-page">
      <section className="demo-login-left">
        <div className="demo-brand">
          <h1>UdyogSetu AI</h1>

          <p>
            Intelligent Industrial Approval &
            Compliance Management Platform
          </p>
        </div>

        <div className="demo-hero">
          <h2>
            Simplifying industrial approvals,
            compliance and government support.
          </h2>

          <p>
            A unified digital platform that helps
            entrepreneurs navigate regulatory
            requirements while enabling departments
            to efficiently process industrial
            applications.
          </p>

          <div className="demo-features">
            <div className="demo-feature">
              <strong>Regulatory Rules Engine</strong>

              <span>
                Determine applicable approvals using
                configurable regulatory rules.
              </span>
            </div>

            <div className="demo-feature">
              <strong>Approval Management</strong>

              <span>
                Manage applications across multiple
                government departments.
              </span>
            </div>

            <div className="demo-feature">
              <strong>Document Management</strong>

              <span>
                Organize required documents and perform
                pre-checks before submission.
              </span>
            </div>

            <div className="demo-feature">
              <strong>Risk & SLA Monitoring</strong>

              <span>
                Support risk-based scrutiny and track
                application processing timelines.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-login-right">
        <div className="demo-login-card">
          <h2>SIH Demo Login</h2>

          <p className="demo-login-card-subtitle">
            Explore UdyogSetu AI using one of the
            available system roles.
          </p>

          <div className="demo-notice">
            <strong>SIH Demonstration Mode</strong>

            Any email and password can be entered.
            No account registration is required for
            this demonstration.
          </div>

          <form
            className="demo-form"
            onSubmit={handleSubmit}
          >
            <div className="demo-form-group">
              <label htmlFor="demo-email">
                Email Address
              </label>

              <input
                id="demo-email"
                type="email"
                name="email"
                placeholder="Enter any email"
                required
              />
            </div>

            <div className="demo-form-group">
              <label htmlFor="demo-password">
                Password
              </label>

              <input
                id="demo-password"
                type="password"
                name="password"
                placeholder="Enter any password"
                required
              />
            </div>

            <div className="demo-form-group">
              <label htmlFor="demo-role">
                Explore As
              </label>

              <select
                id="demo-role"
                name="role"
                defaultValue="ENTREPRENEUR"
              >
                <option value="ENTREPRENEUR">
                  Entrepreneur
                </option>

                <option value="OFFICER">
                  Department Officer
                </option>

                <option value="ADMIN">
                  System Administrator
                </option>
              </select>
            </div>

            <button
              className="demo-login-button"
              type="submit"
            >
              Enter SIH Demo
            </button>
          </form>

          <div className="demo-login-footer">
            UdyogSetu AI • SIH Prototype Demonstration
          </div>
        </div>
      </section>
    </div>
  );
}

function Dashboard() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const role = user.role;

  return (
    <div className="dashboard-layout">
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h2>UdyogSetu AI</h2>

          <p>
            Industrial Approval &
            Compliance Platform
          </p>
        </div>

        <nav className="sidebar-nav">
          <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/dashboard";
  }}
>
  Dashboard
</button>

          {role === "ENTREPRENEUR" && (
            <>
              <button
  className="sidebar-nav-item"
  onClick={() => {
    window.location.href = "/projects";
  }}
>
  Industrial Projects
</button>

              <button onClick={() => (window.location.href = "/approvals")}>
              Approvals
            </button>

            <button onClick={() => (window.location.href = "/checklist")}>
  Approval Checklist
</button>

              <button onClick={() => (window.location.href = "/documents")}>
  Documents
</button>

              <button
  type="button"
  onClick={() => {
    window.location.href = "/applications";
  }}
>
  Applications
</button>

              <button className="sidebar-nav-item">
                Government Schemes
              </button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/renewals";
  }}
>
  Renewals
</button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/grievances";
  }}
>
  Grievances
</button>
            </>
          )}

          {role === "OFFICER" && (
            <>
              <button
  type="button"
  onClick={() => {
    window.location.href =
      "/officer/applications";
  }}
>
  Applications
</button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/officer/risk-scrutiny";
  }}
>
  Risk Scrutiny
</button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/officer/queries";
  }}
>
  Queries
</button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/officer/inspections";
  }}
>
  Inspections
</button>

              <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/officer/sla";
  }}
>
  SLA Monitoring
</button>
            </>
          )}

          {role === "ADMIN" && (
  <>
    <button
      className="sidebar-nav-item"
      type="button"
      onClick={() => {
        window.location.href = "/admin/regulatory-management";
      }}
    >
      Regulatory Management
    </button>

    <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/admin/audit-logs";
  }}
>
  Audit Logs
</button>

    <button
  className="sidebar-nav-item"
  type="button"
  onClick={() => {
    window.location.href = "/analytics";
  }}
>
  Analytics
</button>
  </>
)}
        </nav>

        <button
          className="dashboard-logout"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* =========================
          MAIN AREA
      ========================= */}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-title">
            <h1>
              {role === "ENTREPRENEUR" &&
                "Entrepreneur Dashboard"}

              {role === "OFFICER" &&
                "Officer Dashboard"}

              {role === "ADMIN" &&
                "Administration Dashboard"}
            </h1>

            <p>
              UdyogSetu AI Industrial Management
              Platform
            </p>
          </div>

          <div className="dashboard-profile">
            <div className="dashboard-profile-info">
              <div className="dashboard-profile-name">
                {user.full_name}
              </div>

              <div className="dashboard-profile-role">
                {role}
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main-content">
          {/* =========================
              WELCOME
          ========================= */}

          <section className="dashboard-welcome">
            <h2>
              Welcome, {user.full_name}
            </h2>

            <p>
              Here's an overview of your
              UdyogSetu AI workspace.
            </p>
          </section>

          {/* =========================
              STAT CARDS
          ========================= */}

          {role === "ENTREPRENEUR" && (
            <>
              <section className="dashboard-stat-grid">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Industrial Projects
                  </div>

                  <div className="dashboard-stat-value">
                    1
                  </div>

                  <div className="dashboard-stat-description">
                    Active projects
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Applicable Approvals
                  </div>

                  <div className="dashboard-stat-value">
                    4
                  </div>

                  <div className="dashboard-stat-description">
                    Based on regulatory rules
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Applications
                  </div>

                  <div className="dashboard-stat-value">
                    2
                  </div>

                  <div className="dashboard-stat-description">
                    Applications in process
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Documents
                  </div>

                  <div className="dashboard-stat-value">
                    8
                  </div>

                  <div className="dashboard-stat-description">
                    Documents uploaded
                  </div>
                </div>
              </section>

              <section className="dashboard-panel-grid">
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>Quick Actions</h3>

                    <span>
                      Common activities
                    </span>
                  </div>

                  <div className="dashboard-actions">
                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/projects";
  }}
>
  <strong>
    Create Industrial Project
  </strong>

  <span>
    Start a new industrial
    project.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/approvals";
  }}
>
  <strong>
    Check Applicable Approvals
  </strong>

  <span>
    Run the regulatory rules
    engine.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/documents";
  }}
>
  <strong>
    Upload Documents
  </strong>

  <span>
    Add documents to your
    Document Vault.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/applications";
  }}
>
  <strong>
    Track Applications
  </strong>

  <span>
    Monitor submitted
    applications.
  </span>
</button>
                  </div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>Application Status</h3>

                    <span>Overview</span>
                  </div>

                  <div className="dashboard-status-list">
                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Under Review
                      </span>

                      <span className="dashboard-status-value">
                        1
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Approved
                      </span>

                      <span className="dashboard-status-value">
                        1
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Pending Documents
                      </span>

                      <span className="dashboard-status-value">
                        2
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {role === "OFFICER" && (
            <>
              <section className="dashboard-stat-grid">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Assigned Applications
                  </div>

                  <div className="dashboard-stat-value">
                    6
                  </div>

                  <div className="dashboard-stat-description">
                    Applications requiring action
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Under Review
                  </div>

                  <div className="dashboard-stat-value">
                    3
                  </div>

                  <div className="dashboard-stat-description">
                    Applications under scrutiny
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Inspections
                  </div>

                  <div className="dashboard-stat-value">
                    2
                  </div>

                  <div className="dashboard-stat-description">
                    Scheduled inspections
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    SLA Attention
                  </div>

                  <div className="dashboard-stat-value">
                    1
                  </div>

                  <div className="dashboard-stat-description">
                    Application approaching SLA
                  </div>
                </div>
              </section>

              <section className="dashboard-panel-grid">
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>Officer Actions</h3>

                    <span>
                      Department workflow
                    </span>
                  </div>

                  <div className="dashboard-actions">
                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href =
      "/officer/applications";
  }}
>
  <strong>
    Review Applications
  </strong>

  <span>
    Examine assigned approval
    applications.
  </span>
</button>

                    <button className="dashboard-action">
                      <strong>
                        Risk-Based Scrutiny
                      </strong>

                      <span>
                        Review application risk
                        assessments.
                      </span>
                    </button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/officer/queries";
  }}
>
  <strong>
    Manage Queries
  </strong>

  <span>
    Request clarification from
    applicants.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href = "/officer/inspections";
  }}
>
  <strong>
    Manage Inspections
  </strong>

  <span>
    Review scheduled
    inspections.
  </span>
</button>
                  </div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>Department</h3>

                    <span>Officer profile</span>
                  </div>

                  <div className="dashboard-status-list">
                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Department
                      </span>

                      <span className="dashboard-status-value">
                        {user.department || "ICSD"}
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Active Applications
                      </span>

                      <span className="dashboard-status-value">
                        6
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        SLA Attention
                      </span>

                      <span className="dashboard-status-value">
                        1
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <section className="dashboard-stat-grid">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Departments
                  </div>

                  <div className="dashboard-stat-value">
                    8
                  </div>

                  <div className="dashboard-stat-description">
                    Configured departments
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Approval Types
                  </div>

                  <div className="dashboard-stat-value">
                    8
                  </div>

                  <div className="dashboard-stat-description">
                    Configured approval types
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Regulatory Rules
                  </div>

                  <div className="dashboard-stat-value">
                    8
                  </div>

                  <div className="dashboard-stat-description">
                    Configured rules
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-label">
                    Audit Events
                  </div>

                  <div className="dashboard-stat-value">
                    13
                  </div>

                  <div className="dashboard-stat-description">
                    Recent configuration events
                  </div>
                </div>
              </section>

              <section className="dashboard-panel-grid">
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>Administration Actions</h3>

                    <span>
                      Regulatory configuration
                    </span>
                  </div>

                  <div className="dashboard-actions">
                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href =
      "/admin/regulatory-management";
  }}
>
  <strong>
    Manage Departments
  </strong>

  <span>
    Configure government
    departments.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href =
      "/admin/regulatory-management";
  }}
>
  <strong>
    Manage Approval Types
  </strong>

  <span>
    Configure industrial approval
    types.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href =
      "/admin/regulatory-management";
  }}
>
  <strong>
    Manage Regulatory Rules
  </strong>

  <span>
    Configure rules used by the
    Rules Engine.
  </span>
</button>

                    <button
  className="dashboard-action"
  type="button"
  onClick={() => {
    window.location.href =
      "/admin/regulatory-management";
  }}
>
  <strong>
    Manage Documents
  </strong>

  <span>
    Configure required
    documents.
  </span>
</button>
                  </div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <h3>System Status</h3>

                    <span>Configuration</span>
                  </div>

                  <div className="dashboard-status-list">
                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Regulatory Engine
                      </span>

                      <span className="dashboard-status-value">
                        Active
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Rules Configuration
                      </span>

                      <span className="dashboard-status-value">
                        Active
                      </span>
                    </div>

                    <div className="dashboard-status-item">
                      <span className="dashboard-status-name">
                        Audit Logging
                      </span>

                      <span className="dashboard-status-value">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<DemoLogin />}
        />

        <Route
  path="/projects"
  element={<Projects />}
/>

        <Route path="/approvals" element={<Approvals />} />

        <Route path="/checklist" element={<Checklist />} />

        <Route path="/documents" element={<Documents />} />

        <Route path="/applications" element={<Applications />} />

        <Route path="/officer/queries" element={<Queries />} />

        <Route
  path="/officer/sla"
  element={<SLAMonitoring />}
/>

        <Route
  path="/officer/inspections"
  element={<Inspections />}
/>

        <Route
  path="/officer/risk-scrutiny"
  element={<RiskScrutiny />}
/>

        <Route
  path="/grievances"
  element={<Grievances />}
/>

        <Route
  path="/renewals"
  element={<Renewals />}
/>

        <Route
  path="/admin/regulatory-management"
  element={<RegulatoryManagement />}
/>

<Route
  path="/admin/audit-logs"
  element={<AuditLogs />}
/>

        <Route
  path="/officer/applications"
  element={<OfficerApplications />}
/>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/analytics/records"
          element={<AnalyticsRecords />}
        />

        <Route
          path="/projects/:projectId/schemes"
          element={<SchemeMatching />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

