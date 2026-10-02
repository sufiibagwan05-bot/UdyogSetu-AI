-- ============================================================
-- INDUSTRIA360
-- Intelligent Industrial Approval & Compliance Management Platform
-- Database Schema
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. STATES
-- ============================================================

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. DEPARTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. INDUSTRY SECTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS industry_sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. DISTRICTS
-- ============================================================

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_district_state
        FOREIGN KEY (state_id)
        REFERENCES states(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_district_state_name
        UNIQUE (state_id, name)
);

-- ============================================================
-- 6. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    department_id INTEGER,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 7. PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL,
    sector_id INTEGER NOT NULL,
    state_id INTEGER NOT NULL,
    district_id INTEGER NOT NULL,

    project_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    location TEXT,

    investment_amount NUMERIC(18, 2),
    project_size VARCHAR(100),
    land_status VARCHAR(100),
    production_activity TEXT,
    employee_count INTEGER,

    project_stage VARCHAR(100),

    environment_required BOOLEAN,
    water_required BOOLEAN,
    electricity_required BOOLEAN,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_project_sector
        FOREIGN KEY (sector_id)
        REFERENCES industry_sectors(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_project_state
        FOREIGN KEY (state_id)
        REFERENCES states(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_project_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_project_investment
        CHECK (investment_amount IS NULL OR investment_amount >= 0),

    CONSTRAINT chk_project_employee_count
        CHECK (employee_count IS NULL OR employee_count >= 0)
);

-- ============================================================
-- 8. APPROVAL TYPES
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_types (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,

    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),

    default_validity_days INTEGER,
    is_renewable BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_approval_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_approval_validity
        CHECK (
            default_validity_days IS NULL
            OR default_validity_days > 0
        )
);

