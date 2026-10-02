import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const CATEGORY_OPTIONS = [
  {
    value: "APPLICATION_DELAY",
    label: "Application Delay",
  },
  {
    value: "DOCUMENT_ISSUE",
    label: "Document Issue",
  },
  {
    value: "OFFICER_QUERY",
    label: "Officer Query",
  },
  {
    value: "APPROVAL_ISSUE",
    label: "Approval Issue",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
];

function Grievances() {
  const token = localStorage.getItem(
    "udyogsetu_token"
  );

  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState(
    []
  );
  const [grievances, setGrievances] = useState([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState("");
  const [
    selectedApplicationId,
    setSelectedApplicationId,
  ] = useState("");

  const [category, setCategory] = useState(
    "APPLICATION_DELAY"
  );
  const [description, setDescription] =
    useState("");
  const [priority, setPriority] =
    useState("MEDIUM");

  const [loadingProjects, setLoadingProjects] =
    useState(true);
  const [loadingGrievances, setLoadingGrievances] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        "FETCH GRIEVANCE PROJECTS ERROR:",
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

  const fetchGrievances = async () => {
    try {
      setLoadingGrievances(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/grievances`,
        authConfig
      );

      setGrievances(
        response.data.grievances || []
      );
    } catch (err) {
      console.error(
        "FETCH GRIEVANCES ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load grievances."
      );
    } finally {
      setLoadingGrievances(false);
    }
  };

  const fetchApplications = async (
    projectId
  ) => {
    if (!projectId) {
      setApplications([]);
      setSelectedApplicationId("");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/parallel-workflow/${projectId}`,
        authConfig
      );

      const approvals =
        response.data.approvals || [];

      const applicationList = approvals.filter(
        (approval) =>
          approval.application_id &&
          approval.application_number
      );

      setApplications(applicationList);

      if (applicationList.length > 0) {
        setSelectedApplicationId(
          String(
            applicationList[0].application_id
          )
        );
      } else {
        setSelectedApplicationId("");
      }
    } catch (err) {
      console.error(
        "FETCH GRIEVANCE APPLICATIONS ERROR:",
        err
      );

      setApplications([]);
      setSelectedApplicationId("");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchGrievances();
  }, []);

  useEffect(() => {
    fetchApplications(selectedProjectId);
  }, [selectedProjectId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!selectedProjectId) {
        setError(
          "Please select an industrial project."
        );
        return;
      }

      if (!description.trim()) {
        setError(
          "Please enter a grievance description."
        );
        return;
      }

      await axios.post(
        `${API_BASE_URL}/grievances`,
        {
          projectId: Number(
            selectedProjectId
          ),
          applicationId:
            selectedApplicationId
              ? Number(
                  selectedApplicationId
                )
              : null,
          category,
          description:
            description.trim(),
          priority,
        },
        authConfig
      );

      setSuccess(
        "Grievance submitted successfully."
      );

      setDescription("");

      await fetchGrievances();
    } catch (err) {
      console.error(
        "CREATE GRIEVANCE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to submit grievance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Grievances</h1>

          <p>
            Raise and track grievances related to
            your industrial approvals and
            applications.
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
            <h2>Raise a Grievance</h2>

            <p>
              Submit a grievance related to an
              industrial project or application.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="project-form-grid">
            <div className="project-field">
              <label htmlFor="grievance-project">
                Industrial Project
              </label>

              <select
                id="grievance-project"
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(
                    event.target.value
                  )
                }
                disabled={loadingProjects}
              >
                {projects.length === 0 ? (
                  <option value="">
                    No projects available
                  </option>
                ) : (
                  projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.project_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="project-field">
              <label htmlFor="grievance-application">
                Application
              </label>

              <select
                id="grievance-application"
                value={selectedApplicationId}
                onChange={(event) =>
                  setSelectedApplicationId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  General Project Grievance
                </option>

                {applications.map(
                  (application) => (
                    <option
                      key={
                        application.application_id
                      }
                      value={
                        application.application_id
                      }
                    >
                      {
                        application.application_number
                      }{" "}
                      -{" "}
                      {
                        application.approval_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="project-field">
              <label htmlFor="grievance-category">
                Category
              </label>

              <select
                id="grievance-category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                {CATEGORY_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="project-field">
              <label htmlFor="grievance-priority">
                Priority
              </label>

              <select
                id="grievance-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value
                  )
                }
              >
                {PRIORITY_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="project-field">
            <label htmlFor="grievance-description">
              Description
            </label>

            <textarea
              id="grievance-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe your grievance or issue..."
              rows="5"
            />
          </div>

          <div className="project-form-actions">
            <button
              type="submit"
              className="project-primary-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Grievance"}
            </button>
          </div>
        </form>
      </section>

      <section className="project-list-card">
        <div className="project-section-header">
          <div>
            <h2>My Grievances</h2>

            <p>
              Track the status of grievances you
              have submitted.
            </p>
          </div>

          <span className="project-count">
            {grievances.length} grievance
            {grievances.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {loadingGrievances ? (
          <div className="project-empty-state">
            Loading grievances...
          </div>
        ) : grievances.length === 0 ? (
          <div className="project-empty-state">
            No grievances found.
          </div>
        ) : (
          <div className="project-table-wrapper">
            <table className="project-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Application</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {grievances.map(
                  (grievance) => (
                    <tr
                      key={grievance.id}
                    >
                      <td>
                        {grievance.project_name ||
                          grievance.project_id ||
                          "-"}
                      </td>

                      <td>
                        {grievance.application_number ||
                          "Project Level"}
                      </td>

                      <td>
                        {grievance.category}
                      </td>

                      <td>
                        {grievance.priority}
                      </td>

                      <td>
                        {grievance.status}
                      </td>

                      <td>
                        {grievance.created_at
                          ? new Date(
                              grievance.created_at
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Grievances;