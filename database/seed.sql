BEGIN;

-- =========================================================
-- INDUSTRIA360
-- Demo / Prototype Master Data
-- =========================================================
-- IMPORTANT:
-- This seed data is for demonstrating the configurable
-- INDUSTRIA360 platform.
-- It is NOT a complete or legally authoritative database
-- of Indian regulatory requirements.
-- =========================================================


-- =========================================================
-- 1. ROLES
-- =========================================================

INSERT INTO roles (name, description)
VALUES
    ('ENTREPRENEUR', 'Industrial project owner / applicant'),
    ('OFFICER', 'Department officer responsible for application processing'),
    ('ADMIN', 'Platform administrator responsible for configuration and management')
ON CONFLICT (name) DO NOTHING;


-- =========================================================
-- 2. STATES
-- =========================================================

INSERT INTO states (name, code)
VALUES
    ('Maharashtra', 'MH'),
    ('Gujarat', 'GJ'),
    ('Karnataka', 'KA'),
    ('Madhya Pradesh', 'MP'),
    ('Tamil Nadu', 'TN')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- 3. DISTRICTS
-- =========================================================

INSERT INTO districts (state_id, name)
SELECT s.id, d.name
FROM states s
CROSS JOIN (
    VALUES
        ('Maharashtra', 'Pune'),
        ('Maharashtra', 'Mumbai'),
        ('Maharashtra', 'Nashik'),
        ('Maharashtra', 'Nagpur'),
        ('Maharashtra', 'Kolhapur'),

        ('Gujarat', 'Ahmedabad'),
        ('Gujarat', 'Surat'),
        ('Gujarat', 'Vadodara'),

        ('Karnataka', 'Bengaluru Urban'),
        ('Karnataka', 'Mysuru'),
        ('Karnataka', 'Belagavi'),

        ('Madhya Pradesh', 'Indore'),
        ('Madhya Pradesh', 'Bhopal'),
        ('Madhya Pradesh', 'Jabalpur'),

        ('Tamil Nadu', 'Chennai'),
        ('Tamil Nadu', 'Coimbatore'),
        ('Tamil Nadu', 'Madurai')
) AS d(state_name, name)
WHERE s.name = d.state_name
ON CONFLICT (state_id, name) DO NOTHING;


-- =========================================================
-- 4. DEPARTMENTS
-- =========================================================

INSERT INTO departments
    (name, code, description, contact_email)
VALUES
    (
        'Industry Department',
        'IND',
        'Demo department responsible for industrial project related processing.',
        'industry@example.com'
    ),
    (
        'Environment Department',
        'ENV',
        'Demo department for environmental review workflows.',
        'environment@example.com'
    ),
    (
        'Fire & Safety Department',
        'FIRE',
        'Demo department for fire and safety related workflows.',
        'fire@example.com'
    ),
    (
        'Labour Department',
        'LAB',
        'Demo department for labour related workflows.',
        'labour@example.com'
    ),
    (
        'Electricity Department',
        'ELEC',
        'Demo department for industrial electricity related workflows.',
        'electricity@example.com'
    ),
    (
        'Local Authority Department',
        'LOCAL',
        'Demo department for local establishment and location related workflows.',
        'local@example.com'
    )
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- 5. INDUSTRY SECTORS
-- =========================================================

INSERT INTO industry_sectors
    (name, code, description)
VALUES
    (
        'Food Processing',
        'FOOD_PROCESSING',
        'Food and packaged food manufacturing projects.'
    ),
    (
        'Textile Manufacturing',
        'TEXTILE',
        'Textile and garment manufacturing projects.'
    ),
    (
        'Automobile Manufacturing',
        'AUTOMOBILE',
        'Automobile and automobile component manufacturing.'
    ),
    (
        'Pharmaceutical Manufacturing',
        'PHARMA',
        'Pharmaceutical manufacturing projects.'
    ),
    (
        'IT & Software',
        'IT_SOFTWARE',
        'Information technology and software projects.'
    ),
    (
        'Chemical Manufacturing',
        'CHEMICAL',
        'Chemical manufacturing projects.'
    )
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- 6. APPROVAL TYPES
-- =========================================================

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
SELECT
    d.id,
    a.name,
    a.code,
    a.description,
    a.category,
    a.validity_days,
    a.is_renewable
