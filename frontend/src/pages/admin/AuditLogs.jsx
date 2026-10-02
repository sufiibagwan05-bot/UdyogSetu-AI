import { useEffect, useState } from "react";
import axios from "axios";

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("udyogsetu_token");

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/admin/audit-logs`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

        setAuditLogs(response.data.auditLogs || []);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [token]);

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            Review important system actions and administrative activity.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading audit logs...</p>
      ) : auditLogs.length === 0 ? (
        <div className="project-empty-state">
          <h3>No audit logs found</h3>
          <p>
            There are currently no recorded system activities.
          </p>
        </div>
      ) : (
        <div className="project-table-wrapper">
          <table className="project-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_email || "-"}</td>

                  <td>{log.action || "-"}</td>

                  <td>{log.entity_type || "-"}</td>

                  <td>{log.entity_id || "-"}</td>

                  <td>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;