import { useEffect, useState } from "react";
import axios from "axios";

const Checklist = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [checklist, setChecklist] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

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

  const fetchChecklist = async () => {
    if (!selectedProjectId) {
      setError("Please select an industrial project.");
      return;
    }

    try {
      setLoadingChecklist(true);
      setError("");
      setSuccess("");
      setChecklist([]);

      const response = await axios.get(
        `http://localhost:5000/api/checklist/${selectedProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjectName(response.data.project?.project_name || "");
      setChecklist(response.data.checklist || []);

      setSuccess(
        response.data.message ||
          "Project approval checklist retrieved successfully."
      );
    } catch (error) {
      console.error("FETCH CHECKLIST ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to retrieve project approval checklist."
      );
    } finally {
      setLoadingChecklist(false);
    }
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Approval Checklist</h1>
          <p>
            View applicable approvals, required documents, SLA,
            inspection and renewal requirements for your project.
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
            <h2>Select Industrial Project</h2>
            <p>
              Retrieve the personalized approval checklist generated
              for your project.
            </p>
          </div>
        </div>

        <div className="project-form-grid">
          <div className="project-field">
            <label>Select Project</label>

            {loadingProjects ? (
              <p>Loading projects...</p>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setChecklist([]);
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
            onClick={fetchChecklist}
            disabled={
              loadingChecklist || !selectedProjectId
            }
          >
            {loadingChecklist
              ? "Loading Checklist..."
              : "View Approval Checklist"}
          </button>
        </div>
      </div>

      {projectName && (
        <div className="project-list-card">
          <div className="project-section-header">
            <div>
              <h2>Project Approval Checklist</h2>
              <p>
                Project: <strong>{projectName}</strong>
              </p>
            </div>

            <span className="project-count">
              {checklist.length} approval
              {checklist.length !== 1 ? "s" : ""}
            </span>
          </div>

          {checklist.length === 0 ? (
            <div className="project-empty-state">
              <h3>No checklist items found</h3>
              <p>
                No approval checklist entries are currently
                available for this project.
              </p>
            </div>
          ) : (
            <div>
              {checklist.map((item) => (
                <div
                  key={item.project_approval_id}
                  className="project-form-card"
                  style={{ marginBottom: "20px" }}
                >
                  <div className="project-section-header">
                    <div>
                      <h2>{item.approval_name}</h2>

                      <p>
                        {item.approval_code}
                      </p>
                    </div>

                    <span className="project-status">
                      {item.status}
                    </span>
                  </div>

                  {item.approval_description && (
                    <p>
                      {item.approval_description}
                    </p>
                  )}

                  <div className="project-form-grid">
                    <div className="project-field">
                      <label>Department</label>
                      <p>
                        <strong>
                          {item.department_name}
                        </strong>
                        <br />
                        {item.department_code}
                      </p>
                    </div>

                    <div className="project-field">
                      <label>Applicability</label>
                      <p>
                        {item.applicability_status}
                      </p>
                    </div>

                    <div className="project-field">
                      <label>SLA</label>
                      <p>
                        {item.sla_days
                          ? `${item.sla_days} days`
                          : "Not configured"}
                      </p>
                    </div>

                    <div className="project-field">
                      <label>Inspection</label>
                      <p>
                        {item.inspection_required
                          ? "Required"
                          : "Not Required"}
                      </p>
                    </div>

                    <div className="project-field">
                      <label>Renewal</label>
                      <p>
                        {item.renewal_required
                          ? "Required"
                          : "Not Required"}
                      </p>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="project-requirements">
                      <strong>Reason</strong>
                      <p>{item.reason}</p>
                    </div>
                  )}

                  <div className="project-requirements">
                    <h3>Required Documents</h3>

                    {item.required_documents?.length === 0 ? (
                      <p>
                        No required documents configured.
                      </p>
                    ) : (
                      <ul>
                        {item.required_documents.map(
                          (document) => (
                            <li key={document.id}>
                              <strong>
                                {document.documentName}
                              </strong>

                              {document.isMandatory && (
                                <span>
                                  {" "}
                                  — Mandatory
                                </span>
                              )}

                              <br />

                              <small>
                                {document.documentCode}
                              </small>

                              {document.description && (
                                <>
                                  <br />
                                  <small>
                                    {document.description}
                                  </small>
                                </>
                              )}

                              <br />

                              <small>
                                Allowed:{" "}
                                {document.allowedFileTypes?.join(
                                  ", "
                                ) || "Not specified"}
                              </small>

                              {document.maxFileSizeMb && (
                                <>
                                  <br />
                                  <small>
                                    Max size:{" "}
                                    {
                                      document.maxFileSizeMb
                                    }{" "}
                                    MB
                                  </small>
                                </>
                              )}

                              {document.validityRequired && (
                                <>
                                  <br />
                                  <small>
                                    Document validity
                                    required
                                  </small>
                                </>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Checklist;