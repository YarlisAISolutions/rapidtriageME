-- ============================================================================
-- Workspace Tables Schema for RapidTriageME
-- ============================================================================
-- Hierarchical workspace management for organizing projects and resources
-- Supports nested workspaces, cross-workspace collaboration, and templates
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE workspace_type AS ENUM ('personal', 'team', 'department', 'company', 'client', 'template');
CREATE TYPE workspace_visibility AS ENUM ('private', 'team', 'organization', 'public');
CREATE TYPE workspace_status AS ENUM ('active', 'archived', 'template', 'deleted');
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'contributor', 'viewer');
CREATE TYPE link_type AS ENUM ('parent_child', 'related', 'dependency', 'reference', 'clone');

-- ============================================================================
-- WORKSPACES TABLE
-- Core workspace entity for grouping projects
-- ============================================================================

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workspace identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,

    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Hierarchy
    parent_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    root_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 0,
    hierarchy_path TEXT[], -- Array of workspace IDs from root to current

    -- Configuration
    type workspace_type DEFAULT 'team',
    visibility workspace_visibility DEFAULT 'team',
    status workspace_status DEFAULT 'active',

    -- Branding
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex color
    cover_image_url TEXT,
    theme JSONB DEFAULT '{
        "primary": "#667eea",
        "secondary": "#764ba2",
        "background": "#ffffff",
        "surface": "#f5f5f5"
    }',

    -- Settings
    settings JSONB DEFAULT '{
        "auto_archive_days": null,
        "default_project_visibility": "workspace",
        "allow_guest_access": false,
        "require_approval": false,
        "inherit_parent_settings": true,
        "default_permissions": {},
        "notifications": {
            "new_project": true,
            "member_joined": true,
            "status_change": true
        }
    }',

    -- Limits (can override organization limits)
    limits JSONB DEFAULT '{
        "max_projects": 100,
        "max_members": 50,
        "max_storage_gb": 100,
        "max_sub_workspaces": 10
    }',

    -- Statistics
    project_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    sub_workspace_count INTEGER DEFAULT 0,
    total_storage_bytes BIGINT DEFAULT 0,

    -- Templates
    is_template BOOLEAN DEFAULT FALSE,
    template_category VARCHAR(100),
    template_usage_count INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(organization_id, slug),
    CONSTRAINT check_hierarchy CHECK (parent_workspace_id != id),

    -- Indexes
    INDEX idx_workspaces_owner_id (owner_id),
    INDEX idx_workspaces_organization_id (organization_id),
    INDEX idx_workspaces_parent_workspace_id (parent_workspace_id),
    INDEX idx_workspaces_slug (slug),
    INDEX idx_workspaces_type (type),
    INDEX idx_workspaces_status (status),
    INDEX idx_workspaces_is_template (is_template),
    INDEX idx_workspaces_hierarchy_path (hierarchy_path) USING GIN
);

-- ============================================================================
-- WORKSPACE_MEMBERS TABLE
-- Workspace membership and permissions
-- ============================================================================

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role and permissions
    role workspace_role NOT NULL DEFAULT 'viewer',
    custom_permissions JSONB DEFAULT '{
        "create_project": false,
        "delete_project": false,
        "manage_members": false,
        "manage_settings": false,
        "create_sub_workspace": false,
        "export_data": false
    }',

    -- Invitation tracking
    invited_by UUID REFERENCES users(id),
    invitation_message TEXT,

    -- Access control
    can_create_projects BOOLEAN DEFAULT FALSE,
    can_invite_members BOOLEAN DEFAULT FALSE,
    can_manage_workspace BOOLEAN DEFAULT FALSE,

    -- Activity
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(workspace_id, user_id),

    -- Indexes
    INDEX idx_workspace_members_workspace_id (workspace_id),
    INDEX idx_workspace_members_user_id (user_id),
    INDEX idx_workspace_members_role (role),
    INDEX idx_workspace_members_is_active (is_active)
);

-- ============================================================================
-- WORKSPACE_PROJECTS TABLE
-- Projects within workspaces
-- ============================================================================

CREATE TABLE workspace_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Project organization
    folder_path TEXT[], -- Virtual folder structure within workspace
    display_order INTEGER DEFAULT 0,

    -- Project settings within workspace
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,

    -- Access control
    visibility workspace_visibility DEFAULT 'workspace',
    inherit_workspace_permissions BOOLEAN DEFAULT TRUE,
    custom_permissions JSONB DEFAULT '{}',

    -- Project metadata
    tags TEXT[],
    labels JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',

    -- Statistics
    last_activity_at TIMESTAMP WITH TIME ZONE,
    activity_count INTEGER DEFAULT 0,

    -- Timestamps
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(workspace_id, project_id),

    -- Indexes
    INDEX idx_workspace_projects_workspace_id (workspace_id),
    INDEX idx_workspace_projects_project_id (project_id),
    INDEX idx_workspace_projects_is_pinned (is_pinned),
    INDEX idx_workspace_projects_is_archived (is_archived),
    INDEX idx_workspace_projects_folder_path (folder_path) USING GIN
);

