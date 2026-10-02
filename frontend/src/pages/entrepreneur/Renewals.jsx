import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

function Renewals() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [renewals, setRenewals] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [creatingRenewal, setCreatingRenewal] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("udyogsetu_token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/projects`,
        authConfig
      );

      const fetchedProjects =
        response.data.projects || [];

      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0) {
        setSelectedProjectId(
          String(fetchedProjects[0].id)
        );
      }
    } catch (err) {
      console.error(
        "FETCH RENEWAL PROJECTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load industrial projects."
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchApprovals = async (projectId) => {
    try {
      setLoadingApprovals(true);
      setLoadingRenewals(true);
      setError("");
      setRenewals({});

      const response = await axios.get(
        `${API_BASE_URL}/parallel-workflow/${projectId}`,
        authConfig
      );

      const fetchedApprovals =
        response.data.approvals || [];

      setApprovals(fetchedApprovals);

      const renewalResults = {};

      for (const approval of fetchedApprovals) {
        if (
          approval.application_id &&
          approval.application_status === "APPROVED"
        ) {
          try {
            const renewalResponse =
              await axios.get(
                `${API_BASE_URL}/renewals/${approval.application_id}`,
                authConfig
              );

            renewalResults[
              approval.application_id
            ] = renewalResponse.data.renewal;
          } catch (err) {
            // No renewal record for this application.
            // This is valid for approvals that do not
            // have renewal configuration.
          }
        }
      }

      setRenewals(renewalResults);
    } catch (err) {
      console.error(
        "FETCH RENEWALS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load renewal information."
      );

      setApprovals([]);
    } finally {
      setLoadingApprovals(false);
      setLoadingRenewals(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchApprovals(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreateRenewal = async (
    applicationId
  ) => {
    try {
      setCreatingRenewal(applicationId);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API_BASE_URL}/renewals/${applicationId}/create`,
        {},
        authConfig
      );

      setSuccess(
        response.data.message ||
          "Renewal application created successfully."
      );

      await fetchApprovals(selectedProjectId);
    } catch (err) {
      console.error(
        "CREATE RENEWAL ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create renewal application."
      );
    } finally {
      setCreatingRenewal(null);
    }
  };

  const approvedRenewals = approvals.filter(
    (approval) =>
      approval.application_id &&
      approval.application_status === "APPROVED" &&
      renewals[approval.application_id]
  );

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Renewals</h1>

          <p>
            View approval validity and manage
            renewal applications for your
            industrial projects.
          </p>
        </div>
      </div>

      {error && (
        <div className="project-message project-error">
          {error}
        </div>
      )}

      {success && (
        <div className="project-message project-success">
          {success}
        </div>
      )}

      <section className="project-form-card">
        <div className="project-section-header">
          <div>
            <h2>Select Industrial Project</h2>

            <p>
              Choose a project to view its
              renewal information.
            </p>
          </div>
        </div>

        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="project-empty-state">
            No industrial projects found.
          </div>
        ) : (
          <div className="project-field">
            <label htmlFor="renewal-project">
              Industrial Project
            </label>

            <select
              id="renewal-project"
              value={selectedProjectId}
              onChange={(event) =>
                setSelectedProjectId(
                  event.target.value
                )
              }
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="project-list-card">
        <div className="project-section-header">
          <div>
            <h2>Renewal Information</h2>

            <p>
              Approved applications with renewal
              configuration are shown here.
            </p>
          </div>

          <span className="project-count">
            {approvedRenewals.length} renewal
            {approvedRenewals.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {loadingApprovals || loadingRenewals ? (
          <div className="project-empty-state">
            Loading renewal information...
          </div>
        ) : approvedRenewals.length === 0 ? (
          <div className="project-empty-state">
            No renewal records found for the
            selected project.
          </div>
        ) : (
          <div className="project-table-wrapper">
            <table className="project-table">
              <thead>
                <tr>
                  <th>Approval</th>
                  <th>Application</th>
                  <th>Valid From</th>
                  <th>Valid Until</th>
                  <th>Renewal Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {approvedRenewals.map(
                  (approval) => {
                    const renewal =
                      renewals[
                        approval.application_id
                      ];

                    const hasRenewalApplication =
                      Boolean(
                        renewal.renewal_application_id
                      );

                    return (
                      <tr
                        key={
                          approval.application_id
                        }
                      >
                        <td>
                          <strong>
                            {
                              approval.approval_name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            approval.application_number
                          }
                        </td>

                        <td>
                          {renewal.current_valid_from ||
                            "-"}
                        </td>

                        <td>
                          {renewal.current_valid_until ||
                            "-"}
                        </td>

                        <td>
                          {renewal.renewal_due_date ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`project-status project-status-${String(
                              renewal.status ||
                                "UNKNOWN"
                            ).toLowerCase()}`}
                          >
                            {renewal.status}
                          </span>
                        </td>

                        <td>
                          {hasRenewalApplication ? (
                            <span>
                              Renewal Application
                              Created
                            </span>
                          ) : renewal.status ===
                            "ACTIVE" ? (
                            <button
                              type="button"
                              className="project-secondary-button"
                              disabled={
                                creatingRenewal ===
                                approval.application_id
                              }
                              onClick={() =>
                                handleCreateRenewal(
                                  approval.application_id
                                )
                              }
                            >
                              {creatingRenewal ===
                              approval.application_id
                                ? "Creating..."
                                : "Create Renewal"}
                            </button>
                          ) : (
                            <span>
                              Renewal not available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Renewals;