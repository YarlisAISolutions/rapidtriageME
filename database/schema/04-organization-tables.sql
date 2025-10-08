-- ============================================================================
-- Organization & Team Tables Schema for RapidTriageME
-- ============================================================================
-- Multi-tenant organization structure with team collaboration features
-- Supports role-based access control, invitations, and resource sharing
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE organization_type AS ENUM ('personal', 'team', 'company', 'enterprise', 'non_profit', 'educational');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'developer', 'analyst', 'viewer', 'billing');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');
CREATE TYPE resource_type AS ENUM ('project', 'debug_session', 'report', 'dashboard', 'api_key', 'webhook', 'integration');
CREATE TYPE permission_level AS ENUM ('none', 'read', 'write', 'admin', 'owner');

-- ============================================================================
-- ORGANIZATIONS TABLE
-- Core organization/company entity
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type organization_type DEFAULT 'team',

    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    brand_color VARCHAR(7), -- Hex color
    website VARCHAR(255),

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    billing_email VARCHAR(255),
    support_email VARCHAR(255),

    -- Legal information
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    vat_number VARCHAR(50),
    registration_number VARCHAR(100),

    -- Address
    address JSONB DEFAULT '{
        "line1": null,
        "line2": null,
        "city": null,
        "state": null,
        "postal_code": null,
        "country": null
    }',

    -- Owner
    owner_id UUID NOT NULL REFERENCES users(id),

    -- Settings
    settings JSONB DEFAULT '{
        "require_2fa": false,
        "allowed_email_domains": [],
        "sso_enabled": false,
        "sso_provider": null,
        "ip_whitelist": [],
        "webhook_url": null,
        "slack_webhook": null,
        "auto_join_domains": [],
        "default_role": "viewer",
        "allow_api_key_creation": true,
        "max_api_keys_per_user": 5,
        "session_timeout_minutes": 480,
        "data_retention_days": 90
    }',

    -- Subscription reference
    subscription_id UUID REFERENCES subscriptions(id),

    -- Compliance
    compliance JSONB DEFAULT '{
        "gdpr": false,
        "hipaa": false,
        "soc2": false,
        "iso27001": false
    }',

    -- Metadata
    industry VARCHAR(100),
    size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-500, 501+
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_organizations_slug (slug),
    INDEX idx_organizations_owner_id (owner_id),
    INDEX idx_organizations_type (type),
    INDEX idx_organizations_created_at (created_at)
);

-- ============================================================================
-- TEAM_MEMBERS TABLE
-- Organization membership and roles
-- ============================================================================

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role and permissions
    role member_role NOT NULL DEFAULT 'viewer',
    custom_role_name VARCHAR(100),

    -- Granular permissions
    permissions JSONB DEFAULT '{
        "projects": {"create": false, "read": true, "update": false, "delete": false},
        "api_keys": {"create": false, "read": false, "update": false, "delete": false},
        "billing": {"view": false, "manage": false},
        "members": {"invite": false, "remove": false, "manage_roles": false},
        "settings": {"view": true, "edit": false},
        "analytics": {"view": true, "export": false},
        "audit_logs": {"view": false}
    }',

    -- Department/Team assignment
    department VARCHAR(100),
    team VARCHAR(100),
    title VARCHAR(255),

    -- Invitation tracking
    invited_by UUID REFERENCES users(id),
    invitation_id UUID, -- References team_invitations table
    joined_via VARCHAR(50), -- invitation, sso, admin_added, auto_join

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,

    -- Timestamps
    invited_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID REFERENCES users(id),
    removal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(organization_id, user_id),

    -- Indexes
    INDEX idx_team_members_organization_id (organization_id),
    INDEX idx_team_members_user_id (user_id),
    INDEX idx_team_members_role (role),
    INDEX idx_team_members_is_active (is_active)
);

-- ============================================================================
-- TEAM_INVITATIONS TABLE
-- Pending invitations to join organizations
-- ============================================================================

CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Invitee information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Invitation details
    role member_role NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    department VARCHAR(100),
    team VARCHAR(100),
    message TEXT,

    -- Token for invitation link
    token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Invitation tracking
    invited_by UUID NOT NULL REFERENCES users(id),
    status invitation_status DEFAULT 'pending',

    -- Limits
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,

    -- Response tracking
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id),
    declined_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_team_invitations_organization_id (organization_id),
    INDEX idx_team_invitations_email (email),
    INDEX idx_team_invitations_token (token),
    INDEX idx_team_invitations_status (status),
    INDEX idx_team_invitations_token_expires_at (token_expires_at)
);

-- ============================================================================
-- TEAMS TABLE
-- Sub-teams within organizations
-- ============================================================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Team information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,

    -- Team lead
    lead_user_id UUID REFERENCES users(id),

    -- Parent team (for hierarchical structure)
    parent_team_id UUID REFERENCES teams(id),

    -- Team settings
    settings JSONB DEFAULT '{
        "visibility": "organization", -- organization, public, private
        "allow_guest_access": false,
        "auto_add_members": false,
        "require_approval": false
    }',

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(organization_id, slug),

    -- Indexes
    INDEX idx_teams_organization_id (organization_id),
    INDEX idx_teams_slug (slug),
    INDEX idx_teams_lead_user_id (lead_user_id),
    INDEX idx_teams_parent_team_id (parent_team_id)
);

