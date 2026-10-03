import React, { useEffect, useState } from "react";
import axios from "axios";

const Queries = () => {
  const token = localStorage.getItem("udyogsetu_token");

  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] =
    useState("");
  const [queryText, setQueryText] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/officer/applications`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const underReviewApplications =
        (response.data.applications || []).filter(
          (application) =>
            application.status === "UNDER_REVIEW" &&
            application.assigned_officer_id
        );

      setApplications(underReviewApplications);

      if (underReviewApplications.length > 0) {
        setSelectedApplicationId(
          String(underReviewApplications[0].id)
        );
      }
    } catch (error) {
      console.error("OFFICER QUERIES ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to fetch applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = async (event) => {
    event.preventDefault();

    if (!selectedApplicationId) {
      setError("Please select an application.");
      return;
    }

    if (!queryText.trim()) {
      setError("Please enter the query.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await axios.post(
        `\({import.meta.env.VITE_API_URL}/api/queries/\){selectedApplicationId}`,
        {
          queryText: queryText.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message ||
          "Query raised successfully."
      );

      setQueryText("");
    } catch (error) {
      console.error("RAISE QUERY ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to raise query."
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Application Queries</h1>
          <p>
            Raise queries for applications currently under
            officer review.
          </p>
        </div>
      </div>

      {loading && (
        <div className="project-message">
          Loading applications...
        </div>
      )}

      {error && (
        <div className="project-error">
          {error}
        </div>
      )}

      {message && (
        <div className="project-message">
          {message}
        </div>
      )}

      {!loading && (
        <>
          {applications.length === 0 ? (
            <div className="project-list-card">
              <div className="project-empty-state">
                No UNDER_REVIEW applications are currently
                assigned to you.
              </div>
            </div>
          ) : (
            <div className="project-list-card">
              <div className="project-section-header">
                <h2>Raise Query</h2>
                <span className="project-count">
                  {applications.length} application(s)
                </span>
              </div>

              <form onSubmit={handleRaiseQuery}>
                <div className="project-form-grid">
                  <div className="project-field">
                    <label htmlFor="application">
                      Application
                    </label>

                    <select
                      id="application"
                      value={selectedApplicationId}
                      onChange={(event) =>
                        setSelectedApplicationId(
                          event.target.value
                        )
                      }
                    >
                      {applications.map((application) => (
                        <option
                          key={application.id}
                          value={application.id}
                        >
                          {application.application_number} -{" "}
                          {application.project_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="project-field">
                    <label htmlFor="queryText">
                      Query
                    </label>

                    <textarea
                      id="queryText"
                      rows="6"
                      value={queryText}
                      onChange={(event) =>
                        setQueryText(event.target.value)
                      }
                      placeholder="Enter the information or document required from the entrepreneur..."
                    />
                  </div>
                </div>

                <div className="project-actions">
                  <button
                    type="submit"
                    className="project-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Raising Query..."
                      : "Raise Query"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {applications.length > 0 && (
            <div className="project-list-card">
              <div className="project-section-header">
                <h2>Eligible Applications</h2>
              </div>

              <div className="project-table-wrapper">
                <table className="project-table">
                  <thead>
                    <tr>
                      <th>Application Number</th>
                      <th>Project</th>
                      <th>Approval</th>
                      <th>Entrepreneur</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id}>
                        <td>
                          {application.application_number}
                        </td>

                        <td>
                          {application.project_name}
                        </td>

                        <td>
                          {application.approval_name}
                        </td>

                        <td>
                          {application.entrepreneur_name}
                          <br />
                          <small>
                            {application.entrepreneur_email}
                          </small>
                        </td>

                        <td>
                          <span className="project-status">
                            {application.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Queries;