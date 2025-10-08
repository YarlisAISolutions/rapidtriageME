-- ============================================================================
-- Core Tables Schema for RapidTriageME
-- ============================================================================
-- This schema supports multi-tenancy, project management, and user management
-- Compatible with PostgreSQL 13+ and can be adapted for MySQL/MariaDB
-- ============================================================================

-- Enable UUID extension if using PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS (PostgreSQL) - For MySQL, use CHECK constraints or separate tables
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'enterprise', 'support');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted', 'pending');
CREATE TYPE provider_type AS ENUM ('CLOUDFLARE', 'AWS', 'GOOGLE', 'AZURE', 'SELF_HOSTED');

-- ============================================================================
-- USERS TABLE
-- Core user management integrated with Keycloak
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keycloak_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,

    -- User preferences and settings
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_keycloak_id (keycloak_id),
    INDEX idx_users_status (status),
    INDEX idx_users_role (role),
    INDEX idx_users_created_at (created_at)
);

-- ============================================================================
-- PROJECTS TABLE
-- Support for multiple projects/applications per organization
-- ============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(100),
    logo_url TEXT,
    favicon_url TEXT,

    -- Theme configuration extracted from website
    theme JSONB DEFAULT '{
        "primary": "#667eea",
        "secondary": "#764ba2",
        "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "background": "#1e1e1e",
        "text": "#cccccc"
    }',

    -- Infrastructure configuration
    provider provider_type DEFAULT 'CLOUDFLARE',
    region VARCHAR(50),
    environment VARCHAR(50) DEFAULT 'production',

    -- Project settings and configuration
    description TEXT,
    settings JSONB DEFAULT '{
        "features": {
            "debugging": true,
            "auditing": true,
            "analytics": true,
            "collaboration": true
        },
        "integrations": {}
    }',

    -- API configuration
    api_endpoint VARCHAR(255),
    api_version VARCHAR(20) DEFAULT 'v1',

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_projects_slug (slug),
    INDEX idx_projects_domain (domain),
    INDEX idx_projects_provider (provider),
    INDEX idx_projects_created_at (created_at)
);

-- ============================================================================
-- USER_PREFERENCES TABLE
-- Extended user preferences and settings
-- ============================================================================

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification preferences
    email_notifications JSONB DEFAULT '{
        "security": true,
        "billing": true,
        "updates": true,
        "marketing": false,
        "reports": true
    }',

    -- UI preferences
    ui_preferences JSONB DEFAULT '{
        "theme": "dark",
        "language": "en",
        "dateFormat": "MM/DD/YYYY",
        "timeFormat": "12h",
        "compactView": false
    }',

    -- Feature preferences
    feature_flags JSONB DEFAULT '{}',

    -- API preferences
    default_api_version VARCHAR(20) DEFAULT 'v1',
    webhook_url TEXT,
    webhook_secret TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id)
);

-- ============================================================================
-- USER_PROFILES TABLE
-- Extended user profile information
-- ============================================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Professional information
    company VARCHAR(255),
    job_title VARCHAR(255),
    bio TEXT,
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),

    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    postal_code VARCHAR(20),
    state_province VARCHAR(100),

    -- Additional information
    skills TEXT[],
    interests TEXT[],
    certifications JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id)
);

-- ============================================================================
-- SYSTEM_SETTINGS TABLE
-- Global system configuration
-- ============================================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_system_settings_key (key),
    INDEX idx_system_settings_category (category)
);

-- ============================================================================
-- FEATURE_FLAGS TABLE
-- Feature flag management for gradual rollouts
-- ============================================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,

    -- Targeting rules
    rules JSONB DEFAULT '{
        "percentage": 0,
        "userIds": [],
        "organizationIds": [],
        "roles": [],
        "regions": []
    }',

    -- Configuration
    config JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    enabled_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_feature_flags_name (name),
    INDEX idx_feature_flags_enabled (enabled)
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode configuration', 'system', true),
('default_subscription_plan', '"free"', 'Default subscription plan for new users', 'billing', false),
('api_rate_limits', '{"free": 100, "pro": 5000, "enterprise": -1}', 'API rate limits per plan', 'api', true),
('supported_regions', '["us-east-1", "eu-west-1", "ap-southeast-1"]', 'Supported deployment regions', 'infrastructure', true),
('theme_defaults', '{"primary": "#667eea", "secondary": "#764ba2"}', 'Default theme colors', 'ui', true);

-- Insert default feature flags
INSERT INTO feature_flags (name, description, enabled) VALUES
('keycloak_sso', 'Enable Keycloak SSO authentication', false),
('stripe_billing', 'Enable Stripe billing integration', false),
('team_collaboration', 'Enable team collaboration features', false),
('advanced_analytics', 'Enable advanced analytics dashboard', false),
('api_v2', 'Enable API version 2', false);