-- ============================================================================
-- WORKSPACE_LINKS TABLE
-- Relationships between workspaces and projects
-- ============================================================================

CREATE TABLE workspace_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source and target
    source_workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    source_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    target_workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    target_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Link configuration
    link_type link_type NOT NULL,
    is_bidirectional BOOLEAN DEFAULT FALSE,

    -- Link metadata
    title VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Permissions
    requires_permission BOOLEAN DEFAULT TRUE,
    permission_level workspace_role DEFAULT 'viewer',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_link_source CHECK (
        (source_workspace_id IS NOT NULL OR source_project_id IS NOT NULL)
    ),
    CONSTRAINT check_link_target CHECK (
        (target_workspace_id IS NOT NULL OR target_project_id IS NOT NULL)
    ),
    CONSTRAINT check_not_self_link CHECK (
        NOT (source_workspace_id = target_workspace_id AND source_project_id = target_project_id)
    ),

    -- Indexes
    INDEX idx_workspace_links_source_workspace (source_workspace_id),
    INDEX idx_workspace_links_source_project (source_project_id),
    INDEX idx_workspace_links_target_workspace (target_workspace_id),
    INDEX idx_workspace_links_target_project (target_project_id),
    INDEX idx_workspace_links_link_type (link_type)
);

-- ============================================================================
-- WORKSPACE_TEMPLATES TABLE
-- Reusable workspace templates
-- ============================================================================

CREATE TABLE workspace_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Template source
    source_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

    -- Template structure
    structure JSONB NOT NULL DEFAULT '{
        "folders": [],
        "projects": [],
        "settings": {},
        "permissions": {},
        "workflows": []
    }',

    -- Template configuration
    variables JSONB DEFAULT '[]', -- Variables to be filled when creating from template
    requirements JSONB DEFAULT '{}', -- Required features, integrations, etc.

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Usage
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,

    -- Author
    created_by UUID NOT NULL REFERENCES users(id),

    -- Metadata
    tags TEXT[],
    preview_images JSONB DEFAULT '[]',
    documentation_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_workspace_templates_slug (slug),
    INDEX idx_workspace_templates_category (category),
    INDEX idx_workspace_templates_is_public (is_public),
    INDEX idx_workspace_templates_organization_id (organization_id)
);

-- ============================================================================
-- WORKSPACE_ACTIVITY_LOG TABLE
-- Track workspace activities
-- ============================================================================

CREATE TABLE workspace_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Activity details
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- created, updated, archived, member_added, project_added, etc.
    entity_type VARCHAR(50), -- workspace, project, member, setting
    entity_id VARCHAR(255),

    -- Changes
    old_value JSONB,
    new_value JSONB,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_workspace_activity_workspace_id (workspace_id),
    INDEX idx_workspace_activity_user_id (user_id),
    INDEX idx_workspace_activity_action (action),
    INDEX idx_workspace_activity_created_at (created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for activity logs (monthly)
CREATE TABLE workspace_activity_log_2024_01 PARTITION OF workspace_activity_log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- WORKSPACE_FAVORITES TABLE
-- User's favorite workspaces and projects
-- ============================================================================

CREATE TABLE workspace_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Favorited item
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Favorite configuration
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7), -- Custom color for quick identification
    alias VARCHAR(100), -- Custom name for the favorite

    -- Quick access
    is_pinned BOOLEAN DEFAULT FALSE,
    show_in_sidebar BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_favorite_target CHECK (
        (workspace_id IS NOT NULL AND project_id IS NULL) OR
        (workspace_id IS NULL AND project_id IS NOT NULL)
    ),
    UNIQUE(user_id, workspace_id),
    UNIQUE(user_id, project_id),

    -- Indexes
    INDEX idx_workspace_favorites_user_id (user_id),
    INDEX idx_workspace_favorites_workspace_id (workspace_id),
    INDEX idx_workspace_favorites_project_id (project_id),
    INDEX idx_workspace_favorites_is_pinned (is_pinned)
);

-- ============================================================================
-- WORKSPACE_INTEGRATIONS TABLE
-- Third-party integrations at workspace level
-- ============================================================================

