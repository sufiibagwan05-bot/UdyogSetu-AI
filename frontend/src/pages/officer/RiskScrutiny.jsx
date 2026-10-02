import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function RiskScrutiny() {
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [assessment, setAssessment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("udyogsetu_token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE}/officer/applications`,
        authConfig
      );

      const data = response.data?.applications || [];

      setApplications(data);

      if (data.length > 0) {
        setSelectedApplicationId(String(data[0].id));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load officer applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRiskAssessment = async () => {
    if (!selectedApplicationId) {
      setError("Please select an application.");
      return;
    }

    try {
      setAssessing(true);
      setError("");
      setSuccess("");
      setAssessment(null);

      const response = await axios.post(
        `${API_BASE}/risk/${selectedApplicationId}/assess`,
        {},
        authConfig
      );

      setAssessment(response.data?.assessment || null);
      setSuccess(
        response.data?.message ||
          "Risk assessment completed successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to complete risk assessment."
      );
    } finally {
      setAssessing(false);
    }
  };

  const getRiskClass = (level) => {
    if (level === "HIGH") return "risk-high";
    if (level === "MEDIUM") return "risk-medium";
    return "risk-low";
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Risk Scrutiny</h1>
          <p>
            Perform rule-based risk assessment for assigned
            industrial applications.
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

      {success && (
        <div className="project-success">
          {success}
        </div>
      )}

      {!loading && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <div>
                <h2>Select Application</h2>
                <p>
                  Select an application assigned to your
                  department.
                </p>
              </div>
            </div>

            <div className="project-field">
              <label htmlFor="risk-application">
                Application
              </label>

              <select
                id="risk-application"
                value={selectedApplicationId}
                onChange={(e) => {
                  setSelectedApplicationId(e.target.value);
                  setAssessment(null);
                  setSuccess("");
                  setError("");
                }}
              >
                <option value="">
                  Select application
                </option>

                {applications.map((application) => (
                  <option
                    key={application.id}
                    value={application.id}
                  >
                    {application.application_number ||
                      `Application #${application.application_id}`}
                    {" - "}
                    {application.project_name ||
                      "Industrial Project"}
                  </option>
                ))}
              </select>
            </div>

            <div className="project-form-actions">
              <button
                type="button"
                className="project-primary-button"
                onClick={handleRiskAssessment}
                disabled={
                  assessing || !selectedApplicationId
                }
              >
                {assessing
                  ? "Assessing..."
                  : "Perform Risk Assessment"}
              </button>
            </div>
          </div>

          {assessment && (
            <div className="project-list-card">
              <div className="project-section-header">
                <div>
                  <h2>Risk Assessment Result</h2>
                  <p>
                    Rule-based assessment generated from
                    the application's available data.
                  </p>
                </div>
              </div>

              <div className="project-form-grid">
                <div className="project-field">
                  <label>Risk Level</label>

                  <div
                    className={`risk-result ${getRiskClass(
                      assessment.risk_level
                    )}`}
                  >
                    {assessment.risk_level}
                  </div>
                </div>

                <div className="project-field">
                  <label>Risk Score</label>

                  <div className="risk-score">
                    {assessment.risk_score}
                  </div>
                </div>
              </div>

              <div className="risk-recommendation">
                <strong>Recommendation</strong>
                <p>
                  {assessment.recommendation}
                </p>
              </div>

              <div className="project-table-wrapper">
                <h3>Triggered Risk Factors</h3>

                {assessment.factors &&
                assessment.factors.length > 0 ? (
                  <table className="project-table">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Risk Level</th>
                        <th>Weight</th>
                        <th>Description</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assessment.factors.map(
                        (factor, index) => (
                          <tr
                            key={
                              factor.ruleId || index
                            }
                          >
                            <td>
                              {factor.ruleName}
                            </td>
                            <td>
                              <span
                                className={`risk-badge ${getRiskClass(
                                  factor.riskLevel
                                )}`}
                              >
                                {factor.riskLevel}
                              </span>
                            </td>
                            <td>
                              {factor.weight}
                            </td>
                            <td>
                              {factor.description}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="project-empty-state">
                    No risk factors were triggered.
                  </div>
                )}
              </div>

              <div className="risk-assessment-meta">
                Assessment completed:{" "}
                {assessment.assessed_at
                  ? new Date(
                      assessment.assessed_at
                    ).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          )}

          {!assessment &&
            applications.length === 0 && (
              <div className="project-list-card">
                <div className="project-empty-state">
                  No officer applications are currently
                  available for risk scrutiny.
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}

export default RiskScrutiny;