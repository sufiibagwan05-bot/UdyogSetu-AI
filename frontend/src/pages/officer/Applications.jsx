import React, { useEffect, useState } from "react";
import axios from "axios";

const Applications = () => {
  const token = localStorage.getItem("udyogsetu_token");

  const [applications, setApplications] = useState([]);
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplication, setSelectedApplication] =
  useState(null);

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

      setApplications(response.data.applications || []);
      setOfficer(response.data.officer || null);
    } catch (error) {
      console.error("OFFICER APPLICATIONS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to fetch officer applications."
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssign = async (applicationId) => {
  try {
    setError("");

    await axios.post(
  `\({import.meta.env.VITE_API_URL}/api/officer/applications/\){applicationId}/assign`,
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchApplications();
  } catch (error) {
    console.error("ASSIGN APPLICATION ERROR:", error);

    setError(
      error.response?.data?.message ||
        "Failed to assign application."
    );
  }
};

const handleApprove = async (applicationId) => {
  try {
    setError("");

    await axios.put(
  `\({import.meta.env.VITE_API_URL}/api/officer/applications/\){applicationId}/review`,
  {
    decision: "APPROVED",
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchApplications();
  } catch (error) {
    console.error("APPROVE APPLICATION ERROR:", error);

    setError(
      error.response?.data?.message ||
        "Failed to approve application."
    );
  }
};

const handleReject = async (applicationId) => {
  const rejectionReason = window.prompt(
    "Enter rejection reason:"
  );

  if (!rejectionReason || !rejectionReason.trim()) {
    return;
  }

  try {
    setError("");

    await axios.put(
  `\({import.meta.env.VITE_API_URL}/api/officer/applications/\){applicationId}/review`,
  {
    decision: "REJECTED",
    rejectionReason: rejectionReason.trim(),
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchApplications();
  } catch (error) {
    console.error("REJECT APPLICATION ERROR:", error);

    setError(
      error.response?.data?.message ||
        "Failed to reject application."
    );
  }
};

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Officer Applications</h1>
          <p>
            Review and process industrial applications assigned
            to your department.
          </p>
        </div>
      </div>

      {officer && (
        <div className="project-message">
          <strong>Officer:</strong> {officer.full_name}
          <br />
          <strong>Department:</strong> {officer.department_name}
        </div>
      )}

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

            {selectedApplication && (
        <div className="project-list-card">
          <div className="project-section-header">
            <h2>Application Details</h2>

            <button
              type="button"
              className="project-secondary-button"
              onClick={() => setSelectedApplication(null)}
            >
              Close
            </button>
          </div>

          <div className="project-form-grid">
            <div className="project-field">
              <strong>Application Number</strong>
              <span>
                {selectedApplication.application_number}
              </span>
            </div>

            <div className="project-field">
              <strong>Project Name</strong>
              <span>
                {selectedApplication.project_name}
              </span>
            </div>

            <div className="project-field">
              <strong>Approval</strong>
              <span>
                {selectedApplication.approval_name}
              </span>
            </div>

            <div className="project-field">
              <strong>Department</strong>
              <span>
                {selectedApplication.department_name}
              </span>
            </div>

            <div className="project-field">
              <strong>Entrepreneur</strong>
              <span>
                {selectedApplication.entrepreneur_name}
              </span>
            </div>

            <div className="project-field">
              <strong>Email</strong>
              <span>
                {selectedApplication.entrepreneur_email}
              </span>
            </div>

            <div className="project-field">
  <strong>Status</strong>
  <span>{selectedApplication.status}</span>
</div>

<div className="project-field">
  <strong>Processing Stage</strong>
  <span>
    {selectedApplication.status === "SUBMITTED"
      ? "Submitted - Waiting for Assignment"
      : selectedApplication.status === "UNDER_REVIEW"
      ? "Under Officer Review"
      : selectedApplication.status === "APPROVED"
      ? "Application Approved"
      : selectedApplication.status === "REJECTED"
      ? "Application Rejected"
      : "Draft"}
  </span>
</div>

            <div className="project-field">
              <strong>Submitted At</strong>
              <span>
                {selectedApplication.submitted_at
                  ? new Date(
                      selectedApplication.submitted_at
                    ).toLocaleString()
                  : "-"}
              </span>
            </div>

            <div className="project-field">
              <strong>Assigned Officer ID</strong>
              <span>
                {selectedApplication.assigned_officer_id ||
                  "Not assigned"}
              </span>
            </div>

            <div className="project-field">
              <strong>Rejection Reason</strong>
              <span>
                {selectedApplication.rejection_reason || "-"}
              </span>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="project-list-card">
          <div className="project-section-header">
            <h2>Applications</h2>
            <span className="project-count">
              {applications.length} application(s)
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="project-empty-state">
              No applications found for your department.
            </div>
          ) : (
            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Application Number</th>
                    <th>Project</th>
                    <th>Approval</th>
                    <th>Entrepreneur</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                    <th>Review</th>
                    <th>Details</th>
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

                      <td>
                        {application.submitted_at
                          ? new Date(
                              application.submitted_at
                            ).toLocaleString()
                          : "-"}
                      </td>

                            <td>
  {application.status === "SUBMITTED" &&
  !application.assigned_officer_id ? (
    <button
      type="button"
      className="project-secondary-button"
      onClick={() => handleAssign(application.id)}
    >
      Assign to Me
    </button>
  ) : application.status === "UNDER_REVIEW" &&
    application.assigned_officer_id ? (
    "Assigned to You"
  ) : application.status === "APPROVED" ||
    application.status === "REJECTED" ? (
    "Completed"
  ) : (
    "-"
  )}
</td>

<td>
  {application.status === "UNDER_REVIEW" &&
  application.assigned_officer_id ? (
    <div className="project-actions">
      <button
        type="button"
        className="project-primary-button"
        onClick={() => handleApprove(application.id)}
      >
        Approve
      </button>

      <button
        type="button"
        className="project-secondary-button"
        onClick={() => handleReject(application.id)}
      >
        Reject
      </button>
    </div>
  ) : application.status === "SUBMITTED" ? (
    "Waiting for Assignment"
  ) : application.status === "APPROVED" ? (
    "Approved"
  ) : application.status === "REJECTED" ? (
    "Rejected"
  ) : (
    "-"
  )}
</td>

<td>
  <button
  type="button"
  className="project-secondary-button"
  onClick={() => setSelectedApplication(application)}
>
  View Details
</button>
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

export default Applications;