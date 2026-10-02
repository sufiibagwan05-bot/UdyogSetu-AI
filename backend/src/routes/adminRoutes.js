const express = require("express");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { createAuditLog } = require("../services/auditLogService");

const router = express.Router();

// Get audit logs
router.get(
  "/audit-logs",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          a.id,
          a.user_id,
          u.email AS user_email,
          a.action,
          a.entity_type,
          a.entity_id,
          a.old_value,
          a.new_value,
          a.ip_address,
          a.created_at
        FROM audit_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        ORDER BY a.created_at DESC;
      `);

      return res.status(200).json({
        success: true,
        auditLogs: result.rows,
      });
    } catch (error) {
      console.error("Get audit logs error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
      });
    }
  }
);

// Get all departments
router.get(
  "/departments",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          id,
          name,
          code,
          description,
          contact_email,
          is_active,
          created_at
        FROM departments
        ORDER BY id;
      `);

      return res.status(200).json({
        success: true,
        departments: result.rows,
      });
    } catch (error) {
      console.error("Get departments error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch departments",
      });
    }
  }
);

// Add a new department
router.post(
  "/departments",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const {
        name,
        code,
        description,
        contactEmail,
      } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO departments
        (
          name,
          code,
          description,
          contact_email
        )
        VALUES
        ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          code,
          description,
          contact_email,
          is_active,
          created_at;
        `,
        [
          name.trim(),
          code.trim().toUpperCase(),
          description || null,
          contactEmail || null,
        ]
      );

      await createAuditLog({
  userId: req.user.id,
  action: "CREATE_DEPARTMENT",
  entityType: "DEPARTMENT",
  entityId: result.rows[0].id,
  oldValue: null,
  newValue: result.rows[0],
});

      return res.status(201).json({
        success: true,
        message: "Department created successfully",
        department: result.rows[0],
      });
    } catch (error) {
      console.error("Create department error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create department",
      });
    }
  }
);

// Update a department
router.put(
  "/departments/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const { id } = req.params;
      const {
        name,
        code,
        description,
        contactEmail,
        isActive,
      } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
      }

      const oldDepartmentResult = await pool.query(
  `
  SELECT
    id,
    name,
    code,
    description,
    contact_email,
    is_active,
    created_at
  FROM departments
  WHERE id = $1;
  `,
  [id]
);

if (oldDepartmentResult.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Department not found",
  });
}

const oldDepartment = oldDepartmentResult.rows[0];

      const result = await pool.query(
        `
        UPDATE departments
        SET
          name = $1,
          code = $2,
          description = $3,
          contact_email = $4,
          is_active = $5
        WHERE id = $6
        RETURNING
          id,
          name,
          code,
          description,
          contact_email,
          is_active,
          created_at;
        `,
        [
          name.trim(),
          code.trim().toUpperCase(),
          description || null,
          contactEmail || null,
          isActive !== undefined ? isActive : true,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      await createAuditLog({
  userId: req.user.id,
  action: "UPDATE_DEPARTMENT",
  entityType: "DEPARTMENT",
  entityId: result.rows[0].id,
  oldValue: oldDepartment,
  newValue: result.rows[0],
});

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        department: result.rows[0],
      });
    } catch (error) {
      console.error("Update department error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update department",
      });
    }
  }
);

// Get all approval types
router.get(
  "/approval-types",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          at.id,
          at.department_id,
          d.name AS department_name,
          d.code AS department_code,
          at.name,
          at.code,
          at.description,
          at.category,
          at.default_validity_days,
          at.is_renewable,
          at.is_active,
          at.created_at
        FROM approval_types at
        JOIN departments d
          ON d.id = at.department_id
        ORDER BY at.id;
      `);

      return res.status(200).json({
        success: true,
        approvalTypes: result.rows,
      });
    } catch (error) {
      console.error("Get approval types error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch approval types",
      });
    }
  }
);

