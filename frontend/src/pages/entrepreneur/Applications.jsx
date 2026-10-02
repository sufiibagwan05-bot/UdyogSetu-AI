import React, { useEffect, useState } from "react";
import axios from "axios";

const Applications = () => {
  const token = localStorage.getItem("udyogsetu_token");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [approvals, setApprovals] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const response = await axios.get(
        "http://`${import.meta.env.VITE_API_URL}/api`/api/projects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fetchedProjects = response.data.projects || [];

      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0) {
        setSelectedProjectId(
          String(fetchedProjects[0].id)
        );
      }
    } catch (error) {
      console.error("FETCH PROJECTS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to retrieve projects."
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchApprovals = async (projectId) => {
    try {
      setLoadingApprovals(true);
      setError("");

      const response = await axios.get(
  `\({import.meta.env.VITE_API_URL}/api/parallel-workflow/\){projectId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setApprovals(response.data.approvals || []);
    } catch (error) {
      console.error("FETCH APPROVAL WORKFLOW ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to retrieve project approvals."
      );

      setApprovals([]);
    } finally {
      setLoadingApprovals(false);
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

  const handleCreateApplication = async (
  projectApprovalId
) => {
  try {
    setError("");

    await axios.post(
  `${import.meta.env.VITE_API_URL}/api/applications`,
  {
    projectApprovalId,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchApprovals(selectedProjectId);
  } catch (error) {
    console.error(
      "CREATE APPLICATION ERROR:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Failed to create application."
    );
  }
};

const handleSubmitApplication = async (
  applicationId
) => {
  try {
    setError("");

    await axios.post(
  `\({import.meta.env.VITE_API_URL}/api/applications/\){applicationId}/submit`,
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchApprovals(selectedProjectId);
  } catch (error) {
    console.error(
      "SUBMIT APPLICATION ERROR:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Failed to submit application."
    );
  }
};

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Applications</h1>

          <p>
            Create and submit applications for your
            applicable industrial approvals.
          </p>
        </div>
      </div>

      {error && (
        <div className="project-error">
          {error}
        </div>
      )}

      <div className="project-form-card">
        <div className="project-section-header">
          <div>
            <h2>Select Industrial Project</h2>

            <p>
              Choose a project to view its approval
              applications.
            </p>
          </div>
        </div>

        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No industrial projects found.</p>
        ) : (
          <div className="project-field">
            <label htmlFor="application-project">
              Industrial Project
            </label>

            <select
              id="application-project"
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
      </div>

      <div className="project-list-card">
        <div className="project-section-header">
          <div>
            <h2>Approval Applications</h2>

            <p>
              Applications linked to the selected
              project's approval workflow.
            </p>
          </div>

          <span className="project-count">
            {approvals.length} approvals
          </span>
        </div>

        {loadingApprovals ? (
          <p>Loading approval workflow...</p>
        ) : approvals.length === 0 ? (
          <div className="project-empty-state">
            No approval workflow found for this project.
          </div>
        ) : (
          <div className="project-table-wrapper">
            <table className="project-table">
              <thead>
                <tr>
                  <th>Approval</th>
                  <th>Department</th>
                  <th>Approval Status</th>
                  <th>Application</th>
                  <th>Application Status</th>
                </tr>
              </thead>

              <tbody>
                {approvals.map((approval) => (
                  <tr
                    key={approval.project_approval_id}
                  >
                    <td>
                      {approval.approval_name}
                    </td>

                    <td>
                      {approval.department_name}
                    </td>

                    <td>
                      {approval.approval_status}
                    </td>

                    <td>
                        
  {approval.application_number ? (
    approval.application_number
  ) : (
    <button
      type="button"
      className="project-secondary-button"
      onClick={() =>
        handleCreateApplication(
          approval.project_approval_id
        )
      }
    >
      Create Application
    </button>
  )}
</td>

                    <td>
  {approval.application_status ? (
    <div>
      <strong>
        {approval.application_status}
      </strong>

      {approval.application_status === "DRAFT" && (
        <>
          <br />

          <button
            type="button"
            className="project-secondary-button"
            onClick={() =>
              handleSubmitApplication(
                approval.application_id
              )
            }
          >
            Submit Application
          </button>
        </>
      )}
    </div>
  ) : (
    "Not created"
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;