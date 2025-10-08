-- ============================================================================
-- Audit & Security Tables Schema for RapidTriageME
-- ============================================================================
-- Comprehensive audit logging, security events, and compliance tracking
-- Supports GDPR, HIPAA, SOC2 compliance requirements
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE audit_action AS ENUM (
    'create', 'read', 'update', 'delete', 'execute', 'login', 'logout',
    'export', 'import', 'approve', 'reject', 'share', 'revoke'
);

CREATE TYPE audit_entity AS ENUM (
    'user', 'organization', 'project', 'api_key', 'subscription',
    'invoice', 'report', 'dashboard', 'debug_session', 'setting'
);

CREATE TYPE security_event_type AS ENUM (
    'login_success', 'login_failure', 'logout', 'password_change', 'password_reset',
    'mfa_enabled', 'mfa_disabled', 'mfa_challenge', 'api_key_created', 'api_key_revoked',
    'suspicious_activity', 'brute_force_attempt', 'ip_blocked', 'session_hijack_attempt',
    'privilege_escalation', 'data_export', 'permission_change', 'account_locked'
);

CREATE TYPE risk_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');
CREATE TYPE compliance_standard AS ENUM ('gdpr', 'hipaa', 'soc2', 'iso27001', 'pci_dss', 'ccpa');

-- ============================================================================
-- AUDIT_LOGS TABLE
-- Comprehensive audit trail for all system actions
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Actor information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    impersonator_id UUID REFERENCES users(id), -- If action was done on behalf of another user

    -- Action details
    action audit_action NOT NULL,
    entity_type audit_entity NOT NULL,
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),

    -- Change tracking
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    changed_fields TEXT[], -- List of modified fields

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    session_id VARCHAR(255),
    request_method VARCHAR(10),
    request_path TEXT,
    request_params JSONB,
    response_status INTEGER,

    -- Location and device
    location JSONB DEFAULT '{
        "country": null,
        "region": null,
        "city": null,
        "latitude": null,
        "longitude": null
    }',
    device_info JSONB DEFAULT '{}',

    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_code VARCHAR(50),

    -- Compliance
    compliance_flags compliance_standard[],
    data_classification VARCHAR(50), -- public, internal, confidential, restricted

    -- Metadata
    service_name VARCHAR(100), -- Which microservice generated this
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_organization_id (organization_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_entity_type (entity_type),
    INDEX idx_audit_logs_entity_id (entity_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_ip_address (ip_address),
    INDEX idx_audit_logs_compliance_flags (compliance_flags) USING GIN
) PARTITION BY RANGE (created_at);

-- Create partitions for audit logs (monthly)
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Add more partitions as needed

-- ============================================================================
-- SECURITY_EVENTS TABLE
-- Security-specific events and threat detection
-- ============================================================================

CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Event details
    event_type security_event_type NOT NULL,
    severity risk_level DEFAULT 'low',
    description TEXT,

    -- Threat detection
    threat_indicators JSONB DEFAULT '[]', -- Suspicious patterns detected
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

    -- Source information
    ip_address INET,
    previous_ip INET,
    user_agent TEXT,
    referrer TEXT,

    -- Geolocation
    location JSONB DEFAULT '{}',
    location_anomaly BOOLEAN DEFAULT FALSE, -- Unusual location for user

    -- Device fingerprint
    device_id VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    device_trusted BOOLEAN,

    -- Authentication context
    auth_method VARCHAR(50),
    mfa_used BOOLEAN DEFAULT FALSE,
    session_id VARCHAR(255),

    -- Response actions
    action_taken VARCHAR(100), -- blocked, challenged, allowed, flagged
    auto_response BOOLEAN DEFAULT FALSE,
    manual_review_required BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    -- Related events
    related_event_ids UUID[],
    correlation_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_security_events_user_id (user_id),
    INDEX idx_security_events_organization_id (organization_id),
    INDEX idx_security_events_event_type (event_type),
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_created_at (created_at),
    INDEX idx_security_events_ip_address (ip_address),
    INDEX idx_security_events_risk_score (risk_score),
    INDEX idx_security_events_manual_review_required (manual_review_required)
);

-- ============================================================================
-- IP_BLACKLIST TABLE
-- Blocked IP addresses
-- ============================================================================