// Add a new approval type
router.post(
  "/approval-types",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const {
        departmentId,
        name,
        code,
        description,
        category,
        defaultValidityDays,
        isRenewable,
      } = req.body;

      if (!departmentId || !name || !code) {
        return res.status(400).json({
          success: false,
          message: "Department ID, name and code are required",
        });
      }

      const departmentResult = await pool.query(
        `
        SELECT id
        FROM departments
        WHERE id = $1
          AND is_active = true
        `,
        [departmentId]
      );

      if (departmentResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active department not found",
        });
      }

      const result = await pool.query(
        
        `
        INSERT INTO approval_types
        (
          department_id,
          name,
          code,
          description,
          category,
          default_validity_days,
          is_renewable
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          department_id,
          name,
          code,
          description,
          category,
          default_validity_days,
          is_renewable,
          is_active,
          created_at;
        `,
        [
          departmentId,
          name.trim(),
          code.trim().toUpperCase(),
          description || null,
          category || null,
          defaultValidityDays || null,
          isRenewable || false,
        ]
      );

      await createAuditLog({
  userId: req.user.id,
  action: "CREATE_APPROVAL_TYPE",
  entityType: "APPROVAL_TYPE",
  entityId: result.rows[0].id,
  oldValue: null,
  newValue: result.rows[0],
});

      return res.status(201).json({
        success: true,
        message: "Approval type created successfully",
        approvalType: result.rows[0],
      });
    } catch (error) {
      console.error("Create approval type error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create approval type",
      });
    }
  }
);

// Update an approval type
router.put(
  "/approval-types/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const { id } = req.params;

      const oldApprovalTypeResult = await pool.query(
  `
  SELECT
    id,
    department_id,
    name,
    code,
    description,
    category,
    default_validity_days,
    is_renewable,
    is_active,
    created_at
  FROM approval_types
  WHERE id = $1;
  `,
  [id]
);

if (oldApprovalTypeResult.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Approval type not found",
  });
}

const oldApprovalType = oldApprovalTypeResult.rows[0];

      const {
        departmentId,
        name,
        code,
        description,
        category,
        defaultValidityDays,
        isRenewable,
        isActive,
      } = req.body;

      if (!departmentId || !name || !code) {
        return res.status(400).json({
          success: false,
          message: "Department ID, name and code are required",
        });
      }

      const departmentResult = await pool.query(
        `
        SELECT id
        FROM departments
        WHERE id = $1
          AND is_active = true
        `,
        [departmentId]
      );

      if (departmentResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active department not found",
        });
      }

      const result = await pool.query(
        `
        UPDATE approval_types
        SET
          department_id = $1,
          name = $2,
          code = $3,
          description = $4,
          category = $5,
          default_validity_days = $6,
          is_renewable = $7,
          is_active = $8
        WHERE id = $9
        RETURNING
          id,
          department_id,
          name,
          code,
          description,
          category,
          default_validity_days,
          is_renewable,
          is_active,
          created_at;
        `,
        [
          departmentId,
          name.trim(),
          code.trim().toUpperCase(),
          description || null,
          category || null,
          defaultValidityDays || null,
          isRenewable || false,
          isActive !== undefined ? isActive : true,
          id,
        ]
      );

      

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Approval type not found",
        });
      }

      await createAuditLog({
  userId: req.user.id,
  action: "UPDATE_APPROVAL_TYPE",
  entityType: "APPROVAL_TYPE",
  entityId: result.rows[0].id,
  oldValue: oldApprovalType,
  newValue: result.rows[0],
});

      return res.status(200).json({
        success: true,
        message: "Approval type updated successfully",
        approvalType: result.rows[0],
      });
    } catch (error) {
      console.error("Update approval type error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update approval type",
      });
    }
  }
);

// Get all regulatory rules
router.get(
  "/regulatory-rules",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          rr.id,
          rr.approval_type_id,
          at.name AS approval_type_name,
          at.code AS approval_type_code,
          rr.state_id,
          st.name AS state_name,
          rr.district_id,
          dstr.name AS district_name,
          rr.sector_id,
          s.name AS sector_name,
          rr.rule_name,
          rr.description,
          rr.conditions,
          rr.priority,
          rr.is_active,
          rr.source_reference,
          rr.created_at,
          rr.updated_at
        FROM regulatory_rules rr
        JOIN approval_types at
          ON at.id = rr.approval_type_id
        LEFT JOIN states st
          ON st.id = rr.state_id
        LEFT JOIN districts dstr
          ON dstr.id = rr.district_id
        LEFT JOIN industry_sectors s
          ON s.id = rr.sector_id
        ORDER BY rr.priority DESC, rr.id ASC;
      `);

      return res.status(200).json({
        success: true,
        regulatoryRules: result.rows,
      });
    } catch (error) {
      console.error("Get regulatory rules error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch regulatory rules",
      });
    }
  }
);

// Add a new regulatory rule
router.post(
  "/regulatory-rules",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const {
        approvalTypeId,
        stateId,
        districtId,
        sectorId,
        ruleName,
        description,
        conditions,
        priority,
        sourceReference,
      } = req.body;

      if (!approvalTypeId || !ruleName || !conditions) {
        return res.status(400).json({
          success: false,
          message: "Approval type ID, rule name and conditions are required",
        });
      }

      const approvalResult = await pool.query(
        `
        SELECT id
        FROM approval_types
        WHERE id = $1
          AND is_active = true
        `,
        [approvalTypeId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active approval type not found",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO regulatory_rules
        (
          approval_type_id,
          state_id,
          district_id,
          sector_id,
          rule_name,
          description,
          conditions,
          priority,
          source_reference
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          approval_type_id,
          state_id,
          district_id,
          sector_id,
          rule_name,
          description,
          conditions,
          priority,
          is_active,
          source_reference,
          created_at,
          updated_at;
        `,
        [
          approvalTypeId,
          stateId || null,
          districtId || null,
          sectorId || null,
          ruleName.trim(),
          description || null,
          conditions,
          priority !== undefined ? priority : 100,
          sourceReference || null,
        ]
      );

      await createAuditLog({
  userId: req.user.id,
  action: "CREATE_REGULATORY_RULE",
  entityType: "REGULATORY_RULE",
  entityId: result.rows[0].id,
  oldValue: null,
  newValue: result.rows[0],
});

      return res.status(201).json({
        success: true,
        message: "Regulatory rule created successfully",
        regulatoryRule: result.rows[0],
      });
    } catch (error) {
      console.error("Create regulatory rule error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create regulatory rule",
      });
    }
  }
);

