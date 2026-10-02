import { useEffect, useState } from "react";
import axios from "axios";

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("udyogsetu_token");

  useEffect(() => {
    const loadInspections = async () => {
      try {
        const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/inspections`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

        setInspections(response.data.inspections || []);
      } catch (error) {
        console.error("Failed to load inspections:", error);
        setInspections([]);
      } finally {
        setLoading(false);
      }
    };

    loadInspections();
  }, [token]);

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Officer Inspections</h1>
          <p>
            Review and manage inspections associated with
            industrial applications.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading inspections...</p>
      ) : inspections.length === 0 ? (
        <div className="project-empty-state">
          <h3>No inspections scheduled</h3>
          <p>
            There are currently no inspections assigned to
            your department.
          </p>
        </div>
      ) : (
        <div className="project-table-wrapper">
          <table className="project-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Project</th>
                <th>Inspection Type</th>
                <th>Status</th>
                <th>Scheduled Date</th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>
                    {inspection.application_number || "-"}
                  </td>

                  <td>
                    {inspection.project_name || "-"}
                  </td>

                  <td>
                    {inspection.inspection_type || "-"}
                  </td>

                  <td>
                    {inspection.status || "-"}
                  </td>

                  <td>
                    {inspection.scheduled_at
                      ? new Date(
                          inspection.scheduled_at
                        ).toLocaleString()
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

export default Inspections;