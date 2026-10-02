import React, { useEffect, useState } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/admin`;;

const RegulatoryManagement = () => {
  const token = localStorage.getItem("udyogsetu_token");

  const [activeTab, setActiveTab] = useState("departments");

  const [departments, setDepartments] = useState([]);
  const [approvalTypes, setApprovalTypes] = useState([]);
  const [rules, setRules] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
    contactEmail: "",
  });

  const [approvalForm, setApprovalForm] = useState({
    departmentId: "",
    name: "",
    code: "",
    description: "",
    category: "",
    defaultValidityDays: "",
    isRenewable: false,
  });

  const [ruleForm, setRuleForm] = useState({
    approvalTypeId: "",
    stateId: "",
    districtId: "",
    sectorId: "",
    ruleName: "",
    description: "",
    conditions: '{"state":"MH"}',
    priority: 100,
    sourceReference: "",
  });

  const [documentForm, setDocumentForm] = useState({
    approvalTypeId: "",
    documentName: "",
    documentCode: "",
    description: "",
    isMandatory: true,
    allowedFileTypes: "pdf,jpg,png",
    maxFileSizeMb: "",
    validityRequired: false,
  });

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        departmentResponse,
        approvalResponse,
        ruleResponse,
        documentResponse,
      ] = await Promise.all([
        axios.get(`${API}/departments`, { headers }),
        axios.get(`${API}/approval-types`, { headers }),
        axios.get(`${API}/regulatory-rules`, { headers }),
        axios.get(`${API}/required-documents`, { headers }),
      ]);

      setDepartments(departmentResponse.data.departments || []);
      setApprovalTypes(approvalResponse.data.approvalTypes || []);
      setRules(ruleResponse.data.regulatoryRules || []);
      setDocuments(documentResponse.data.requiredDocuments || []);
    } catch (err) {
      console.error("ADMIN DATA ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load regulatory management data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForms = () => {
    setEditing(null);

    setDepartmentForm({
      name: "",
      code: "",
      description: "",
      contactEmail: "",
    });

    setApprovalForm({
      departmentId: "",
      name: "",
      code: "",
      description: "",
      category: "",
      defaultValidityDays: "",
      isRenewable: false,
    });

    setRuleForm({
      approvalTypeId: "",
      stateId: "",
      districtId: "",
      sectorId: "",
      ruleName: "",
      description: "",
      conditions: '{"state":"MH"}',
      priority: 100,
      sourceReference: "",
    });

    setDocumentForm({
      approvalTypeId: "",
      documentName: "",
      documentCode: "",
      description: "",
      isMandatory: true,
      allowedFileTypes: "pdf,jpg,png",
      maxFileSizeMb: "",
      validityRequired: false,
    });
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const payload = {
        ...departmentForm,
        isActive: editing?.is_active ?? true,
      };

      if (editing) {
        await axios.put(
          `${API}/departments/${editing.id}`,
          payload,
          { headers }
        );
        setMessage("Department updated successfully.");
      } else {
        await axios.post(`${API}/departments`, payload, { headers });
        setMessage("Department created successfully.");
      }

      resetForms();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Department operation failed.");
    }
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const payload = {
        departmentId: Number(approvalForm.departmentId),
        name: approvalForm.name,
        code: approvalForm.code,
        description: approvalForm.description,
        category: approvalForm.category,
        defaultValidityDays:
          approvalForm.defaultValidityDays === ""
            ? null
            : Number(approvalForm.defaultValidityDays),
        isRenewable: approvalForm.isRenewable,
        isActive: editing?.is_active ?? true,
      };

      if (editing) {
        await axios.put(
          `${API}/approval-types/${editing.id}`,
          payload,
          { headers }
        );
        setMessage("Approval type updated successfully.");
      } else {
        await axios.post(`${API}/approval-types`, payload, { headers });
        setMessage("Approval type created successfully.");
      }

      resetForms();
      await fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.message || "Approval type operation failed."
      );
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      let parsedConditions;

      try {
        parsedConditions = JSON.parse(ruleForm.conditions);
      } catch {
        setError("Conditions must contain valid JSON.");
        return;
      }

      const payload = {
        approvalTypeId: Number(ruleForm.approvalTypeId),
        stateId: ruleForm.stateId ? Number(ruleForm.stateId) : null,
        districtId: ruleForm.districtId
          ? Number(ruleForm.districtId)
          : null,
        sectorId: ruleForm.sectorId
          ? Number(ruleForm.sectorId)
          : null,
        ruleName: ruleForm.ruleName,
        description: ruleForm.description,
        conditions: parsedConditions,
        priority: Number(ruleForm.priority),
        sourceReference: ruleForm.sourceReference,
        isActive: editing?.is_active ?? true,
      };

      if (editing) {
        await axios.put(
          `${API}/regulatory-rules/${editing.id}`,
          payload,
          { headers }
        );
        setMessage("Regulatory rule updated successfully.");
      } else {
        await axios.post(`${API}/regulatory-rules`, payload, { headers });
        setMessage("Regulatory rule created successfully.");
      }

      resetForms();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Regulatory rule operation failed.");
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const allowedFileTypes = documentForm.allowedFileTypes
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        approvalTypeId: Number(documentForm.approvalTypeId),
        documentName: documentForm.documentName,
        documentCode: documentForm.documentCode,
        description: documentForm.description,
        isMandatory: documentForm.isMandatory,
        allowedFileTypes,
        maxFileSizeMb:
          documentForm.maxFileSizeMb === ""
            ? null
            : Number(documentForm.maxFileSizeMb),
        validityRequired: documentForm.validityRequired,
        isActive: editing?.is_active ?? true,
      };

      if (editing) {
        await axios.put(
          `${API}/required-documents/${editing.id}`,
          payload,
          { headers }
        );
        setMessage("Required document updated successfully.");
      } else {
        await axios.post(`${API}/required-documents`, payload, { headers });
        setMessage("Required document created successfully.");
      }

      resetForms();
      await fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Required document operation failed."
      );
    }
  };

  const editDepartment = (item) => {
    setEditing(item);
    setDepartmentForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      contactEmail: item.contact_email || "",
    });
  };

  const editApproval = (item) => {
    setEditing(item);
    setApprovalForm({
      departmentId: String(item.department_id),
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      category: item.category || "",
      defaultValidityDays: item.default_validity_days || "",
      isRenewable: item.is_renewable || false,
    });
  };

  const editRule = (item) => {
    setEditing(item);
    setRuleForm({
      approvalTypeId: String(item.approval_type_id),
      stateId: item.state_id ? String(item.state_id) : "",
      districtId: item.district_id ? String(item.district_id) : "",
      sectorId: item.sector_id ? String(item.sector_id) : "",
      ruleName: item.rule_name || "",
      description: item.description || "",
      conditions: JSON.stringify(item.conditions || {}, null, 2),
      priority: item.priority || 100,
      sourceReference: item.source_reference || "",
    });
  };

  const editDocument = (item) => {
    setEditing(item);
    setDocumentForm({
      approvalTypeId: String(item.approval_type_id),
      documentName: item.document_name || "",
      documentCode: item.document_code || "",
      description: item.description || "",
      isMandatory: item.is_mandatory ?? true,
      allowedFileTypes: Array.isArray(item.allowed_file_types)
        ? item.allowed_file_types.join(",")
        : "",
      maxFileSizeMb: item.max_file_size_mb || "",
      validityRequired: item.validity_required || false,
    });
  };

  if (loading) {
    return (
      <div className="project-page">
        <div className="project-message">Loading regulatory management...</div>
      </div>
    );
  }

  return (
    <div className="project-page">
      <div className="project-page-header">
        <div>
          <h1>Regulatory Management</h1>
          <p>
            Manage the regulatory configuration used by the Rules Engine.
          </p>
        </div>
      </div>

      {message && <div className="project-success">{message}</div>}
      {error && <div className="project-error">{error}</div>}

      <div className="project-actions">
        <button
          type="button"
          className={
            activeTab === "departments"
              ? "project-primary-button"
              : "project-secondary-button"
          }
          onClick={() => {
            setActiveTab("departments");
            resetForms();
          }}
        >
          Departments
        </button>

        <button
          type="button"
          className={
            activeTab === "approvals"
              ? "project-primary-button"
              : "project-secondary-button"
          }
          onClick={() => {
            setActiveTab("approvals");
            resetForms();
          }}
        >
          Approval Types
        </button>

        <button
          type="button"
          className={
            activeTab === "rules"
              ? "project-primary-button"
              : "project-secondary-button"
          }
          onClick={() => {
            setActiveTab("rules");
            resetForms();
          }}
        >
          Regulatory Rules
        </button>

        <button
          type="button"
          className={
            activeTab === "documents"
              ? "project-primary-button"
              : "project-secondary-button"
          }
          onClick={() => {
            setActiveTab("documents");
            resetForms();
          }}
        >
          Required Documents
        </button>
      </div>

      {activeTab === "departments" && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <h2>
                {editing ? "Edit Department" : "Add Department"}
              </h2>

              {editing && (
                <button
                  type="button"
                  className="project-secondary-button"
                  onClick={resetForms}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleDepartmentSubmit}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label>Department Name</label>
                  <input
                    value={departmentForm.name}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Code</label>
                  <input
                    value={departmentForm.code}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        code: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={departmentForm.contactEmail}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        contactEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Description</label>
                  <input
                    value={departmentForm.description}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="project-form-actions">
                <button className="project-primary-button" type="submit">
                  {editing ? "Update Department" : "Add Department"}
                </button>
              </div>
            </form>
          </div>

          <div className="project-list-card">
            <div className="project-section-header">
              <h2>Departments</h2>
              <span className="project-count">
                {departments.length}
              </span>
            </div>

            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.code}</td>
                      <td>{item.contact_email || "-"}</td>
                      <td>{item.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          type="button"
                          className="project-secondary-button"
                          onClick={() => editDepartment(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "approvals" && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <h2>
                {editing ? "Edit Approval Type" : "Add Approval Type"}
              </h2>

              {editing && (
                <button
                  type="button"
                  className="project-secondary-button"
                  onClick={resetForms}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleApprovalSubmit}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label>Department</label>
                  <select
                    value={approvalForm.departmentId}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        departmentId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter((d) => d.is_active)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="project-field">
                  <label>Name</label>
                  <input
                    value={approvalForm.name}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Code</label>
                  <input
                    value={approvalForm.code}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        code: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Category</label>
                  <input
                    value={approvalForm.category}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        category: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Validity Days</label>
                  <input
                    type="number"
                    value={approvalForm.defaultValidityDays}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        defaultValidityDays: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Description</label>
                  <input
                    value={approvalForm.description}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <label className="project-checkbox">
                <input
                  type="checkbox"
                  checked={approvalForm.isRenewable}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      isRenewable: e.target.checked,
                    })
                  }
                />
                Renewable
              </label>

              <div className="project-form-actions">
                <button className="project-primary-button" type="submit">
                  {editing ? "Update Approval Type" : "Add Approval Type"}
                </button>
              </div>
            </form>
          </div>

          <div className="project-list-card">
            <div className="project-section-header">
              <h2>Approval Types</h2>
              <span className="project-count">
                {approvalTypes.length}
              </span>
            </div>

            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Renewable</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {approvalTypes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.department_name}</td>
                      <td>{item.code}</td>
                      <td>{item.is_renewable ? "Yes" : "No"}</td>
                      <td>{item.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          type="button"
                          className="project-secondary-button"
                          onClick={() => editApproval(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "rules" && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <h2>
                {editing ? "Edit Regulatory Rule" : "Add Regulatory Rule"}
              </h2>

              {editing && (
                <button
                  type="button"
                  className="project-secondary-button"
                  onClick={resetForms}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleRuleSubmit}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label>Approval Type</label>
                  <select
                    value={ruleForm.approvalTypeId}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        approvalTypeId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Approval</option>
                    {approvalTypes
                      .filter((a) => a.is_active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="project-field">
                  <label>Rule Name</label>
                  <input
                    value={ruleForm.ruleName}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        ruleName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>State ID</label>
                  <input
                    type="number"
                    value={ruleForm.stateId}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        stateId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>District ID</label>
                  <input
                    type="number"
                    value={ruleForm.districtId}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        districtId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Sector ID</label>
                  <input
                    type="number"
                    value={ruleForm.sectorId}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        sectorId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Priority</label>
                  <input
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        priority: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Source Reference</label>
                  <input
                    value={ruleForm.sourceReference}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        sourceReference: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Description</label>
                  <input
                    value={ruleForm.description}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="project-field">
                <label>Conditions JSON</label>
                <textarea
                  rows="5"
                  value={ruleForm.conditions}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      conditions: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="project-form-actions">
                <button className="project-primary-button" type="submit">
                  {editing ? "Update Rule" : "Add Rule"}
                </button>
              </div>
            </form>
          </div>

          <div className="project-list-card">
            <div className="project-section-header">
              <h2>Regulatory Rules</h2>
              <span className="project-count">{rules.length}</span>
            </div>

            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Rule</th>
                    <th>Approval</th>
                    <th>Sector</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.rule_name}</td>
                      <td>{item.approval_type_name}</td>
                      <td>{item.sector_name || "-"}</td>
                      <td>{item.priority}</td>
                      <td>{item.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          type="button"
                          className="project-secondary-button"
                          onClick={() => editRule(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "documents" && (
        <>
          <div className="project-form-card">
            <div className="project-section-header">
              <h2>
                {editing
                  ? "Edit Required Document"
                  : "Add Required Document"}
              </h2>

              {editing && (
                <button
                  type="button"
                  className="project-secondary-button"
                  onClick={resetForms}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleDocumentSubmit}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label>Approval Type</label>
                  <select
                    value={documentForm.approvalTypeId}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        approvalTypeId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Approval</option>
                    {approvalTypes
                      .filter((a) => a.is_active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="project-field">
                  <label>Document Name</label>
                  <input
                    value={documentForm.documentName}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Document Code</label>
                  <input
                    value={documentForm.documentCode}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentCode: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Allowed File Types</label>
                  <input
                    value={documentForm.allowedFileTypes}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        allowedFileTypes: e.target.value,
                      })
                    }
                    placeholder="pdf,jpg,png"
                    required
                  />
                </div>

                <div className="project-field">
                  <label>Max File Size (MB)</label>
                  <input
                    type="number"
                    value={documentForm.maxFileSizeMb}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        maxFileSizeMb: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="project-field">
                  <label>Description</label>
                  <input
                    value={documentForm.description}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="project-actions">
                <label className="project-checkbox">
                  <input
                    type="checkbox"
                    checked={documentForm.isMandatory}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        isMandatory: e.target.checked,
                      })
                    }
                  />
                  Mandatory
                </label>

                <label className="project-checkbox">
                  <input
                    type="checkbox"
                    checked={documentForm.validityRequired}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        validityRequired: e.target.checked,
                      })
                    }
                  />
                  Validity Required
                </label>
              </div>

              <div className="project-form-actions">
                <button className="project-primary-button" type="submit">
                  {editing ? "Update Document" : "Add Document"}
                </button>
              </div>
            </form>
          </div>

          <div className="project-list-card">
            <div className="project-section-header">
              <h2>Required Documents</h2>
              <span className="project-count">
                {documents.length}
              </span>
            </div>

            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Document</th>
                    <th>Approval</th>
                    <th>Code</th>
                    <th>Mandatory</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.document_name}</td>
                      <td>{item.approval_type_name}</td>
                      <td>{item.document_code}</td>
                      <td>{item.is_mandatory ? "Yes" : "No"}</td>
                      <td>{item.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          type="button"
                          className="project-secondary-button"
                          onClick={() => editDocument(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegulatoryManagement;