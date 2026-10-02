import { useEffect, useState } from "react";
import axios from "axios";

const Approvals = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("udyogsetu_token");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5000/api/projects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjects(response.data.projects || []);
    } catch (error) {
      console.error("FETCH PROJECTS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load industrial projects."
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const evaluateRules = async () => {
    if (!selectedProjectId) {
      setError("Please select an industrial project.");
      return;
    }

    try {
      setEvaluating(true);
      setError("");
      setSuccess("");
      setApprovals([]);

      const response = await axios.post(
        `http://localhost:5000/api/rules/evaluate/${selectedProjectId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjectName(response.data.project?.name || "");
      setApprovals(response.data.applicableApprovals || []);

      setSuccess(
        response.data.message ||
          "Regulatory rules evaluated successfully."
      );
    } catch (error) {
      console.error("EVALUATE RULES ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to evaluate regulatory rules."
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Applicable Approvals</h1>
          <p>
            Evaluate your industrial project against the regulatory
            rules engine to identify applicable approvals.
          </p>
        </div>
      </div>

      {error && (
        <div className="project-error">
          {error}
        </div>
      )}

      {success && (
        <div className="project-success">
          {success}
        </div>
      )}

      <div className="project-form-card">
        <div className="project-section-header">
          <div>
            <h2>Regulatory Rules Evaluation</h2>
            <p>
              Select a project and run the regulatory rules engine.
            </p>
          </div>
        </div>

        <div className="project-form-grid">
          <div className="project-field">
            <label>Select Industrial Project</label>

            {loadingProjects ? (
              <p>Loading projects...</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setApprovals([]);
                  setProjectName("");
                  setSuccess("");
                  setError("");
                }}
              >
                <option value="">
                  Select a project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.project_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="project-form-actions">
          <button
            type="button"
            className="project-primary-button"
            onClick={evaluateRules}
            disabled={evaluating || !selectedProjectId}
          >
            {evaluating
              ? "Evaluating Rules..."
              : "Run Regulatory Rules Engine"}
          </button>
        </div>
      </div>

      {projectName && (
        <div className="project-list-card">
          <div className="project-section-header">
            <div>
              <h2>Regulatory Evaluation Result</h2>
              <p>
                Project: <strong>{projectName}</strong>
              </p>
            </div>

            <span className="project-count">
              {approvals.length} applicable approval
              {approvals.length !== 1 ? "s" : ""}
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="project-empty-state">
              <h3>No applicable approvals found</h3>
              <p>
                The current project details did not match any active
                regulatory rules.
              </p>
            </div>
          ) : (
            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Approval</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Rule</th>
                  </tr>
                </thead>

                <tbody>
                  {approvals.map((approval) => (
                    <tr key={approval.ruleId}>
                      <td>
                        <strong>
                          {approval.approvalName}
                        </strong>

                        <div>
                          <small>
                            {approval.approvalCode}
                          </small>
                        </div>

                        {approval.approvalDescription && (
                          <div>
                            <small>
                              {approval.approvalDescription}
                            </small>
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>
                          {approval.departmentName}
                        </strong>

                        <div>
                          <small>
                            {approval.departmentCode}
                          </small>
                        </div>
                      </td>

                      <td>
                        {approval.priority}
                      </td>

                      <td>
                        <strong>
                          {approval.ruleName}
                        </strong>

                        {approval.description && (
                          <div>
                            <small>
                              {approval.description}
                            </small>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Approvals;