CREATE TABLE workspace_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Integration details
    integration_type VARCHAR(100) NOT NULL, -- github, gitlab, jira, slack, teams, etc.
    integration_name VARCHAR(255) NOT NULL,

    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT, -- Encrypted credentials
    webhook_url TEXT,
    webhook_secret TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50),
    error_message TEXT,

    -- Permissions
    scopes TEXT[],

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_workspace_integrations_workspace_id (workspace_id),
    INDEX idx_workspace_integrations_type (integration_type),
    INDEX idx_workspace_integrations_is_active (is_active)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update workspace hierarchy
CREATE OR REPLACE FUNCTION update_workspace_hierarchy() RETURNS TRIGGER AS $$
DECLARE
    v_parent_level INTEGER;
    v_parent_path TEXT[];
    v_root_id UUID;
BEGIN
    IF NEW.parent_workspace_id IS NOT NULL THEN
        -- Get parent's hierarchy information
        SELECT hierarchy_level, hierarchy_path, COALESCE(root_workspace_id, id)
        INTO v_parent_level, v_parent_path, v_root_id
        FROM workspaces
        WHERE id = NEW.parent_workspace_id;

        -- Update hierarchy fields
        NEW.hierarchy_level = v_parent_level + 1;
        NEW.hierarchy_path = array_append(v_parent_path, NEW.parent_workspace_id::TEXT);
        NEW.root_workspace_id = v_root_id;
    ELSE
        -- This is a root workspace
        NEW.hierarchy_level = 0;
        NEW.hierarchy_path = ARRAY[]::TEXT[];
        NEW.root_workspace_id = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_hierarchy_trigger
    BEFORE INSERT OR UPDATE OF parent_workspace_id ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_workspace_hierarchy();

-- Function to update workspace statistics
CREATE OR REPLACE FUNCTION update_workspace_stats() RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'workspace_projects' THEN
        UPDATE workspaces
        SET project_count = (
            SELECT COUNT(*)
            FROM workspace_projects
            WHERE workspace_id = COALESCE(NEW.workspace_id, OLD.workspace_id)
            AND removed_at IS NULL
        )
        WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
    ELSIF TG_TABLE_NAME = 'workspace_members' THEN
        UPDATE workspaces
        SET member_count = (
            SELECT COUNT(*)
            FROM workspace_members
            WHERE workspace_id = COALESCE(NEW.workspace_id, OLD.workspace_id)
            AND is_active = TRUE
        )
        WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_project_stats
    AFTER INSERT OR UPDATE OR DELETE ON workspace_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_workspace_stats();

CREATE TRIGGER update_workspace_member_stats
    AFTER INSERT OR UPDATE OR DELETE ON workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION update_workspace_stats();

-- Function to prevent circular workspace hierarchy
CREATE OR REPLACE FUNCTION prevent_circular_hierarchy() RETURNS TRIGGER AS $$
DECLARE
    v_current_id UUID;
BEGIN
    IF NEW.parent_workspace_id IS NOT NULL THEN
        v_current_id := NEW.parent_workspace_id;

        -- Walk up the hierarchy to check for circular reference
        WHILE v_current_id IS NOT NULL LOOP
            IF v_current_id = NEW.id THEN
                RAISE EXCEPTION 'Circular workspace hierarchy detected';
            END IF;

            SELECT parent_workspace_id INTO v_current_id
            FROM workspaces
            WHERE id = v_current_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_hierarchy_trigger
    BEFORE UPDATE OF parent_workspace_id ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_hierarchy();

-- Update triggers for timestamps
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_templates_updated_at BEFORE UPDATE ON workspace_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_integrations_updated_at BEFORE UPDATE ON workspace_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA - Workspace Templates
-- ============================================================================

INSERT INTO workspace_templates (name, slug, category, description, structure, is_public) VALUES
('Web Development', 'web-dev', 'development', 'Standard web development workspace', '{
    "folders": ["src", "tests", "docs", "assets"],
    "projects": [
        {"name": "Frontend", "type": "react"},
        {"name": "Backend", "type": "nodejs"},
        {"name": "Database", "type": "postgresql"}
    ],
    "settings": {
        "default_branch": "main",
        "ci_cd": true
    }
}', TRUE),

('Marketing Campaign', 'marketing-campaign', 'marketing', 'Marketing campaign management', '{
    "folders": ["campaigns", "assets", "analytics", "reports"],
    "projects": [
        {"name": "Social Media", "type": "content"},
        {"name": "Email Marketing", "type": "automation"},
        {"name": "Analytics", "type": "dashboard"}
    ]
}', TRUE),

('Client Project', 'client-project', 'business', 'Client project management', '{
    "folders": ["requirements", "design", "development", "testing", "deployment"],
    "projects": [
        {"name": "Documentation", "type": "docs"},
        {"name": "Main Application", "type": "fullstack"},
        {"name": "Testing Suite", "type": "testing"}
    ]
}', TRUE);