FROM departments d
JOIN (
    VALUES
        (
            'IND',
            'Manufacturing Registration',
            'DEMO_MANUFACTURING_REG',
            'Demo approval workflow for manufacturing projects.',
            'INDUSTRY',
            3650,
            TRUE
        ),
        (
            'ENV',
            'Environmental Review',
            'DEMO_ENVIRONMENT_REVIEW',
            'Demo environmental review workflow for projects requiring environmental consideration.',
            'ENVIRONMENT',
            1095,
            TRUE
        ),
        (
            'FIRE',
            'Fire Safety Approval',
            'DEMO_FIRE_SAFETY',
            'Demo fire and safety approval workflow.',
            'SAFETY',
            365,
            TRUE
        ),
        (
            'LAB',
            'Labour Registration',
            'DEMO_LABOUR_REG',
            'Demo labour-related registration workflow.',
            'LABOUR',
            3650,
            TRUE
        ),
        (
            'ELEC',
            'Industrial Electricity Approval',
            'DEMO_ELECTRICITY',
            'Demo industrial electricity connection workflow.',
            'ELECTRICITY',
            3650,
            FALSE
        ),
        (
            'LOCAL',
            'Local Establishment Approval',
            'DEMO_LOCAL_ESTABLISHMENT',
            'Demo local authority processing workflow.',
            'LOCAL',
            3650,
            TRUE
        )
) AS a(
    department_code,
    name,
    code,
    description,
    category,
    validity_days,
    is_renewable
)
ON d.code = a.department_code
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- 7. REGULATORY RULES
-- =========================================================
-- These are configurable prototype rules.
-- They demonstrate how the rules engine will work.
-- =========================================================


-- Food Processing + Maharashtra
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Food Processing Manufacturing Rule',
    'Demo rule indicating potential applicability of manufacturing registration for a food processing project.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING',
        'business_type', 'MANUFACTURING'
    ),
    100,
    'DEMO-CONFIG-MH-001'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_MANUFACTURING_REG';


-- Food Processing + Environment
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Environmental Requirement Rule',
    'Demo rule indicating potential environmental review when environmental consideration is enabled for the project.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING',
        'environment_required', true
    ),
    100,
    'DEMO-CONFIG-MH-002'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_ENVIRONMENT_REVIEW';


-- Food Processing + Fire
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Fire Safety Rule',
    'Demo rule indicating potential fire safety review for the project.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING',
        'fire_safety_required', true
    ),
    90,
    'DEMO-CONFIG-MH-003'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_FIRE_SAFETY';


-- Employee based Labour rule
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Labour Requirement Rule',
    'Demo rule indicating potential labour-related processing when employee count reaches the configured demo threshold.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING',
        'employee_count_min', 20
    ),
    80,
    'DEMO-CONFIG-MH-004'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_LABOUR_REG';


-- Electricity requirement
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Industrial Electricity Rule',
    'Demo rule indicating potential industrial electricity processing when electricity is required.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING',
        'electricity_required', true
    ),
    70,
    'DEMO-CONFIG-MH-005'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_ELECTRICITY';


-- Local authority rule
INSERT INTO regulatory_rules
(
    approval_type_id,
    state_id,
    sector_id,
    rule_name,
    description,
    conditions,
    priority,
    source_reference
)
SELECT
    a.id,
    s.id,
    sec.id,
    'Demo Local Establishment Rule',
    'Demo rule indicating potential local establishment processing for the project.',
    jsonb_build_object(
        'state', 'MH',
        'sector', 'FOOD_PROCESSING'
    ),
    60,
    'DEMO-CONFIG-MH-006'
FROM approval_types a
JOIN states s ON s.code = 'MH'
JOIN industry_sectors sec ON sec.code = 'FOOD_PROCESSING'
WHERE a.code = 'DEMO_LOCAL_ESTABLISHMENT';


-- =========================================================
-- 8. REQUIRED DOCUMENTS
-- =========================================================


