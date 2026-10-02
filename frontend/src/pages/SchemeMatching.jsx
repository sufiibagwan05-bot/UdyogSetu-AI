import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMatchedSchemes } from "../services/schemeService";

const SchemeMatching = () => {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const token = localStorage.getItem("udyogsetu_token");

        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        const data = await getMatchedSchemes(
          projectId,
          token
        );

        setProject(data.project);
        setSchemes(data.schemes || []);
      } catch (err) {
        console.error(
          "Scheme matching error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load matched schemes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [projectId]);

  if (loading) {
    return <p>Loading matched schemes...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Government Scheme Matching</h1>

      {project && (
        <div>
          <h2>{project.projectName}</h2>

          <p>
            <strong>State:</strong>{" "}
            {project.state}
          </p>

          <p>
            <strong>Sector:</strong>{" "}
            {project.sector}
          </p>

          <p>
            <strong>Business Type:</strong>{" "}
            {project.businessType}
          </p>

          <p>
            <strong>Investment:</strong>{" "}
            ₹
            {Number(
              project.investmentAmount
            ).toLocaleString("en-IN")}
          </p>

          <p>
            <strong>Employees:</strong>{" "}
            {project.employeeCount ?? "Not specified"}
          </p>
        </div>
      )}

      <hr />

      <h2>
        Matched Schemes ({schemes.length})
      </h2>

      {schemes.length === 0 ? (
        <p>
          No matching government schemes found.
        </p>
      ) : (
        schemes.map((scheme) => (
          <div
            key={scheme.id}
            style={{
              border: "1px solid #ccc",
              padding: "16px",
              marginBottom: "16px",
              borderRadius: "8px",
            }}
          >
            <h3>{scheme.name}</h3>

            <p>{scheme.description}</p>

            <p>
              <strong>Why this matches:</strong>
            </p>

            <ul>
              {scheme.reasons.map(
                (reason, index) => (
                  <li key={index}>
                    {reason}
                  </li>
                )
              )}
            </ul>

            {scheme.sourceReference && (
              <p>
                <strong>
                  Reference:
                </strong>{" "}
                {scheme.sourceReference}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SchemeMatching;