// Update a regulatory rule
router.put(
  "/regulatory-rules/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const { id } = req.params;

      const oldRuleResult = await pool.query(
  `
  SELECT
    id,
    approval_type_id,
    state_id,
    district_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    is_active,
    source_reference,
    created_at,
    updated_at
  FROM regulatory_rules
  WHERE id = $1;
  `,
  [id]
);

if (oldRuleResult.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Regulatory rule not found",
  });
}

const oldRule = oldRuleResult.rows[0];

      const {
        approvalTypeId,
        stateId,
        districtId,
        sectorId,
        ruleName,
        description,
        conditions,
        priority,
        isActive,
        sourceReference,
      } = req.body;

      if (!approvalTypeId || !ruleName || !conditions) {
        return res.status(400).json({
          success: false,
          message: "Approval type ID, rule name and conditions are required",
        });
      }

      const approvalResult = await pool.query(
        `
        SELECT id
        FROM approval_types
        WHERE id = $1
          AND is_active = true
        `,
        [approvalTypeId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active approval type not found",
        });
      }

      const result = await pool.query(
        `
        UPDATE regulatory_rules
        SET
          approval_type_id = $1,
          state_id = $2,
          district_id = $3,
          sector_id = $4,
          rule_name = $5,
          description = $6,
          conditions = $7,
          priority = $8,
          is_active = $9,
          source_reference = $10,
          updated_at = NOW()
        WHERE id = $11
        RETURNING
          id,
          approval_type_id,
          state_id,
          district_id,
          sector_id,
          rule_name,
          description,
          conditions,
          priority,
          is_active,
          source_reference,
          created_at,
          updated_at;
        `,
        [
          approvalTypeId,
          stateId || null,
          districtId || null,
          sectorId || null,
          ruleName.trim(),
          description || null,
          conditions,
          priority !== undefined ? priority : 100,
          isActive !== undefined ? isActive : true,
          sourceReference || null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Regulatory rule not found",
        });
      }

      await createAuditLog({
  userId: req.user.id,
  action: "UPDATE_REGULATORY_RULE",
  entityType: "REGULATORY_RULE",
  entityId: result.rows[0].id,
  oldValue: oldRule,
  newValue: result.rows[0],
});

      return res.status(200).json({
        success: true,
        message: "Regulatory rule updated successfully",
        regulatoryRule: result.rows[0],
      });
    } catch (error) {
      console.error("Update regulatory rule error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update regulatory rule",
      });
    }
  }
);

// Get all required document configurations
router.get(
  "/required-documents",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const result = await pool.query(`
        SELECT
          rd.id,
          rd.approval_type_id,
          at.name AS approval_type_name,
          at.code AS approval_type_code,
          rd.document_name,
          rd.document_code,
          rd.description,
          rd.is_mandatory,
          rd.allowed_file_types,
          rd.max_file_size_mb,
          rd.validity_required,
          rd.is_active,
          rd.created_at
        FROM required_documents rd
        JOIN approval_types at
          ON at.id = rd.approval_type_id
        ORDER BY rd.id;
      `);

      return res.status(200).json({
        success: true,
        requiredDocuments: result.rows,
      });
    } catch (error) {
      console.error("Get required documents error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch required documents",
      });
    }
  }
);