-- Manufacturing Registration documents
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
SELECT
    a.id,
    d.document_name,
    d.document_code,
    d.description,
    d.is_mandatory,
    d.allowed_file_types::jsonb,
    d.max_file_size_mb,
    d.validity_required
FROM approval_types a
CROSS JOIN (
    VALUES
        (
            'Project Report',
            'PROJECT_REPORT',
            'Detailed project information document.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Identity Proof',
            'IDENTITY_PROOF',
            'Applicant identity document.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            5,
            FALSE
        ),
        (
            'Land Document',
            'LAND_DOCUMENT',
            'Project land ownership or possession document.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Site Plan',
            'SITE_PLAN',
            'Project site and layout plan.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            10,
            FALSE
        ),
        (
            'Business Details',
            'BUSINESS_DETAILS',
            'Basic business and organizational details.',
            TRUE,
            '["pdf"]',
            5,
            FALSE
        )
) AS d(
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required
)
WHERE a.code = 'DEMO_MANUFACTURING_REG'
ON CONFLICT (approval_type_id, document_code) DO NOTHING;


-- Environment documents
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
SELECT
    a.id,
    d.document_name,
    d.document_code,
    d.description,
    d.is_mandatory,
    d.allowed_file_types::jsonb,
    d.max_file_size_mb,
    d.validity_required
FROM approval_types a
CROSS JOIN (
    VALUES
        (
            'Project Report',
            'PROJECT_REPORT',
            'Project information for environmental review.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Site Plan',
            'SITE_PLAN',
            'Project site and layout information.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            10,
            FALSE
        ),
        (
            'Environmental Information',
            'ENVIRONMENT_INFO',
            'Environmental information provided by the applicant.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Production Details',
            'PRODUCTION_DETAILS',
            'Production activity and capacity information.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Water Requirement Details',
            'WATER_DETAILS',
            'Project water requirement information.',
            TRUE,
            '["pdf"]',
            5,
            FALSE
        )
) AS d(
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required
)
WHERE a.code = 'DEMO_ENVIRONMENT_REVIEW'
ON CONFLICT (approval_type_id, document_code) DO NOTHING;


-- Fire Safety documents
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
SELECT
    a.id,
    d.document_name,
    d.document_code,
    d.description,
    d.is_mandatory,
    d.allowed_file_types::jsonb,
    d.max_file_size_mb,
    d.validity_required
FROM approval_types a
CROSS JOIN (
    VALUES
        (
            'Site Plan',
            'SITE_PLAN',
            'Project site plan.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            10,
            FALSE
        ),
        (
            'Building Layout',
            'BUILDING_LAYOUT',
            'Building and facility layout.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Fire Safety Plan',
            'FIRE_SAFETY_PLAN',
            'Project fire safety plan.',
            TRUE,
            '["pdf"]',
            10,
            FALSE
        ),
        (
            'Emergency Exit Details',
            'EMERGENCY_EXIT',
            'Emergency exit and evacuation information.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            5,
            FALSE
        )
) AS d(
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required
)
WHERE a.code = 'DEMO_FIRE_SAFETY'
ON CONFLICT (approval_type_id, document_code) DO NOTHING;


-- Labour documents
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
SELECT
    a.id,
    d.document_name,
    d.document_code,
    d.description,
    d.is_mandatory,
    d.allowed_file_types::jsonb,
    d.max_file_size_mb,
    d.validity_required
FROM approval_types a
CROSS JOIN (
    VALUES
        (
            'Employee Details',
            'EMPLOYEE_DETAILS',
            'Employee and workforce information.',
            TRUE,
            '["pdf","xlsx","csv"]',
            10,
            FALSE
        ),
        (
            'Business Details',
            'BUSINESS_DETAILS',
            'Basic business information.',
            TRUE,
            '["pdf"]',
            5,
            FALSE
        )
) AS d(
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required
)
WHERE a.code = 'DEMO_LABOUR_REG'
ON CONFLICT (approval_type_id, document_code) DO NOTHING;


-- Electricity documents
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
SELECT
    a.id,
    d.document_name,
    d.document_code,
    d.description,
    d.is_mandatory,
    d.allowed_file_types::jsonb,
    d.max_file_size_mb,
    d.validity_required
