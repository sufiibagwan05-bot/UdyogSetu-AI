import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import {
  getAdminProjects,
  getAdminApplications,
} from "../services/analyticsService";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;;

const AnalyticsRecords = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const [role, setRole] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem("token");

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

        let applications = [];
        let projects = [];

        /*
         * ==========================
         * ADMIN
         * ==========================
         */

        if (userRole === "ADMIN") {
          if (type === "projects") {
            const response =
              await getAdminProjects(token);

            projects = response.projects || [];

            setRecords(projects);
          } else {
            const response =
              await getAdminApplications(token);

            applications =
              response.applications || [];

            setRecords(
              filterApplications(
                applications,
                status
              )
            );
          }
        }

        /*
         * ==========================
         * ENTREPRENEUR
         * ==========================
         */

        if (userRole === "ENTREPRENEUR") {
          if (type === "projects") {
            const response = await axios.get(
              `${API_BASE_URL}/projects`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            projects =
              response.data.projects ||
              response.data.data ||
              [];

            setRecords(projects);
          } else {
            const response = await axios.get(
              `${API_BASE_URL}/applications`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            applications =
              response.data.applications ||
              response.data.data ||
              [];

            setRecords(
              filterApplications(
                applications,
                status
              )
            );
          }
        }

        /*
         * ==========================
         * OFFICER
         * ==========================
         */

        if (userRole === "OFFICER") {
          const response = await axios.get(
            `${API_BASE_URL}/officer/applications`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          applications =
            response.data.applications ||
            response.data.data ||
            [];

          if (type === "assigned") {
            applications =
              applications.filter(
                (application) =>
                  application.assigned_officer_id
              );
          }

          setRecords(
            filterApplications(
              applications,
              status
            )
          );
        }
      } catch (err) {
        console.error(
          "Analytics records error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load records"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [type, status]);

  const filterApplications = (
    applications,
    selectedStatus
  ) => {
    if (!selectedStatus) {
      return applications;
    }

    return applications.filter(
      (application) =>
        application.status === selectedStatus
    );
  };

  const getPageTitle = () => {
    if (type === "projects") {
      return "Industrial Projects";
    }

    if (status === "SUBMITTED") {
      return "Pending Applications";
    }

    if (status === "UNDER_REVIEW") {
      return "Applications Under Review";
    }

    if (status === "APPROVED") {
      return "Approved Applications";
    }

    if (status === "REJECTED") {
      return "Rejected Applications";
    }

    if (type === "assigned") {
      return "Applications Assigned to Me";
    }

    return "Applications";
  };

  if (loading) {
    return (
      <div className="analytics-message">
        <h3>Loading records...</h3>
        <p>
          Please wait while UdyogSetu AI loads
          the selected records.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-message">
        <h3>Unable to load records</h3>
        <p>{error}</p>

        <button
          onClick={() => navigate("/analytics")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* ================= TOP BAR ================= */}

      <div className="analytics-topbar">
        <div className="analytics-topbar-inner">

          <div className="analytics-brand">

            <div className="analytics-brand-icon">
              🏭
            </div>

            <div>
              <h1>UdyogSetu AI</h1>

              <p>
                Analytics & Operational Records
              </p>
            </div>

          </div>

          <div className="analytics-role">
            {role}
          </div>

        </div>
      </div>


      {/* ================= CONTENT ================= */}

      <div className="analytics-container">

        <div className="analytics-section">

          <div className="analytics-section-header">

            <div>
              <h2>{getPageTitle()}</h2>

              <p>
                Records opened from the analytics
                dashboard.
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/analytics")
              }
              style={{
                border: "1px solid #dce3ed",
                background: "#ffffff",
                padding: "10px 16px",
                borderRadius: "9px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#344054",
              }}
            >
              ← Back to Dashboard
            </button>

          </div>


          {/* ================= RECORDS TABLE ================= */}

          <div className="analytics-table-container">

            {records.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#667085",
                }}
              >
                No records found.
              </div>
            ) : type === "projects" ? (

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Business Type</th>
                    <th>Investment</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((project) => (
                    <tr key={project.id}>

                      <td>
                        {project.project_name ||
                          project.projectName ||
                          "—"}
                      </td>

                      <td>
                        {project.business_type ||
                          project.businessType ||
                          "—"}
                      </td>

                      <td>
                        ₹
                        {Number(
                          project.investment_amount ||
                            project.investmentAmount ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {project.project_stage ||
                          project.projectStage ||
                          "—"}
                      </td>

                      <td>
                        {project.status ||
                          "—"}
                      </td>

                      <td>
                        {project.location ||
                          "—"}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            ) : (

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Application No.</th>
                    <th>Project</th>
                    <th>Approval</th>
                    <th>Department</th>
                    <th>Entrepreneur</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map(
                    (application) => (
                      <tr
                        key={
                          application.id
                        }
                      >

                        <td>
                          {application.application_number ||
                            application.applicationNumber ||
                            "—"}
                        </td>

                        <td>
                          {application.project_name ||
                            application.projectName ||
                            "—"}
                        </td>

                        <td>
                          {application.approval_name ||
                            application.approvalName ||
                            "—"}
                        </td>

                        <td>
                          {application.department_name ||
                            application.departmentName ||
                            "—"}
                        </td>

                        <td>
                          {application.entrepreneur_name ||
                            application.entrepreneurName ||
                            "—"}
                        </td>

                        <td>
                          {application.status ||
                            "—"}
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default AnalyticsRecords;