// Add a required document configuration
router.post(
  "/required-documents",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const {
        approvalTypeId,
        documentName,
        documentCode,
        description,
        isMandatory,
        allowedFileTypes,
        maxFileSizeMb,
        validityRequired,
      } = req.body;

      if (
        !approvalTypeId ||
        !documentName ||
        !documentCode ||
        !allowedFileTypes
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Approval type ID, document name, document code and allowed file types are required",
        });
      }

      const approvalResult = await pool.query(
        `
        SELECT id
        FROM approval_types
        WHERE id = $1
          AND is_active = true
        `,
        [approvalTypeId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active approval type not found",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO required_documents
        (
          approval_type_id,
          document_name,
          document_code,
          description,
          is_mandatory,
          allowed_file_types,
          max_file_size_mb,
          validity_required
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          approval_type_id,
          document_name,
          document_code,
          description,
          is_mandatory,
          allowed_file_types,
          max_file_size_mb,
          validity_required,
          is_active,
          created_at;
        `,
        [
          approvalTypeId,
          documentName.trim(),
          documentCode.trim().toUpperCase(),
          description || null,
          isMandatory !== undefined ? isMandatory : true,
          JSON.stringify(allowedFileTypes),
          maxFileSizeMb !== undefined ? maxFileSizeMb : null,
          validityRequired !== undefined ? validityRequired : false,
        ]
      );

      await createAuditLog({
  userId: req.user.id,
  action: "CREATE_REQUIRED_DOCUMENT",
  entityType: "REQUIRED_DOCUMENT",
  entityId: result.rows[0].id,
  oldValue: null,
  newValue: result.rows[0],
});

      return res.status(201).json({
        success: true,
        message: "Required document created successfully",
        requiredDocument: result.rows[0],
      });
    } catch (error) {
      console.error("Create required document error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create required document",
      });
    }
  }
);

// Update a required document configuration
router.put(
  "/required-documents/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const pool = require("../config/db");

      const { id } = req.params;

      const oldDocumentResult = await pool.query(
  `
  SELECT
    id,
    approval_type_id,
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required,
    is_active,
    created_at
  FROM required_documents
  WHERE id = $1;
  `,
  [id]
);

if (oldDocumentResult.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Required document not found",
  });
}

const oldDocument = oldDocumentResult.rows[0];

      const {
        approvalTypeId,
        documentName,
        documentCode,
        description,
        isMandatory,
        allowedFileTypes,
        maxFileSizeMb,
        validityRequired,
        isActive,
      } = req.body;

      if (
        !approvalTypeId ||
        !documentName ||
        !documentCode ||
        !allowedFileTypes
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Approval type ID, document name, document code and allowed file types are required",
        });
      }

      const approvalResult = await pool.query(
        `
        SELECT id
        FROM approval_types
        WHERE id = $1
          AND is_active = true
        `,
        [approvalTypeId]
      );

      if (approvalResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Active approval type not found",
        });
      }

      const result = await pool.query(
        `
        UPDATE required_documents
        SET
          approval_type_id = $1,
          document_name = $2,
          document_code = $3,
          description = $4,
          is_mandatory = $5,
          allowed_file_types = $6,
          max_file_size_mb = $7,
          validity_required = $8,
          is_active = $9
        WHERE id = $10
        RETURNING
          id,
          approval_type_id,
          document_name,
          document_code,
          description,
          is_mandatory,
          allowed_file_types,
          max_file_size_mb,
          validity_required,
          is_active,
          created_at;
        `,
        [
          approvalTypeId,
          documentName.trim(),
          documentCode.trim().toUpperCase(),
          description || null,
          isMandatory !== undefined ? isMandatory : true,
          JSON.stringify(allowedFileTypes),
          maxFileSizeMb !== undefined ? maxFileSizeMb : null,
          validityRequired !== undefined ? validityRequired : false,
          isActive !== undefined ? isActive : true,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Required document not found",
        });
      }

      await createAuditLog({
  userId: req.user.id,
  action: "UPDATE_REQUIRED_DOCUMENT",
  entityType: "REQUIRED_DOCUMENT",
  entityId: result.rows[0].id,
  oldValue: oldDocument,
  newValue: result.rows[0],
});

      return res.status(200).json({
        success: true,
        message: "Required document updated successfully",
        requiredDocument: result.rows[0],
      });
    } catch (error) {
      console.error("Update required document error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update required document",
      });
    }
  }
);

module.exports = router;