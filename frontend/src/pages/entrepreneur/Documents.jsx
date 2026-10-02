import { useEffect, useState } from "react";
import axios from "axios";

const Documents = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [documents, setDocuments] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [precheckResults, setPrecheckResults] = useState({});

  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  `${import.meta.env.VITE_API_URL}/api/projects`,
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

  const fetchDocuments = async (projectId) => {
    try {
      setLoadingDocuments(true);
      setError("");
      setSuccess("");

      const response = await axios.get(
  `\({import.meta.env.VITE_API_URL}/api/documents/\){projectId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setProjectName(
        response.data.project?.project_name || ""
      );

      const fetchedDocuments = response.data.documents || [];

setDocuments(fetchedDocuments);

for (const document of fetchedDocuments) {
  try {
    await fetchPrecheckResult(document.id);
  } catch (error) {
    console.error(
      `PRECHECK LOAD ERROR FOR DOCUMENT ${document.id}:`,
      error
    );
  }
}

      

      setSuccess(
        response.data.message ||
          "Project documents retrieved successfully."
      );
    } catch (error) {
      console.error("FETCH DOCUMENTS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to retrieve project documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

    const fetchPrecheckResult = async (documentId) => {
    try {
     const response = await axios.get(
  `\({import.meta.env.VITE_API_URL}/api/document-prechecks/\){documentId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setPrecheckResults((previous) => ({
        ...previous,
        [documentId]: response.data.precheck,
      }));
    } catch (error) {
      console.error(
        `FETCH PRECHECK ERROR FOR DOCUMENT ${documentId}:`,
        error
      );
    }
  };

  const handleProjectChange = (event) => {
    const projectId = event.target.value;

    setSelectedProjectId(projectId);
    setDocuments([]);
    setProjectName("");
    setSuccess("");
    setError("");

    if (projectId) {
      fetchDocuments(projectId);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      setError("Please select an industrial project.");
      return;
    }

    if (!documentType || !documentName) {
      setError("Document type and document name are required.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a document file.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("documentType", documentType);
      formData.append("documentName", documentName);
      formData.append("expiryDate", expiryDate);
      formData.append("document", selectedFile);

      const response = await axios.post(
  `\({import.meta.env.VITE_API_URL}/api/documents/\){selectedProjectId}/upload`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setSuccess(
        response.data.message ||
          "Project document uploaded successfully."
      );

      setDocumentType("");
      setDocumentName("");
      setExpiryDate("");
      setSelectedFile(null);

      const fileInput =
        document.getElementById("document-file");

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchDocuments(selectedProjectId);
    } catch (error) {
      console.error("UPLOAD DOCUMENT ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to upload project document."
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePrecheck = async (documentId) => {
  try {
    setError("");
    setSuccess("");

    const response = await axios.post(
  `\({import.meta.env.VITE_API_URL}/api/document-prechecks/\){documentId}`,
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    await fetchDocuments(selectedProjectId);

    setSuccess(
      `Pre-check completed: ${response.data.precheck.overall_status}`
    );
  } catch (error) {
    console.error("PRECHECK ERROR:", error);

    setError(
      error.response?.data?.message ||
        "Failed to complete document pre-check."
    );
  }
};

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) {
      return "0 KB";
    }

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Document Vault</h1>
          <p>
            Upload and manage documents required for your
            industrial approval process.
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
              Choose the project whose documents you want to
              manage.
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
                onChange={handleProjectChange}
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
      </div>

      {selectedProjectId && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <div>
                <h2>Upload Document</h2>
                <p>
                  Upload a document for{" "}
                  <strong>{projectName}</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label>Document Type</label>

                  <input
                    type="text"
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(e.target.value)
                    }
                    placeholder="Example: PROJECT_REPORT"
                  />
                </div>

                <div className="project-field">
                  <label>Document Name</label>

                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) =>
                      setDocumentName(e.target.value)
                    }
                    placeholder="Example: Project Report"
                  />
                </div>

                <div className="project-field">
                  <label>Expiry Date (Optional)</label>

                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) =>
                      setExpiryDate(e.target.value)
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Select File</label>

                  <input
                    id="document-file"
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </div>
              </div>

              <div className="project-form-actions">
                <button
                  type="submit"
                  className="project-primary-button"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </div>

          <div className="project-list-card">
            <div className="project-section-header">
              <div>
                <h2>Uploaded Documents</h2>
                <p>
                  Active documents stored for this project.
                </p>
              </div>

              <span className="project-count">
                {documents.length} document
                {documents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingDocuments ? (
              <div className="project-empty-state">
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="project-empty-state">
                <h3>No documents uploaded</h3>
                <p>
                  Upload the required project documents using
                  the form above.
                </p>
              </div>
            ) : (
              <div className="project-table-wrapper">
                <table className="project-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Size</th>
                      <th>Expiry</th>
                      <th>Pre-check</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <strong>
                            {document.document_name}
                          </strong>

                          <div>
                            <small>
                              {document.file_name}
                            </small>
                          </div>
                        </td>

                        <td>
                          {document.document_type}
                        </td>

                        <td>
                          v{document.version}
                        </td>

                        <td>
                          <span className="project-status">
                            {document.verification_status}
                          </span>
                        </td>

                        <td>
                          {formatFileSize(
                            document.file_size
                          )}
                        </td>

                        <td>
  {formatDate(document.expiry_date)}
</td>

<td>
  {precheckResults[document.id] ? (
    <div>
      <strong>
        {precheckResults[document.id].overall_status}
      </strong>

      <br />

      <button
        type="button"
        className="project-secondary-button"
        onClick={() => handlePrecheck(document.id)}
      >
        Run Again
      </button>
    </div>
  ) : (
    <button
      type="button"
      className="project-secondary-button"
      onClick={() => handlePrecheck(document.id)}
    >
      Run Pre-check
    </button>
  )}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Documents;