-- ============================================================
-- 9. REGULATORY RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS regulatory_rules (
    id SERIAL PRIMARY KEY,

    approval_type_id INTEGER NOT NULL,
    state_id INTEGER,
    district_id INTEGER,
    sector_id INTEGER,

    rule_name VARCHAR(200) NOT NULL,
    description TEXT,

    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    source_reference TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rule_approval
        FOREIGN KEY (approval_type_id)
        REFERENCES approval_types(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rule_state
        FOREIGN KEY (state_id)
        REFERENCES states(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_rule_district
        FOREIGN KEY (district_id)
        REFERENCES districts(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_rule_sector
        FOREIGN KEY (sector_id)
        REFERENCES industry_sectors(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_rule_priority
        CHECK (priority > 0)
);

-- ============================================================
-- 10. REQUIRED DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS required_documents (
    id SERIAL PRIMARY KEY,

    approval_type_id INTEGER NOT NULL,

    document_name VARCHAR(200) NOT NULL,
    document_code VARCHAR(100) NOT NULL,
    description TEXT,

    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

    allowed_file_types JSONB NOT NULL DEFAULT '[]'::jsonb,

    max_file_size_mb NUMERIC(8, 2),

    validity_required BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_required_document_approval
        FOREIGN KEY (approval_type_id)
        REFERENCES approval_types(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_required_document
        UNIQUE (approval_type_id, document_code),

    CONSTRAINT chk_document_size
        CHECK (
            max_file_size_mb IS NULL
            OR max_file_size_mb > 0
        )
);

-- ============================================================
-- 11. PROJECT APPROVALS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_approvals (
    id SERIAL PRIMARY KEY,

    project_id INTEGER NOT NULL,
    approval_type_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,

    applicability_status VARCHAR(50) NOT NULL,
    reason TEXT,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',

    required_documents_summary JSONB NOT NULL DEFAULT '[]'::jsonb,

    sla_days INTEGER,
    inspection_required BOOLEAN NOT NULL DEFAULT FALSE,
    renewal_required BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_approval_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_approval_type
        FOREIGN KEY (approval_type_id)
        REFERENCES approval_types(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_project_approval_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_project_approval
        UNIQUE (project_id, approval_type_id),

    CONSTRAINT chk_project_approval_sla
        CHECK (
            sla_days IS NULL
            OR sla_days > 0
        )
);

-- ============================================================
-- 12. PROJECT DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_documents (
    id SERIAL PRIMARY KEY,

    project_id INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,

    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(200) NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,

    file_size BIGINT,
    mime_type VARCHAR(100),

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expiry_date DATE,

    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_project_document_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_document_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_document_version
        CHECK (version > 0),

    CONSTRAINT chk_document_file_size
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )
);

-- ============================================================
-- 13. APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,

    project_approval_id INTEGER NOT NULL,

    application_number VARCHAR(100) NOT NULL UNIQUE,

    submitted_by INTEGER NOT NULL,
    assigned_officer_id INTEGER,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,

    rejection_reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_project_approval
        FOREIGN KEY (project_approval_id)
        REFERENCES project_approvals(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_application_submitter
        FOREIGN KEY (submitted_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_application_officer
        FOREIGN KEY (assigned_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 14. APPLICATION DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL,
    project_document_id INTEGER NOT NULL,

    document_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,

    remarks TEXT,

    CONSTRAINT fk_application_document_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_document_project_document
        FOREIGN KEY (project_document_id)
        REFERENCES project_documents(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_application_document_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_application_project_document
        UNIQUE (application_id, project_document_id)
);

-- ============================================================
-- 15. APPLICATION QUERIES
-- ============================================================

CREATE TABLE IF NOT EXISTS application_queries (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL,
    raised_by INTEGER NOT NULL,

    query_text TEXT NOT NULL,
    response_text TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    raised_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    resolved_at TIMESTAMP,

    CONSTRAINT fk_query_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_query_user
        FOREIGN KEY (raised_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- ============================================================
-- 16. INSPECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL,
    assigned_officer_id INTEGER,

    scheduled_date TIMESTAMP,
    inspection_date TIMESTAMP,

    status VARCHAR(50) NOT NULL DEFAULT 'REQUIRED',

    location TEXT,
    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inspection_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inspection_officer
        FOREIGN KEY (assigned_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 17. INSPECTION REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_reports (
    id SERIAL PRIMARY KEY,

    inspection_id INTEGER NOT NULL UNIQUE,
    inspector_id INTEGER NOT NULL,

    result VARCHAR(50) NOT NULL,

    findings TEXT,
    issues TEXT,
    recommendation TEXT,

    report_file_url TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_inspection
        FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_report_inspector
        FOREIGN KEY (inspector_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- ============================================================
-- 18. SLA RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS sla_rules (
    id SERIAL PRIMARY KEY,

    approval_type_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,

    duration_days INTEGER NOT NULL,
    warning_threshold_days INTEGER NOT NULL DEFAULT 5,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sla_approval
        FOREIGN KEY (approval_type_id)
        REFERENCES approval_types(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sla_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_sla_duration
        CHECK (duration_days > 0),

    CONSTRAINT chk_sla_warning
        CHECK (
            warning_threshold_days >= 0
            AND warning_threshold_days <= duration_days
        )
);

-- ============================================================
-- 19. APPLICATION SLA
-- ============================================================

CREATE TABLE IF NOT EXISTS application_sla (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL UNIQUE,
    sla_rule_id INTEGER NOT NULL,

    start_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,

    completed_date TIMESTAMP,

    status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',

    breached_at TIMESTAMP,

    CONSTRAINT fk_application_sla_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_sla_rule
        FOREIGN KEY (sla_rule_id)
        REFERENCES sla_rules(id)
        ON DELETE RESTRICT
);

-- ============================================================
-- 20. RISK RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS risk_rules (
    id SERIAL PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    condition JSONB NOT NULL DEFAULT '{}'::jsonb,

    risk_level VARCHAR(20) NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_risk_level
        CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),

    CONSTRAINT chk_risk_weight
        CHECK (weight > 0)
);

-- ============================================================
-- 21. RISK ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS risk_assessments (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL UNIQUE,

    risk_level VARCHAR(20) NOT NULL,
    risk_score NUMERIC(10, 2),

    factors JSONB NOT NULL DEFAULT '[]'::jsonb,

    recommendation TEXT,

    assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assessed_by INTEGER,

    CONSTRAINT fk_risk_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_risk_assessor
        FOREIGN KEY (assessed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_assessment_risk_level
        CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),

    CONSTRAINT chk_risk_score
        CHECK (
            risk_score IS NULL
            OR risk_score >= 0
        )
);

-- ============================================================
-- 22. SCHEMES
-- ============================================================

CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    state_id INTEGER,
    sector_id INTEGER,

    min_investment NUMERIC(18, 2),
    max_investment NUMERIC(18, 2),

    business_type VARCHAR(100),
    employment_requirement INTEGER,

    source_reference TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_scheme_state
        FOREIGN KEY (state_id)
        REFERENCES states(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_scheme_sector
        FOREIGN KEY (sector_id)
        REFERENCES industry_sectors(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_scheme_investment
        CHECK (
            min_investment IS NULL
            OR min_investment >= 0
        ),

    CONSTRAINT chk_scheme_max_investment
        CHECK (
            max_investment IS NULL
            OR max_investment >= 0
        ),

    CONSTRAINT chk_scheme_investment_range
        CHECK (
            min_investment IS NULL
            OR max_investment IS NULL
            OR min_investment <= max_investment
        ),

    CONSTRAINT chk_scheme_employment
        CHECK (
            employment_requirement IS NULL
            OR employment_requirement >= 0
        )
);

-- ============================================================
-- 23. SCHEME ELIGIBILITY
-- ============================================================

CREATE TABLE IF NOT EXISTS scheme_eligibility (
    id SERIAL PRIMARY KEY,

    scheme_id INTEGER NOT NULL,

    criterion_name VARCHAR(150) NOT NULL,
    criterion_type VARCHAR(100) NOT NULL,
    criterion_value JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_scheme_eligibility_scheme
        FOREIGN KEY (scheme_id)
        REFERENCES schemes(id)
        ON DELETE CASCADE
);

-- ============================================================
-- 24. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- 25. GRIEVANCES
-- ============================================================

CREATE TABLE IF NOT EXISTS grievances (
    id SERIAL PRIMARY KEY,

    project_id INTEGER NOT NULL,
    application_id INTEGER,

    raised_by INTEGER NOT NULL,

    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'RAISED',

    department_id INTEGER,
    assigned_officer_id INTEGER,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    CONSTRAINT fk_grievance_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grievance_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_grievance_user
        FOREIGN KEY (raised_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_grievance_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_grievance_officer
        FOREIGN KEY (assigned_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 26. GRIEVANCE ESCALATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS grievance_escalations (
    id SERIAL PRIMARY KEY,

    grievance_id INTEGER NOT NULL,

    from_officer_id INTEGER,
    to_officer_id INTEGER,

    reason TEXT NOT NULL,

    escalated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_escalation_grievance
        FOREIGN KEY (grievance_id)
        REFERENCES grievances(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_escalation_from_officer
        FOREIGN KEY (from_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_escalation_to_officer
        FOREIGN KEY (to_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 27. RENEWALS
-- ============================================================

CREATE TABLE IF NOT EXISTS renewals (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL,
    approval_type_id INTEGER NOT NULL,

    current_valid_from DATE,
    current_valid_until DATE,

    renewal_due_date DATE,

    status VARCHAR(50) NOT NULL DEFAULT 'NOT_DUE',

    renewal_application_id INTEGER,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_renewal_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_renewal_approval_type
        FOREIGN KEY (approval_type_id)
        REFERENCES approval_types(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_renewal_application_reference
        FOREIGN KEY (renewal_application_id)
        REFERENCES applications(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 28. AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,

    user_id INTEGER,

    action VARCHAR(150) NOT NULL,

    entity_type VARCHAR(100),
    entity_id INTEGER,

    old_value JSONB,
    new_value JSONB,

    ip_address INET,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_users_department
    ON users(department_id);

CREATE INDEX IF NOT EXISTS idx_districts_state
    ON districts(state_id);

CREATE INDEX IF NOT EXISTS idx_projects_owner
    ON projects(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_projects_sector
    ON projects(sector_id);

CREATE INDEX IF NOT EXISTS idx_projects_state
    ON projects(state_id);

CREATE INDEX IF NOT EXISTS idx_projects_district
    ON projects(district_id);

CREATE INDEX IF NOT EXISTS idx_projects_status
    ON projects(status);

CREATE INDEX IF NOT EXISTS idx_regulatory_rules_approval
    ON regulatory_rules(approval_type_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_rules_state
    ON regulatory_rules(state_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_rules_sector
    ON regulatory_rules(sector_id);

CREATE INDEX IF NOT EXISTS idx_project_approvals_project
    ON project_approvals(project_id);

CREATE INDEX IF NOT EXISTS idx_project_approvals_status
    ON project_approvals(status);

CREATE INDEX IF NOT EXISTS idx_project_documents_project
    ON project_documents(project_id);

CREATE INDEX IF NOT EXISTS idx_applications_project_approval
    ON applications(project_approval_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
    ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_officer
    ON applications(assigned_officer_id);

CREATE INDEX IF NOT EXISTS idx_application_queries_application
    ON application_queries(application_id);

CREATE INDEX IF NOT EXISTS idx_inspections_application
    ON inspections(application_id);

CREATE INDEX IF NOT EXISTS idx_inspections_officer
    ON inspections(assigned_officer_id);

CREATE INDEX IF NOT EXISTS idx_application_sla_status
    ON application_sla(status);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_application
    ON risk_assessments(application_id);

CREATE INDEX IF NOT EXISTS idx_schemes_state
    ON schemes(state_id);

CREATE INDEX IF NOT EXISTS idx_schemes_sector
    ON schemes(sector_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
    ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_grievances_project
    ON grievances(project_id);

CREATE INDEX IF NOT EXISTS idx_grievances_status
    ON grievances(status);

CREATE INDEX IF NOT EXISTS idx_grievances_officer
    ON grievances(assigned_officer_id);

CREATE INDEX IF NOT EXISTS idx_renewals_due_date
    ON renewals(renewal_due_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at);

-- ============================================================
-- END OF INDUSTRIA360 SCHEMA
-- ============================================================