FROM approval_types a
CROSS JOIN (
    VALUES
        (
            'Project Details',
            'PROJECT_DETAILS',
            'Project information required for the demo electricity workflow.',
            TRUE,
            '["pdf"]',
            5,
            FALSE
        ),
        (
            'Electrical Load Details',
            'ELECTRICAL_LOAD',
            'Expected electrical load information.',
            TRUE,
            '["pdf"]',
            5,
            FALSE
        ),
        (
            'Site Information',
            'SITE_INFORMATION',
            'Project site information.',
            TRUE,
            '["pdf","jpg","jpeg","png"]',
            5,
            FALSE
        )
) AS d(
    document_name,
    document_code,
    description,
    is_mandatory,
    allowed_file_types,
    max_file_size_mb,
    validity_required
)
WHERE a.code = 'DEMO_ELECTRICITY'
ON CONFLICT (approval_type_id, document_code) DO NOTHING;


-- =========================================================
-- 9. SLA RULES
-- =========================================================

INSERT INTO sla_rules
(
    approval_type_id,
    department_id,
    duration_days,
    warning_threshold_days
)
SELECT
    a.id,
    d.id,
    x.duration_days,
    x.warning_days
FROM (
    VALUES
        ('DEMO_MANUFACTURING_REG', 'IND', 15, 5),
        ('DEMO_ENVIRONMENT_REVIEW', 'ENV', 30, 7),
        ('DEMO_FIRE_SAFETY', 'FIRE', 15, 5),
        ('DEMO_LABOUR_REG', 'LAB', 10, 3),
        ('DEMO_ELECTRICITY', 'ELEC', 20, 5),
        ('DEMO_LOCAL_ESTABLISHMENT', 'LOCAL', 15, 5)
) AS x(approval_code, department_code, duration_days, warning_days)
JOIN approval_types a
    ON a.code = x.approval_code
JOIN departments d
    ON d.code = x.department_code
WHERE NOT EXISTS (
    SELECT 1
    FROM sla_rules existing
    WHERE existing.approval_type_id = a.id
      AND existing.department_id = d.id
);


-- =========================================================
-- 10. RISK RULES
-- =========================================================

INSERT INTO risk_rules
(
    name,
    description,
    condition,
    risk_level,
    weight
)
VALUES
(
    'Environmental Requirement',
    'Demo risk factor when environmental consideration is enabled.',
    '{"environment_required": true}'::jsonb,
    'MEDIUM',
    20
),
(
    'High Investment Demo Factor',
    'Demo risk factor for projects above the configured investment value.',
    '{"investment_amount_min": 50000000}'::jsonb,
    'MEDIUM',
    20
),
(
    'Large Workforce Demo Factor',
    'Demo risk factor for projects with a larger configured workforce.',
    '{"employee_count_min": 100}'::jsonb,
    'MEDIUM',
    15
),
(
    'Missing Documents',
    'Demo risk factor when mandatory application documents are missing.',
    '{"missing_documents": true}'::jsonb,
    'HIGH',
    30
),
(
    'Inconsistent Information',
    'Demo risk factor when project or application information is inconsistent.',
    '{"inconsistent_information": true}'::jsonb,
    'HIGH',
    30
);


-- =========================================================
-- 11. DEMO SCHEMES
-- =========================================================

INSERT INTO schemes
(
    name,
    description,
    state_id,
    sector_id,
    min_investment,
    max_investment,
    business_type,
    employment_requirement,
    source_reference
)
SELECT
    'State Manufacturing Support - Demo Scheme',
    'Prototype scheme record used to demonstrate configurable scheme matching.',
    s.id,
    NULL,
    2500000,
    NULL,
    'MANUFACTURING',
    10,
    'DEMO-SCHEME-MH-001'
FROM states s
WHERE s.code = 'MH'
AND NOT EXISTS (
    SELECT 1
    FROM schemes
    WHERE name = 'State Manufacturing Support - Demo Scheme'
);


INSERT INTO schemes
(
    name,
    description,
    state_id,
    sector_id,
    min_investment,
    max_investment,
    business_type,
    employment_requirement,
    source_reference
)
SELECT
    'Food Processing Growth - Demo Incentive',
    'Prototype food processing scheme record for demonstrating sector-based matching.',
    s.id,
    sec.id,
    5000000,
    NULL,
    'MANUFACTURING',
    20,
    'DEMO-SCHEME-MH-002'
