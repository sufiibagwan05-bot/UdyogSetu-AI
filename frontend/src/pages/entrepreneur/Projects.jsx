import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const sectors = [
  { id: 1, name: "Food Processing" },
  { id: 2, name: "Textile Manufacturing" },
  { id: 3, name: "Automobile Manufacturing" },
  { id: 4, name: "Pharmaceutical Manufacturing" },
  { id: 5, name: "IT & Software" },
  { id: 6, name: "Chemical Manufacturing" },
];

const states = [
  { id: 1, name: "Maharashtra" },
  { id: 2, name: "Gujarat" },
  { id: 3, name: "Karnataka" },
  { id: 4, name: "Madhya Pradesh" },
  { id: 5, name: "Tamil Nadu" },
];

const districts = [
  { id: 1, stateId: 1, name: "Kolhapur" },
  { id: 2, stateId: 1, name: "Nagpur" },
  { id: 3, stateId: 1, name: "Nashik" },
  { id: 4, stateId: 1, name: "Mumbai" },
  { id: 5, stateId: 1, name: "Pune" },

  { id: 6, stateId: 2, name: "Vadodara" },
  { id: 7, stateId: 2, name: "Surat" },
  { id: 8, stateId: 2, name: "Ahmedabad" },

  { id: 9, stateId: 3, name: "Belagavi" },
  { id: 10, stateId: 3, name: "Mysuru" },
  { id: 11, stateId: 3, name: "Bengaluru Urban" },

  { id: 12, stateId: 4, name: "Jabalpur" },
  { id: 13, stateId: 4, name: "Bhopal" },
  { id: 14, stateId: 4, name: "Indore" },

  { id: 15, stateId: 5, name: "Madurai" },
  { id: 16, stateId: 5, name: "Coimbatore" },
  { id: 17, stateId: 5, name: "Chennai" },
];

const initialForm = {
  projectName: "",
  sectorId: "",
  stateId: "",
  districtId: "",
  location: "",
  investmentAmount: "",
  projectSize: "",
  landStatus: "",
  businessType: "",
  productionActivity: "",
  employeesCount: "",
  projectStage: "",
  environmentalRequirement: false,
  waterRequirement: false,
  electricityRequirement: false,
};

