-- ============================================================================
-- Authentication Tables Schema for RapidTriageME
-- ============================================================================
-- Handles API keys, sessions, OAuth providers, and Keycloak integration
-- Supports multi-factor authentication and advanced security features
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE auth_provider AS ENUM ('local', 'google', 'github', 'azure', 'keycloak', 'saml', 'oauth2');
CREATE TYPE api_key_status AS ENUM ('active', 'revoked', 'expired', 'suspended');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE mfa_type AS ENUM ('totp', 'sms', 'email', 'webauthn');

-- ============================================================================
-- API_KEYS TABLE
-- API key management with advanced security features
-- ============================================================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID, -- Will reference organizations table
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Key information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of the actual key
    prefix VARCHAR(10) NOT NULL, -- Key prefix for identification (e.g., 'rtm_')
    last_characters VARCHAR(4) NOT NULL, -- Last 4 characters for identification

    -- Permissions and scopes
    permissions JSONB DEFAULT '["read", "write"]',
    scopes JSONB DEFAULT '[]', -- Specific API endpoints or resources
    allowed_methods TEXT[] DEFAULT ARRAY['GET', 'POST', 'PUT', 'DELETE'],

    -- Security restrictions
    ip_whitelist INET[], -- Array of allowed IP addresses
    allowed_domains TEXT[], -- Allowed domains for CORS
    allowed_origins TEXT[], -- Specific allowed origins
    user_agent_pattern VARCHAR(255), -- Regex pattern for user agent validation

    -- Rate limiting
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    rate_limit_window VARCHAR(20) DEFAULT '1h', -- Time window for rate limiting
    burst_limit INTEGER DEFAULT 100, -- Maximum burst requests

    -- Usage tracking
    request_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    last_used_user_agent TEXT,

    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,
    status api_key_status DEFAULT 'active',
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revoked_reason TEXT,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_api_keys_user_id (user_id),
    INDEX idx_api_keys_organization_id (organization_id),
    INDEX idx_api_keys_prefix (prefix),
    INDEX idx_api_keys_status (status),
    INDEX idx_api_keys_expires_at (expires_at),
    INDEX idx_api_keys_created_at (created_at)
);

-- ============================================================================
-- SESSIONS TABLE
-- User session management with device tracking
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token information
    session_token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE,
    csrf_token_hash VARCHAR(255),

    -- Device and location information
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{
        "type": null,
        "os": null,
        "browser": null,
        "version": null,
        "isMobile": false
    }',

    -- Geolocation (optional, for security alerts)
    location JSONB DEFAULT '{
        "country": null,
        "city": null,
        "region": null,
        "timezone": null
    }',

    -- Session metadata
    login_method auth_provider DEFAULT 'local',
    mfa_verified BOOLEAN DEFAULT FALSE,
    remember_me BOOLEAN DEFAULT FALSE,

    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    idle_timeout INTEGER DEFAULT 1800, -- Seconds of inactivity before timeout
    absolute_timeout INTEGER DEFAULT 86400, -- Maximum session duration in seconds

    -- Activity tracking
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activity_count INTEGER DEFAULT 1,

    -- Status
    status session_status DEFAULT 'active',
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_status (status),
    INDEX idx_sessions_expires_at (expires_at),
    INDEX idx_sessions_last_activity (last_activity)
);

-- ============================================================================
-- OAUTH_PROVIDERS TABLE
-- OAuth provider connections for users
-- ============================================================================

CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Provider information
    provider auth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),

    -- Token storage (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    token_scope TEXT,

    -- Provider-specific data
    profile_data JSONB DEFAULT '{}',
    raw_data JSONB DEFAULT '{}',

    -- Connection status
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(provider, provider_user_id),
    UNIQUE(user_id, provider),

    -- Indexes
    INDEX idx_oauth_providers_user_id (user_id),
    INDEX idx_oauth_providers_provider (provider),
    INDEX idx_oauth_providers_provider_email (provider_email)
);

-- ============================================================================
-- MFA_DEVICES TABLE
-- Multi-factor authentication devices
-- ============================================================================

