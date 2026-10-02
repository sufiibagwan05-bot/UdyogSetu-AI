import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getEntrepreneurAnalytics,
  getOfficerAnalytics,
  getAdminAnalytics,
} from "../services/analyticsService";

import "./../Analytics.css";

const Analytics = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("udyogsetu_token");

        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        const payload = JSON.parse(
          atob(token.split(".")[1])
        );

        const userRole = payload.role;

        setRole(userRole);

        let data;

        if (userRole === "ENTREPRENEUR") {
          data = await getEntrepreneurAnalytics(token);
        } else if (userRole === "OFFICER") {
          data = await getOfficerAnalytics(token);
        } else if (userRole === "ADMIN") {
          data = await getAdminAnalytics(token);
        } else {
          setError("Unsupported user role");
          setLoading(false);
          return;
        }

        setAnalytics(data.analytics);
      } catch (err) {
        console.error("Analytics error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  /*
   * ============================================================
   * NAVIGATION HELPERS
   * ============================================================
   */

  const openProjects = () => {
    navigate("/analytics/records?type=projects");
  };

  const openAllApplications = () => {
    navigate("/analytics/records?type=applications");
  };

  const openPendingApplications = () => {
    navigate(
      "/analytics/records?type=applications&status=SUBMITTED"
    );
  };

  const openUnderReviewApplications = () => {
    navigate(
      "/analytics/records?type=applications&status=UNDER_REVIEW"
    );
  };

  const openApprovedApplications = () => {
    navigate(
      "/analytics/records?type=applications&status=APPROVED"
    );
  };

  const openRejectedApplications = () => {
    navigate(
      "/analytics/records?type=applications&status=REJECTED"
    );
  };

  const openAssignedApplications = () => {
    navigate(
      "/analytics/records?type=assigned"
    );
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="analytics-message">
        <h3>
          Loading UdyogSetu AI Analytics...
        </h3>

        <p>
          Please wait while dashboard data is loaded.
        </p>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <div className="analytics-message">
        <h3>Something went wrong</h3>

        <p>{error}</p>
      </div>
    );
  }

  /*
   * ============================================================
   * NO DATA
   * ============================================================
   */

  if (!analytics) {
    return (
      <div className="analytics-message">
        <h3>No analytics data available</h3>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* ========================================================
          TOP BAR
      ======================================================== */}

      <div className="analytics-topbar">

        <div className="analytics-topbar-inner">

          <div className="analytics-brand">

            <div className="analytics-brand-icon">
              🏭
            </div>

            <div>

              <h1>UdyogSetu AI</h1>

              <p>
                Intelligent Industrial Approval &
                Compliance Management Platform
              </p>

            </div>

          </div>

          <div className="analytics-role">
            {role}
          </div>

        </div>

      </div>


      {/* ========================================================
          MAIN CONTAINER
      ======================================================== */}

      <div className="analytics-container">


        {/* ======================================================
            ENTREPRENEUR DASHBOARD
        ====================================================== */}

        {role === "ENTREPRENEUR" && (
          <div className="analytics-section">

            <div className="analytics-section-header">

              <div>

                <h2>
                  My Projects & Applications
                </h2>

                <p>
                  Monitor your industrial projects
                  and approval progress.
                </p>

              </div>

            </div>


            <div className="analytics-card-grid">


              {/* TOTAL PROJECTS */}

              <div
                className="analytics-card"
                onClick={openProjects}
              >

                <div className="analytics-card-top">

                  <h3>
                    Total Projects
                  </h3>

                  <div className="analytics-card-icon">
                    🏭
                  </div>

                </div>

                <div className="analytics-card-value">
                  {analytics.projects.total_projects}
                </div>

                <div className="analytics-card-action">
                  View Projects →
                </div>

              </div>


              {/* TOTAL APPLICATIONS */}

              <div
                className="analytics-card"
                onClick={openAllApplications}
              >

                <div className="analytics-card-top">

                  <h3>
                    Total Applications
                  </h3>

                  <div className="analytics-card-icon">
                    📋
                  </div>

                </div>

                <div className="analytics-card-value">
                  {
                    analytics.applications
                      .total_applications
                  }
                </div>

                <div className="analytics-card-action">
                  View Applications →
                </div>

              </div>


              {/* PENDING */}

              <div
                className="analytics-card pending"
                onClick={openPendingApplications}
              >

                <div className="analytics-card-top">

                  <h3>
                    Pending
                  </h3>

                  <div className="analytics-card-icon">
                    ⏳
                  </div>

                </div>

                <div className="analytics-card-value">
                  {analytics.applications.pending}
                </div>

                <div className="analytics-card-action">
                  View Pending →
                </div>

              </div>


              {/* UNDER REVIEW */}

              <div
                className="analytics-card review"
                onClick={openUnderReviewApplications}
              >

                <div className="analytics-card-top">

                  <h3>
                    Under Review
                  </h3>

                  <div className="analytics-card-icon">
                    🔍
                  </div>

                </div>

                <div className="analytics-card-value">
                  {
                    analytics.applications
                      .under_review
                  }
                </div>

                <div className="analytics-card-action">
                  View Under Review →
                </div>

              </div>


              {/* APPROVED */}

              <div
                className="analytics-card approved"
                onClick={openApprovedApplications}
              >

                <div className="analytics-card-top">

                  <h3>
                    Approved
                  </h3>

                  <div className="analytics-card-icon">
                    ✓
                  </div>

                </div>

                <div className="analytics-card-value">
                  {
                    analytics.applications
                      .approved
                  }
                </div>

                <div className="analytics-card-action">
                  View Approved →
                </div>

              </div>


              {/* REJECTED */}

              <div
                className="analytics-card rejected"
                onClick={openRejectedApplications}
              >

                <div className="analytics-card-top">

                  <h3>
                    Rejected
                  </h3>

                  <div className="analytics-card-icon">
                    ✕
                  </div>

                </div>

                <div className="analytics-card-value">
                  {
                    analytics.applications
                      .rejected
                  }
                </div>

                <div className="analytics-card-action">
                  View Rejected →
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ======================================================
            OFFICER DASHBOARD
        ====================================================== */}

        {role === "OFFICER" && (
          <>

            <div className="analytics-section">

              <div className="analytics-section-header">

                <div>

                  <h2>
                    Officer Dashboard
                  </h2>

                  <p>
                    Monitor department applications
                    and assigned reviews.
                  </p>

                </div>

              </div>


              <div className="analytics-card-grid">


                {/* TOTAL APPLICATIONS */}

                <div
                  className="analytics-card"
                  onClick={openAllApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Total Applications
                    </h3>

                    <div className="analytics-card-icon">
                      📋
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .total_applications
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Applications →
                  </div>

                </div>


                {/* PENDING */}

                <div
                  className="analytics-card pending"
                  onClick={openPendingApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Pending
                    </h3>

                    <div className="analytics-card-icon">
                      ⏳
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {analytics.applications.pending}
                  </div>

                  <div className="analytics-card-action">
                    View Pending →
                  </div>

                </div>


                {/* UNDER REVIEW */}

                <div
                  className="analytics-card review"
                  onClick={openUnderReviewApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Under Review
                    </h3>

                    <div className="analytics-card-icon">
                      🔍
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .under_review
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Under Review →
                  </div>

                </div>


                {/* ASSIGNED TO ME */}

                <div
                  className="analytics-card"
                  onClick={openAssignedApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Assigned to Me
                    </h3>

                    <div className="analytics-card-icon">
                      👤
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .assigned_to_me
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Assigned →
                  </div>

                </div>


                {/* APPROVED */}

                <div
                  className="analytics-card approved"
                  onClick={openApprovedApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Approved
                    </h3>

                    <div className="analytics-card-icon">
                      ✓
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .approved
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Approved →
                  </div>

                </div>


                {/* REJECTED */}

                <div
                  className="analytics-card rejected"
                  onClick={openRejectedApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Rejected
                    </h3>

                    <div className="analytics-card-icon">
                      ✕
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .rejected
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Rejected →
                  </div>

                </div>

              </div>

            </div>


            {/* OFFICER SLA */}

            <div className="analytics-section">

              <div className="analytics-section-header">

                <div>

                  <h2>
                    SLA Monitoring
                  </h2>

                  <p>
                    Monitor application processing
                    deadlines.
                  </p>

                </div>

              </div>


              <div className="analytics-sla-panel">

                <div className="analytics-sla-box">

                  <div className="analytics-sla-box-header">

                    <h3>
                      Near SLA Limit
                    </h3>

                    <div className="analytics-card-icon">
                      ⏱
                    </div>

                  </div>

                  <div className="analytics-sla-number">
                    {analytics.sla.near_limit}
                  </div>

                  <div className="analytics-sla-status">
                    Applications approaching deadline
                  </div>

                </div>


                <div className="analytics-sla-box">

                  <div className="analytics-sla-box-header">

                    <h3>
                      SLA Breached
                    </h3>

                    <div className="analytics-card-icon">
                      ⚠
                    </div>

                  </div>

                  <div className="analytics-sla-number">
                    {analytics.sla.breached}
                  </div>

                  <div className="analytics-sla-status">
                    Applications beyond SLA deadline
                  </div>

                </div>

              </div>

            </div>

          </>
        )}


        {/* ======================================================
            ADMIN DASHBOARD
        ====================================================== */}

        {role === "ADMIN" && (
          <>

            <div className="analytics-section">

              <div className="analytics-section-header">

                <div>

                  <h2>
                    Administration Dashboard
                  </h2>

                  <p>
                    Monitor industrial projects,
                    applications and department workload.
                  </p>

                </div>

              </div>


              <div className="analytics-card-grid">


                {/* TOTAL PROJECTS */}

                <div
                  className="analytics-card"
                  onClick={openProjects}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Total Projects
                    </h3>

                    <div className="analytics-card-icon">
                      🏭
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {analytics.projects.total_projects}
                  </div>

                  <div className="analytics-card-action">
                    View Projects →
                  </div>

                </div>


                {/* TOTAL APPLICATIONS */}

                <div
                  className="analytics-card"
                  onClick={openAllApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Total Applications
                    </h3>

                    <div className="analytics-card-icon">
                      📋
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .total_applications
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Applications →
                  </div>

                </div>


                {/* PENDING */}

                <div
                  className="analytics-card pending"
                  onClick={openPendingApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Pending
                    </h3>

                    <div className="analytics-card-icon">
                      ⏳
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {analytics.applications.pending}
                  </div>

                  <div className="analytics-card-action">
                    View Pending →
                  </div>

                </div>


                {/* UNDER REVIEW */}

                <div
                  className="analytics-card review"
                  onClick={openUnderReviewApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Under Review
                    </h3>

                    <div className="analytics-card-icon">
                      🔍
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .under_review
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Under Review →
                  </div>

                </div>


                {/* APPROVED */}

                <div
                  className="analytics-card approved"
                  onClick={openApprovedApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Approved
                    </h3>

                    <div className="analytics-card-icon">
                      ✓
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .approved
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Approved →
                  </div>

                </div>


                {/* REJECTED */}

                <div
                  className="analytics-card rejected"
                  onClick={openRejectedApplications}
                >

                  <div className="analytics-card-top">

                    <h3>
                      Rejected
                    </h3>

                    <div className="analytics-card-icon">
                      ✕
                    </div>

                  </div>

                  <div className="analytics-card-value">
                    {
                      analytics.applications
                        .rejected
                    }
                  </div>

                  <div className="analytics-card-action">
                    View Rejected →
                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                DEPARTMENT WORKLOAD
            ================================================== */}

            <div className="analytics-section">

              <div className="analytics-section-header">

                <div>

                  <h2>
                    Department Workload
                  </h2>

                  <p>
                    Current application distribution
                    across departments.
                  </p>

                </div>

              </div>


              <div className="analytics-table-container">

                <table className="analytics-table">

                  <thead>

                    <tr>
                      <th>
                        Department
                      </th>

                      <th>
                        Applications
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {analytics.department_workload.map(
                      (department) => (
                        <tr
                          key={
                            department.department_id
                          }
                        >

                          <td>
                            {
                              department.department_name
                            }
                          </td>

                          <td>
                            {
                              department.application_count
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                ADMIN SLA
            ================================================== */}

            <div className="analytics-section">

              <div className="analytics-section-header">

                <div>

                  <h2>
                    SLA Monitoring
                  </h2>

                  <p>
                    Overall application SLA status.
                  </p>

                </div>

              </div>


              <div className="analytics-sla-panel">

                <div className="analytics-sla-box">

                  <div className="analytics-sla-box-header">

                    <h3>
                      Active
                    </h3>

                    <div className="analytics-card-icon">
                      ⏱
                    </div>

                  </div>

                  <div className="analytics-sla-number">
                    {analytics.sla.active}
                  </div>

                  <div className="analytics-sla-status">
                    Active SLA records
                  </div>

                </div>


                <div className="analytics-sla-box">

                  <div className="analytics-sla-box-header">

                    <h3>
                      Breached
                    </h3>

                    <div className="analytics-card-icon">
                      ⚠
                    </div>

                  </div>

                  <div className="analytics-sla-number">
                    {analytics.sla.breached}
                  </div>

                  <div className="analytics-sla-status">
                    SLA records beyond deadline
                  </div>

                </div>

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default Analytics;
