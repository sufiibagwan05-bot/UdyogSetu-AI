import { useEffect, useState } from "react";
import axios from "axios";

function SLAMonitoring() {
  const [applications, setApplications] = useState([]);
  const [slaRecords, setSlaRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("udyogsetu_token");

  useEffect(() => {
    const loadSLAData = async () => {
      try {
        const applicationsResponse = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/officer/applications`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

        const apps =
          applicationsResponse.data.applications || [];

        setApplications(apps);

        const records = [];

        for (const application of apps) {
          try {
            const slaResponse = await axios.get(
              `\({import.meta.env.VITE_API_URL}/api/sla/\){application.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (slaResponse.data.sla) {
              records.push({
                ...slaResponse.data.sla,
                application_number:
                  application.application_number,
                project_name:
                  application.project_name,
              });
            }
          } catch (error) {
            // Application may not have an SLA yet.
          }
        }

        setSlaRecords(records);
      } catch (error) {
        console.error(
          "Failed to load SLA data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadSLAData();
  }, [token]);

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Officer SLA Monitoring</h1>

          <p>
            Monitor application processing deadlines
            and SLA status.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading SLA records...</p>
      ) : slaRecords.length === 0 ? (
        <div className="project-empty-state">
          <h3>No SLA records found</h3>

          <p>
            There are currently no active SLA records
            for your department applications.
          </p>
        </div>
      ) : (
        <div className="project-table-wrapper">
          <table className="project-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Project</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {slaRecords.map((sla) => (
                <tr key={sla.id}>
                  <td>
                    {sla.application_number || "-"}
                  </td>

                  <td>
                    {sla.project_name || "-"}
                  </td>

                  <td>
                    {sla.start_date
                      ? new Date(
                          sla.start_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {sla.due_date
                      ? new Date(
                          sla.due_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {sla.status || "-"}
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

export default SLAMonitoring;