CREATE TABLE mfa_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Device information
    name VARCHAR(255) NOT NULL,
    type mfa_type NOT NULL,

    -- Secret storage (encrypted)
    secret TEXT, -- TOTP secret or device-specific data
    backup_codes TEXT[], -- Encrypted backup codes

    -- Device metadata
    phone_number VARCHAR(50), -- For SMS MFA
    email VARCHAR(255), -- For email MFA
    device_data JSONB DEFAULT '{}', -- WebAuthn or device-specific data

    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 0,

    -- Status
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_mfa_devices_user_id (user_id),
    INDEX idx_mfa_devices_type (type),
    INDEX idx_mfa_devices_is_primary (is_primary)
);

-- ============================================================================
-- AUTH_LOGS TABLE
-- Authentication event logging
-- ============================================================================

CREATE TABLE auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Event information
    event_type VARCHAR(50) NOT NULL, -- login, logout, failed_login, password_reset, etc.
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,

    -- Authentication details
    auth_method auth_provider,
    mfa_used BOOLEAN DEFAULT FALSE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Request information
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    request_id VARCHAR(255),

    -- Location and device
    location JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',

    -- Risk assessment
    risk_score INTEGER DEFAULT 0, -- 0-100 risk score
    risk_factors JSONB DEFAULT '[]',
    is_suspicious BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_auth_logs_user_id (user_id),
    INDEX idx_auth_logs_event_type (event_type),
    INDEX idx_auth_logs_created_at (created_at),
    INDEX idx_auth_logs_ip_address (ip_address),
    INDEX idx_auth_logs_is_suspicious (is_suspicious)
);

-- ============================================================================
-- PASSWORD_HISTORY TABLE
-- Track password changes for security
-- ============================================================================

CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Password hash (to prevent reuse)
    password_hash VARCHAR(255) NOT NULL,

    -- Change metadata
    changed_by UUID REFERENCES users(id),
    change_reason VARCHAR(255),
    ip_address INET,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_password_history_user_id (user_id),
    INDEX idx_password_history_created_at (created_at)
);

-- ============================================================================
-- KEYCLOAK_MAPPINGS TABLE
-- Map Keycloak entities to local database
-- ============================================================================

CREATE TABLE keycloak_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Keycloak identifiers
    realm VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    keycloak_user_id VARCHAR(255),
    keycloak_group_id VARCHAR(255),
    keycloak_role VARCHAR(255),

    -- Local references
    local_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    local_organization_id UUID, -- Will reference organizations table
    local_role VARCHAR(50),

    -- Sync status
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error TEXT,

    -- Metadata
    attributes JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(realm, keycloak_user_id),

    -- Indexes
    INDEX idx_keycloak_mappings_realm (realm),
    INDEX idx_keycloak_mappings_local_user_id (local_user_id)
);

-- ============================================================================
-- REFRESH_TOKENS TABLE
-- Separate table for refresh token management
-- ============================================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

    -- Token information
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    family VARCHAR(255), -- Token family for rotation detection

    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by UUID REFERENCES refresh_tokens(id),

    -- Security
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_refresh_tokens_user_id (user_id),
    INDEX idx_refresh_tokens_session_id (session_id),
    INDEX idx_refresh_tokens_family (family),
    INDEX idx_refresh_tokens_expires_at (expires_at)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET status = 'expired'
    WHERE expires_at < CURRENT_TIMESTAMP AND status = 'active';

    DELETE FROM sessions
    WHERE status = 'expired' AND expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to track API key usage
CREATE OR REPLACE FUNCTION track_api_key_usage() RETURNS TRIGGER AS $$
BEGIN
    UPDATE api_keys
    SET request_count = request_count + 1,
        last_used_at = CURRENT_TIMESTAMP
    WHERE id = NEW.api_key_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auth table updates
CREATE TRIGGER update_oauth_providers_updated_at BEFORE UPDATE ON oauth_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_devices_updated_at BEFORE UPDATE ON mfa_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keycloak_mappings_updated_at BEFORE UPDATE ON keycloak_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();