FROM states s
JOIN industry_sectors sec
    ON sec.code = 'FOOD_PROCESSING'
WHERE s.code = 'MH'
AND NOT EXISTS (
    SELECT 1
    FROM schemes
    WHERE name = 'Food Processing Growth - Demo Incentive'
);


INSERT INTO schemes
(
    name,
    description,
    state_id,
    sector_id,
    min_investment,
    max_investment,
    business_type,
    employment_requirement,
    source_reference
)
SELECT
    'Industrial Employment Support - Demo Scheme',
    'Prototype employment-focused scheme record for demonstrating eligibility matching.',
    s.id,
    NULL,
    1000000,
    NULL,
    'MANUFACTURING',
    40,
    'DEMO-SCHEME-MH-003'
FROM states s
WHERE s.code = 'MH'
AND NOT EXISTS (
    SELECT 1
    FROM schemes
    WHERE name = 'Industrial Employment Support - Demo Scheme'
);


INSERT INTO schemes
(
    name,
    description,
    state_id,
    sector_id,
    min_investment,
    max_investment,
    business_type,
    employment_requirement,
    source_reference
)
SELECT
    'Green Manufacturing Support - Demo Scheme',
    'Prototype scheme record for demonstrating environment-related scheme matching.',
    s.id,
    sec.id,
    5000000,
    NULL,
    'MANUFACTURING',
    10,
    'DEMO-SCHEME-MH-004'
FROM states s
JOIN industry_sectors sec
    ON sec.code = 'FOOD_PROCESSING'
WHERE s.code = 'MH'
AND NOT EXISTS (
    SELECT 1
    FROM schemes
    WHERE name = 'Green Manufacturing Support - Demo Scheme'
);


-- =========================================================
-- 12. SCHEME ELIGIBILITY CRITERIA
-- =========================================================

INSERT INTO scheme_eligibility
(
    scheme_id,
    criterion_name,
    criterion_type,
    criterion_value
)
SELECT
    s.id,
    'State',
    'STATE',
    '{"state_code": "MH"}'::jsonb
FROM schemes s
WHERE s.name = 'State Manufacturing Support - Demo Scheme'
AND NOT EXISTS (
    SELECT 1
    FROM scheme_eligibility se
    WHERE se.scheme_id = s.id
      AND se.criterion_name = 'State'
);


INSERT INTO scheme_eligibility
(
    scheme_id,
    criterion_name,
    criterion_type,
    criterion_value
)
SELECT
    s.id,
    'Sector',
    'SECTOR',
    '{"sector_code": "FOOD_PROCESSING"}'::jsonb
FROM schemes s
WHERE s.name = 'Food Processing Growth - Demo Incentive'
AND NOT EXISTS (
    SELECT 1
    FROM scheme_eligibility se
    WHERE se.scheme_id = s.id
      AND se.criterion_name = 'Sector'
);


INSERT INTO scheme_eligibility
(
    scheme_id,
    criterion_name,
    criterion_type,
    criterion_value
)
SELECT
    s.id,
    'Employment',
    'EMPLOYMENT',
    '{"minimum_employees": 40}'::jsonb
FROM schemes s
WHERE s.name = 'Industrial Employment Support - Demo Scheme'
AND NOT EXISTS (
    SELECT 1
    FROM scheme_eligibility se
    WHERE se.scheme_id = s.id
      AND se.criterion_name = 'Employment'
);


INSERT INTO scheme_eligibility
(
    scheme_id,
    criterion_name,
    criterion_type,
    criterion_value
)
SELECT
    s.id,
    'Environment',
    'ENVIRONMENT',
    '{"environment_required": true}'::jsonb
FROM schemes s
WHERE s.name = 'Green Manufacturing Support - Demo Scheme'
AND NOT EXISTS (
    SELECT 1
    FROM scheme_eligibility se
    WHERE se.scheme_id = s.id
      AND se.criterion_name = 'Environment'
);


-- =========================================================
-- COMPLETE
-- =========================================================

COMMIT;