-- ============================================================================
-- TEAM_ASSIGNMENTS TABLE
-- Many-to-many relationship between users and teams
-- ============================================================================

CREATE TABLE team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

    -- Role within the team
    team_role VARCHAR(50) DEFAULT 'member', -- lead, member

    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    removed_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID REFERENCES users(id),

    -- Constraints
    UNIQUE(team_id, user_id),

    -- Indexes
    INDEX idx_team_assignments_team_id (team_id),
    INDEX idx_team_assignments_user_id (user_id),
    INDEX idx_team_assignments_team_member_id (team_member_id)
);

-- ============================================================================
-- SHARED_RESOURCES TABLE
-- Resources shared between team members or teams
-- ============================================================================

CREATE TABLE shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Resource identification
    resource_type resource_type NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    resource_name VARCHAR(255),
    resource_data JSONB DEFAULT '{}',

    -- Owner
    owner_id UUID NOT NULL REFERENCES users(id),
    owner_team_id UUID REFERENCES teams(id),

    -- Sharing configuration
    is_public BOOLEAN DEFAULT FALSE,
    public_access_level permission_level DEFAULT 'read',
    require_authentication BOOLEAN DEFAULT TRUE,

    -- Shared with specific users/teams
    shared_with_users UUID[] DEFAULT '{}',
    shared_with_teams UUID[] DEFAULT '{}',
    shared_with_roles member_role[] DEFAULT '{}',

    -- Permissions
    default_permission permission_level DEFAULT 'read',
    user_permissions JSONB DEFAULT '{}', -- {"user_id": "permission_level"}
    team_permissions JSONB DEFAULT '{}', -- {"team_id": "permission_level"}

    -- Access control
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    access_token VARCHAR(255) UNIQUE,

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,

    -- Metadata
    description TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_shared_resources_organization_id (organization_id),
    INDEX idx_shared_resources_resource_type (resource_type),
    INDEX idx_shared_resources_owner_id (owner_id),
    INDEX idx_shared_resources_is_public (is_public),
    INDEX idx_shared_resources_expires_at (expires_at)
);

-- ============================================================================
-- RESOURCE_ACCESS_LOGS TABLE
-- Track access to shared resources
-- ============================================================================

CREATE TABLE resource_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_resource_id UUID NOT NULL REFERENCES shared_resources(id) ON DELETE CASCADE,

    -- Accessor information
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,

    -- Access details
    action VARCHAR(50) NOT NULL, -- view, download, edit, delete
    permission_used permission_level,

    -- Context
    referrer TEXT,
    session_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_resource_access_logs_shared_resource_id (shared_resource_id),
    INDEX idx_resource_access_logs_user_id (user_id),
    INDEX idx_resource_access_logs_accessed_at (accessed_at)
);

-- ============================================================================
-- ORGANIZATION_PROJECTS TABLE
-- Projects owned by organizations
-- ============================================================================

CREATE TABLE organization_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Project role within organization
    is_primary BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Access control
    visibility VARCHAR(50) DEFAULT 'organization', -- organization, teams, public
    allowed_teams UUID[] DEFAULT '{}',
    allowed_roles member_role[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(organization_id, project_id),

    -- Indexes
    INDEX idx_organization_projects_organization_id (organization_id),
    INDEX idx_organization_projects_project_id (project_id)
);

-- ============================================================================
-- COLLABORATION_SESSIONS TABLE
-- Real-time collaboration sessions
-- ============================================================================

CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Session information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- debugging, review, planning, support

    -- Participants
    host_id UUID NOT NULL REFERENCES users(id),
    participants UUID[] DEFAULT '{}', -- Array of user IDs
    max_participants INTEGER DEFAULT 10,

    -- Session state
    is_active BOOLEAN DEFAULT TRUE,
    is_recording BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,

    -- Connection details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    websocket_url TEXT,
    webrtc_config JSONB DEFAULT '{}',

    -- Shared context
    shared_resource_id UUID REFERENCES shared_resources(id),
    shared_data JSONB DEFAULT '{}',

    -- Recording
    recording_url TEXT,
    recording_size_bytes BIGINT,
    transcript JSONB DEFAULT '[]',

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_collaboration_sessions_organization_id (organization_id),
    INDEX idx_collaboration_sessions_host_id (host_id),
    INDEX idx_collaboration_sessions_is_active (is_active),
    INDEX idx_collaboration_sessions_started_at (started_at)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate organization slug
CREATE OR REPLACE FUNCTION generate_organization_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug = LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_organization_slug_trigger
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION generate_organization_slug();

-- Function to handle team member removal
CREATE OR REPLACE FUNCTION handle_team_member_removal() RETURNS TRIGGER AS $$
BEGIN
    -- Remove from all team assignments
    UPDATE team_assignments
    SET removed_at = CURRENT_TIMESTAMP,
        removed_by = NEW.removed_by
    WHERE team_member_id = NEW.id;

    -- Revoke shared resources if needed
    -- Implementation depends on business logic

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_team_member_removal_trigger
    AFTER UPDATE ON team_members
    FOR EACH ROW
    WHEN (NEW.removed_at IS NOT NULL AND OLD.removed_at IS NULL)
    EXECUTE FUNCTION handle_team_member_removal();

-- Update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_resources_updated_at BEFORE UPDATE ON shared_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();