CREATE TABLE ip_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    ip_range_start INET,
    ip_range_end INET,

    -- Blocking details
    reason TEXT NOT NULL,
    threat_type VARCHAR(100), -- brute_force, ddos, scanner, bot, spam
    risk_level risk_level DEFAULT 'high',

    -- Source of block
    source VARCHAR(100), -- manual, automatic, threat_feed, abuse_report
    source_reference VARCHAR(255),

    -- Scope
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_global BOOLEAN DEFAULT FALSE,

    -- Duration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT FALSE,

    -- Administrative
    blocked_by UUID REFERENCES users(id),
    unblocked_by UUID REFERENCES users(id),
    unblocked_at TIMESTAMP WITH TIME ZONE,
    unblock_reason TEXT,

    -- Statistics
    block_count INTEGER DEFAULT 0,
    last_blocked_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(ip_address, organization_id),

    -- Indexes
    INDEX idx_ip_blacklist_ip_address (ip_address),
    INDEX idx_ip_blacklist_organization_id (organization_id),
    INDEX idx_ip_blacklist_expires_at (expires_at),
    INDEX idx_ip_blacklist_is_global (is_global)
);

-- ============================================================================
-- IP_WHITELIST TABLE
-- Trusted IP addresses
-- ============================================================================

CREATE TABLE ip_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- IP configuration
    ip_address INET NOT NULL,
    ip_range_start INET,
    ip_range_end INET,

    -- Whitelist details
    description TEXT,
    location VARCHAR(255),
    owner VARCHAR(255),

    -- Permissions
    bypass_rate_limits BOOLEAN DEFAULT FALSE,
    bypass_mfa BOOLEAN DEFAULT FALSE,
    bypass_geo_restrictions BOOLEAN DEFAULT FALSE,

    -- Validity
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Administrative
    added_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(organization_id, ip_address),

    -- Indexes
    INDEX idx_ip_whitelist_organization_id (organization_id),
    INDEX idx_ip_whitelist_ip_address (ip_address),
    INDEX idx_ip_whitelist_is_active (is_active)
);

-- ============================================================================
-- DATA_ACCESS_LOGS TABLE
-- Track sensitive data access for compliance
-- ============================================================================

CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Data identification
    data_type VARCHAR(100) NOT NULL, -- personal_info, payment_data, health_records, etc.
    data_subject_id VARCHAR(255), -- ID of the person whose data was accessed
    data_classification VARCHAR(50), -- public, internal, confidential, restricted

    -- Access details
    action VARCHAR(50) NOT NULL, -- view, export, modify, delete
    purpose VARCHAR(255), -- Business reason for access
    legal_basis VARCHAR(100), -- GDPR legal basis

    -- Scope
    record_count INTEGER,
    fields_accessed TEXT[],

    -- Export tracking
    exported BOOLEAN DEFAULT FALSE,
    export_format VARCHAR(50),
    export_destination TEXT,

    -- Request context
    ip_address INET,
    session_id VARCHAR(255),
    api_key_id UUID REFERENCES api_keys(id),

    -- Compliance
    compliance_standards compliance_standard[],
    retention_period_days INTEGER,
    deletion_scheduled_at TIMESTAMP WITH TIME ZONE,

    -- Approval (if required)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approval_timestamp TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_data_access_logs_user_id (user_id),
    INDEX idx_data_access_logs_data_subject_id (data_subject_id),
    INDEX idx_data_access_logs_data_type (data_type),
    INDEX idx_data_access_logs_accessed_at (accessed_at),
    INDEX idx_data_access_logs_compliance_standards (compliance_standards) USING GIN
);

-- ============================================================================
-- COMPLIANCE_REPORTS TABLE
-- Compliance audit reports and certifications
-- ============================================================================

CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Report details
    standard compliance_standard NOT NULL,
    report_type VARCHAR(100), -- audit, self_assessment, certification
    report_period_start DATE,
    report_period_end DATE,

    -- Assessment
    compliance_score DECIMAL(5,2),
    is_compliant BOOLEAN,
    gaps_identified JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Auditor information
    auditor_name VARCHAR(255),
    auditor_organization VARCHAR(255),
    audit_date DATE,

    -- Report storage
    report_url TEXT,
    report_data JSONB,
    certificate_url TEXT,
    certificate_expires_at DATE,

    -- Action items
    action_items JSONB DEFAULT '[]',
    remediation_deadline DATE,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_compliance_reports_organization_id (organization_id),
    INDEX idx_compliance_reports_standard (standard),
    INDEX idx_compliance_reports_audit_date (audit_date)
);