function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingProjectId, setEditingProjectId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("udyogsetu_token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/projects`,
        authConfig
      );

      setProjects(response.data.projects || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load industrial projects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    if (name === "stateId") {
      setForm((previous) => ({
        ...previous,
        stateId: value,
        districtId: "",
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingProjectId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        sectorId: Number(form.sectorId),
        stateId: Number(form.stateId),
        districtId: Number(form.districtId),
        investmentAmount:
          form.investmentAmount || null,
        employeesCount:
          form.employeesCount || null,
      };

      let response;

      if (editingProjectId) {
        response = await axios.put(
          `${API_BASE_URL}/projects/${editingProjectId}`,
          payload,
          authConfig
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/projects`,
          payload,
          authConfig
        );
      }

      setSuccess(
        response.data.message ||
          "Project saved successfully."
      );

      resetForm();
      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save industrial project."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    const sector = sectors.find(
      (item) => item.name === project.sector
    );

    const state = states.find(
      (item) => item.name === project.state
    );

    const district = districts.find(
      (item) =>
        item.name === project.district &&
        item.stateId === state?.id
    );

    setEditingProjectId(project.id);

    setForm({
      projectName: project.project_name || "",
      sectorId: sector?.id || "",
      stateId: state?.id || "",
      districtId: district?.id || "",
      location: project.location || "",
      investmentAmount:
        project.investment_amount || "",
      projectSize: project.project_size || "",
      landStatus: project.land_status || "",
      businessType: project.business_type || "",
      productionActivity:
        project.production_activity || "",
      employeesCount:
        project.employee_count || "",
      projectStage:
        project.project_stage || "",
      environmentalRequirement:
        project.environment_required || false,
      waterRequirement:
        project.water_required || false,
      electricityRequirement:
        project.electricity_required || false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (project) => {
    if (project.status !== "DRAFT") {
      alert("Only draft projects can be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete project "${project.project_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.delete(
        `${API_BASE_URL}/projects/${project.id}`,
        authConfig
      );

      setSuccess(
        response.data.message ||
          "Project deleted successfully."
      );

      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete project."
      );
    }
  };

  const filteredDistricts = districts.filter(
    (district) =>
      district.stateId === Number(form.stateId)
  );

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h2>Industrial Projects</h2>
          <p>
            Create and manage your industrial projects
            for approval and compliance processing.
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
            <h3>
              {editingProjectId
                ? "Edit Industrial Project"
                : "Create Industrial Project"}
            </h3>

            <p>
              Enter the project details required for
              regulatory assessment.
            </p>
          </div>

          {editingProjectId && (
            <button
              type="button"
              className="project-secondary-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >
          <div className="project-form-grid">
            <div className="project-field">
              <label>Project Name *</label>
              <input
                name="projectName"
                value={form.projectName}
                onChange={handleChange}
                placeholder="e.g. Pune Food Processing Unit"
                required
              />
            </div>

            <div className="project-field">
              <label>Sector *</label>

              <select
                name="sectorId"
                value={form.sectorId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select sector
                </option>

                {sectors.map((sector) => (
                  <option
                    key={sector.id}
                    value={sector.id}
                  >
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="project-field">
              <label>State *</label>

              <select
                name="stateId"
                value={form.stateId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select state
                </option>

                {states.map((state) => (
                  <option
                    key={state.id}
                    value={state.id}
                  >
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="project-field">
              <label>District *</label>

              <select
                name="districtId"
                value={form.districtId}
                onChange={handleChange}
                disabled={!form.stateId}
                required
              >
                <option value="">
                  Select district
                </option>

                {filteredDistricts.map(
                  (district) => (
                    <option
                      key={district.id}
                      value={district.id}
                    >
                      {district.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="project-field">
              <label>Location *</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Industrial area / location"
                required
              />
            </div>

            <div className="project-field">
              <label>Business Type *</label>
              <input
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                placeholder="e.g. Manufacturing"
                required
              />
            </div>

            <div className="project-field">
              <label>Investment Amount</label>
              <input
                type="number"
                name="investmentAmount"
                value={form.investmentAmount}
                onChange={handleChange}
                placeholder="Investment amount"
                min="0"
              />
            </div>

            <div className="project-field">
              <label>Project Size</label>
              <input
                name="projectSize"
                value={form.projectSize}
                onChange={handleChange}
                placeholder="e.g. 5 acres / 20,000 sq.ft"
              />
            </div>

            <div className="project-field">
              <label>Land Status</label>

              <select
                name="landStatus"
                value={form.landStatus}
                onChange={handleChange}
              >
                <option value="">
                  Select land status
                </option>
                <option value="OWNED">
                  Owned
                </option>
                <option value="LEASED">
                  Leased
                </option>
                <option value="PURCHASE_PENDING">
                  Purchase Pending
                </option>
              </select>
            </div>

            <div className="project-field">
              <label>Production Activity</label>
              <input
                name="productionActivity"
                value={form.productionActivity}
                onChange={handleChange}
                placeholder="Describe production activity"
              />
            </div>

            <div className="project-field">
              <label>Employee Count</label>
              <input
                type="number"
                name="employeesCount"
                value={form.employeesCount}
                onChange={handleChange}
                min="0"
                placeholder="Number of employees"
              />
            </div>

            <div className="project-field">
              <label>Project Stage</label>

              <select
                name="projectStage"
                value={form.projectStage}
                onChange={handleChange}
              >
                <option value="">
                  Select project stage
                </option>
                <option value="PLANNING">
                  Planning
                </option>
                <option value="LAND_ACQUISITION">
                  Land Acquisition
                </option>
                <option value="CONSTRUCTION">
                  Construction
                </option>
                <option value="PRODUCTION">
                  Production
                </option>
              </select>
            </div>
          </div>

          <div className="project-requirements">
            <h4>Project Requirements</h4>

            <label className="project-checkbox">
              <input
                type="checkbox"
                name="environmentalRequirement"
                checked={
                  form.environmentalRequirement
                }
                onChange={handleChange}
              />
              <span>
                Environmental requirement
              </span>
            </label>

            <label className="project-checkbox">
              <input
                type="checkbox"
                name="waterRequirement"
                checked={form.waterRequirement}
                onChange={handleChange}
              />
              <span>Water requirement</span>
            </label>

            <label className="project-checkbox">
              <input
                type="checkbox"
                name="electricityRequirement"
                checked={
                  form.electricityRequirement
                }
                onChange={handleChange}
              />
              <span>Electricity requirement</span>
            </label>
          </div>

          <div className="project-form-actions">
            <button
              type="submit"
              className="project-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingProjectId
                ? "Update Project"
                : "Create Project"}
            </button>

            <button
              type="button"
              className="project-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="project-list-card">
        <div className="project-section-header">
          <div>
            <h3>My Industrial Projects</h3>
            <p>
              Projects created under your account.
            </p>
          </div>

          <span className="project-count">
            {projects.length} project
            {projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="project-empty-state">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="project-empty-state">
            No industrial projects found. Create your
            first project above.
          </div>
        ) : (
          <div className="project-table-wrapper">
            <table className="project-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Sector</th>
                  <th>Location</th>
                  <th>Business Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>
                        {project.project_name}
                      </strong>
                    </td>

                    <td>{project.sector}</td>

                    <td>
                      {project.district},{" "}
                      {project.state}
                    </td>

                    <td>
                      {project.business_type}
                    </td>

                    <td>
                      <span
                        className={`project-status project-status-${String(
                          project.status || "DRAFT"
                        ).toLowerCase()}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td>
                      <div className="project-actions">
  <button
    type="button"
    onClick={() =>
      handleEdit(project)
    }
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() =>
      handleDelete(project)
    }
  >
    Delete
  </button>

  <button
    type="button"
    onClick={() => {
      window.location.href =
        `/projects/${project.id}/schemes`;
    }}
  >
    Government Schemes
  </button>
</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Projects;