-- ============================================================================
-- RATE_LIMIT_VIOLATIONS TABLE
-- Track rate limit violations for security monitoring
-- ============================================================================

CREATE TABLE rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Violation details
    limit_type VARCHAR(50) NOT NULL, -- api_calls, bandwidth, storage, etc.
    limit_value INTEGER NOT NULL,
    actual_value INTEGER NOT NULL,
    time_window VARCHAR(20), -- 1h, 24h, etc.

    -- Request context
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),

    -- Response
    action_taken VARCHAR(50), -- throttled, blocked, allowed_with_warning
    retry_after INTEGER, -- Seconds until retry allowed

    -- Pattern detection
    is_pattern BOOLEAN DEFAULT FALSE,
    pattern_confidence DECIMAL(5,2),
    related_violations UUID[],

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    violated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_rate_limit_violations_user_id (user_id),
    INDEX idx_rate_limit_violations_api_key_id (api_key_id),
    INDEX idx_rate_limit_violations_ip_address (ip_address),
    INDEX idx_rate_limit_violations_violated_at (violated_at)
);

-- ============================================================================
-- PRIVACY_REQUESTS TABLE
-- GDPR/CCPA data subject requests
-- ============================================================================

CREATE TABLE privacy_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Request details
    request_type VARCHAR(50) NOT NULL, -- access, rectification, deletion, portability, restriction
    description TEXT,
    legal_basis VARCHAR(100),

    -- Verification
    identity_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Processing
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, rejected
    assigned_to UUID REFERENCES users(id),
    priority risk_level DEFAULT 'medium',

    -- Response
    response_data JSONB,
    response_url TEXT,
    response_sent_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Compliance tracking
    deadline TIMESTAMP WITH TIME ZONE, -- Legal deadline for response
    completed_at TIMESTAMP WITH TIME ZONE,
    days_to_complete INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_privacy_requests_requester_email (requester_email),
    INDEX idx_privacy_requests_user_id (user_id),
    INDEX idx_privacy_requests_status (status),
    INDEX idx_privacy_requests_deadline (deadline)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate risk score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_event_type security_event_type,
    p_ip_address INET,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_risk_score INTEGER := 0;
    v_recent_failures INTEGER;
    v_ip_reputation INTEGER;
BEGIN
    -- Base risk for event type
    v_risk_score := CASE p_event_type
        WHEN 'login_failure' THEN 10
        WHEN 'suspicious_activity' THEN 50
        WHEN 'brute_force_attempt' THEN 75
        WHEN 'privilege_escalation' THEN 90
        ELSE 5
    END;

    -- Check recent failures from same IP
    SELECT COUNT(*) INTO v_recent_failures
    FROM security_events
    WHERE ip_address = p_ip_address
        AND event_type = 'login_failure'
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';

    v_risk_score := v_risk_score + (v_recent_failures * 10);

    -- Check if IP is blacklisted
    IF EXISTS (
        SELECT 1 FROM ip_blacklist
        WHERE ip_address = p_ip_address
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) THEN
        v_risk_score := v_risk_score + 30;
    END IF;

    -- Cap at 100
    IF v_risk_score > 100 THEN
        v_risk_score := 100;
    END IF;

    RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize personal data for GDPR compliance
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID) RETURNS VOID AS $$
BEGIN
    -- Anonymize user table
    UPDATE users
    SET email = 'anonymized_' || id || '@example.com',
        name = 'Anonymized User',
        phone = NULL,
        avatar_url = NULL,
        deleted_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;

    -- Anonymize audit logs
    UPDATE audit_logs
    SET ip_address = '0.0.0.0'::INET,
        user_agent = 'ANONYMIZED',
        old_values = NULL,
        new_values = NULL
    WHERE user_id = p_user_id;

    -- More anonymization as needed...
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_ip_blacklist_updated_at BEFORE UPDATE ON ip_blacklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_whitelist_updated_at BEFORE UPDATE ON ip_whitelist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_requests_updated_at BEFORE UPDATE ON privacy_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();