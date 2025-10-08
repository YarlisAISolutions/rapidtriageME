-- ============================================================================
-- Analytics Tables Schema for RapidTriageME
-- ============================================================================
-- Browser debugging sessions, performance metrics, reports, and dashboards
-- Supports real-time analytics, historical data, and custom visualizations
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE session_status AS ENUM ('initializing', 'active', 'paused', 'completed', 'failed', 'archived');
CREATE TYPE browser_type AS ENUM ('chrome', 'firefox', 'safari', 'edge', 'opera', 'other');
CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet', 'tv', 'watch', 'other');
CREATE TYPE report_type AS ENUM (
    'performance', 'accessibility', 'seo', 'security', 'best_practices',
    'lighthouse', 'comprehensive', 'custom', 'network', 'console'
);
CREATE TYPE audit_category AS ENUM (
    'performance', 'accessibility', 'best-practices', 'seo', 'pwa'
);
CREATE TYPE widget_type AS ENUM (
    'chart', 'metric', 'table', 'map', 'timeline', 'log', 'alert',
    'gauge', 'heatmap', 'funnel', 'sankey'
);

-- ============================================================================
-- DEBUG_SESSIONS TABLE
-- Browser debugging and monitoring sessions
-- ============================================================================

CREATE TABLE debug_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Session identification
    session_name VARCHAR(255),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    parent_session_id UUID REFERENCES debug_sessions(id), -- For nested sessions

    -- Target information
    url TEXT NOT NULL,
    domain VARCHAR(255),
    page_title VARCHAR(500),

    -- Browser information
    browser browser_type,
    browser_version VARCHAR(50),
    user_agent TEXT,
    device_type device_type,
    os VARCHAR(100),
    os_version VARCHAR(50),

    -- Viewport and display
    viewport_width INTEGER,
    viewport_height INTEGER,
    screen_width INTEGER,
    screen_height INTEGER,
    device_pixel_ratio DECIMAL(3,2),

    -- Session configuration
    config JSONB DEFAULT '{
        "capture_console": true,
        "capture_network": true,
        "capture_screenshots": true,
        "capture_performance": true,
        "capture_errors": true,
        "sample_rate": 1.0
    }',

    -- Status tracking
    status session_status DEFAULT 'initializing',
    error_message TEXT,

    -- Data collection
    console_logs JSONB DEFAULT '[]',
    console_log_count INTEGER DEFAULT 0,
    network_logs JSONB DEFAULT '[]',
    network_request_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    error_count INTEGER DEFAULT 0,

    -- Performance metrics
    performance_metrics JSONB DEFAULT '{
        "load_time": null,
        "dom_content_loaded": null,
        "first_paint": null,
        "first_contentful_paint": null,
        "largest_contentful_paint": null,
        "time_to_interactive": null,
        "total_blocking_time": null,
        "cumulative_layout_shift": null
    }',

    -- Resource usage
    memory_usage JSONB DEFAULT '{}',
    cpu_usage JSONB DEFAULT '{}',

    -- Screenshots
    screenshots JSONB DEFAULT '[]',
    screenshot_count INTEGER DEFAULT 0,
    video_url TEXT,

    -- Metadata
    tags TEXT[],
    labels JSONB DEFAULT '{}',
    custom_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_debug_sessions_user_id (user_id),
    INDEX idx_debug_sessions_organization_id (organization_id),
    INDEX idx_debug_sessions_project_id (project_id),
    INDEX idx_debug_sessions_session_token (session_token),
    INDEX idx_debug_sessions_status (status),
    INDEX idx_debug_sessions_url (url),
    INDEX idx_debug_sessions_started_at (started_at),
    INDEX idx_debug_sessions_domain (domain)
);

-- ============================================================================
-- REPORTS TABLE
-- Analysis reports and audit results
-- ============================================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    debug_session_id UUID REFERENCES debug_sessions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Report information
    name VARCHAR(255) NOT NULL,
    type report_type NOT NULL,
    description TEXT,

    -- Target
    url TEXT,
    domain VARCHAR(255),

    -- Overall scores
    score INTEGER CHECK (score >= 0 AND score <= 100),
    scores JSONB DEFAULT '{
        "performance": null,
        "accessibility": null,
        "best_practices": null,
        "seo": null,
        "pwa": null
    }',

    -- Detailed data
    data JSONB NOT NULL,
    metrics JSONB DEFAULT '{}',
    audits JSONB DEFAULT '{}',

    -- Issues and recommendations
    issues JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]', -- Performance opportunities
    diagnostics JSONB DEFAULT '[]',

    -- Configuration
    config JSONB DEFAULT '{}',
    threshold_settings JSONB DEFAULT '{
        "performance": 90,
        "accessibility": 90,
        "best_practices": 90,
        "seo": 90
    }',

    -- Comparison
    baseline_report_id UUID REFERENCES reports(id),
    comparison_data JSONB DEFAULT '{}',

    -- Status
    is_passed BOOLEAN,
    is_baseline BOOLEAN DEFAULT FALSE,

    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    public_url TEXT,
    share_token VARCHAR(255) UNIQUE,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_reports_user_id (user_id),
    INDEX idx_reports_organization_id (organization_id),
    INDEX idx_reports_debug_session_id (debug_session_id),
    INDEX idx_reports_type (type),
    INDEX idx_reports_created_at (created_at),
    INDEX idx_reports_is_public (is_public),
    INDEX idx_reports_share_token (share_token)
);

-- ============================================================================
-- DASHBOARDS TABLE
-- Custom analytics dashboards
-- ============================================================================

CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Dashboard information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),

    -- Layout configuration
    layout JSONB NOT NULL DEFAULT '{
        "type": "grid",
        "columns": 12,
        "row_height": 80,
        "widgets": []
    }',

    -- Data configuration
    data_sources JSONB DEFAULT '[]', -- API endpoints, queries, etc.
    refresh_interval INTEGER, -- Seconds between auto-refresh
    time_range VARCHAR(50) DEFAULT '24h', -- 1h, 24h, 7d, 30d, custom

    -- Filters
    global_filters JSONB DEFAULT '{}',
    filter_presets JSONB DEFAULT '[]',

    -- Theme
    theme JSONB DEFAULT '{
        "dark": false,
        "colors": {},
        "fonts": {}
    }',

    -- Permissions
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE, -- Default for organization
    is_template BOOLEAN DEFAULT FALSE, -- Can be cloned

    -- Sharing
    share_token VARCHAR(255) UNIQUE,
    shared_with_users UUID[] DEFAULT '{}',
    shared_with_teams UUID[] DEFAULT '{}',

    -- Metadata
    category VARCHAR(100),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Statistics
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(organization_id, slug),

    -- Indexes
    INDEX idx_dashboards_user_id (user_id),
    INDEX idx_dashboards_organization_id (organization_id),
    INDEX idx_dashboards_slug (slug),
    INDEX idx_dashboards_is_public (is_public),
    INDEX idx_dashboards_is_default (is_default)
);

-- ============================================================================
-- DASHBOARD_WIDGETS TABLE
-- Individual widgets on dashboards
-- ============================================================================

CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,

    -- Widget information
    name VARCHAR(255) NOT NULL,
    type widget_type NOT NULL,
    description TEXT,

    -- Layout position
    position JSONB NOT NULL DEFAULT '{
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
    }',

    -- Data configuration
    data_source JSONB NOT NULL, -- Query, API endpoint, etc.
    data_transform JSONB DEFAULT '{}', -- Transformations to apply
    refresh_interval INTEGER, -- Override dashboard refresh

    -- Visualization configuration
    config JSONB DEFAULT '{
        "chart_type": null,
        "axes": {},
        "legend": {},
        "colors": [],
        "thresholds": []
    }',

    -- Interactivity
    interactions JSONB DEFAULT '{
        "clickable": true,
        "hoverable": true,
        "drilldown": null
    }',

    -- Alerts
    alert_rules JSONB DEFAULT '[]',
    alert_enabled BOOLEAN DEFAULT FALSE,

    -- Display options
    show_title BOOLEAN DEFAULT TRUE,
    show_border BOOLEAN DEFAULT TRUE,
    custom_css TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_dashboard_widgets_dashboard_id (dashboard_id),
    INDEX idx_dashboard_widgets_type (type)
);

-- ============================================================================
-- METRICS TABLE
-- Time-series metrics data
-- ============================================================================

CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Metric identification
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50), -- ms, bytes, percentage, count, etc.

    -- Value
    value DECIMAL(20, 4) NOT NULL,
    min_value DECIMAL(20, 4),
    max_value DECIMAL(20, 4),
    avg_value DECIMAL(20, 4),
    percentile_95 DECIMAL(20, 4),
    percentile_99 DECIMAL(20, 4),

    -- Context
    source VARCHAR(100), -- api, browser, server, synthetic
    environment VARCHAR(50), -- production, staging, development
    region VARCHAR(50),

    -- Dimensions (for grouping/filtering)
    dimensions JSONB DEFAULT '{}',

    -- Tags for categorization
    tags TEXT[],

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_metrics_organization_id (organization_id),
    INDEX idx_metrics_project_id (project_id),
    INDEX idx_metrics_name (name),
    INDEX idx_metrics_category (category),
    INDEX idx_metrics_timestamp (timestamp),
    INDEX idx_metrics_dimensions (dimensions) USING GIN
) PARTITION BY RANGE (timestamp);

-- Create partitions for metrics (daily)
CREATE TABLE metrics_2024_01_01 PARTITION OF metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-01-02');
-- Add more partitions as needed

-- ============================================================================
-- ALERTS TABLE
-- Alert configurations and history
-- ============================================================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Alert information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity risk_level DEFAULT 'medium',

    -- Alert condition
    metric_name VARCHAR(255),
    condition JSONB NOT NULL DEFAULT '{
        "operator": ">",
        "threshold": 0,
        "duration": 60,
        "frequency": "any"
    }',

    -- Actions
    actions JSONB DEFAULT '[
        {"type": "email", "recipients": []},
        {"type": "slack", "channel": null},
        {"type": "webhook", "url": null}
    ]',

    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    is_silenced BOOLEAN DEFAULT FALSE,
    silence_until TIMESTAMP WITH TIME ZONE,

    -- Statistics
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    last_resolved_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_alerts_organization_id (organization_id),
    INDEX idx_alerts_project_id (project_id),
    INDEX idx_alerts_is_enabled (is_enabled),
    INDEX idx_alerts_severity (severity)
);

-- ============================================================================
-- ALERT_HISTORY TABLE
-- Alert trigger history
-- ============================================================================

CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,

    -- Trigger information
    triggered_value DECIMAL(20, 4),
    threshold_value DECIMAL(20, 4),
    condition_met JSONB,

    -- Status
    status VARCHAR(50) DEFAULT 'triggered', -- triggered, acknowledged, resolved, expired
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    -- Actions taken
    actions_executed JSONB DEFAULT '[]',
    action_results JSONB DEFAULT '{}',

    -- Context
    context JSONB DEFAULT '{}',

    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_alert_history_alert_id (alert_id),
    INDEX idx_alert_history_status (status),
    INDEX idx_alert_history_triggered_at (triggered_at)
);

-- ============================================================================
-- USER_ACTIVITY TABLE
-- Track user activity for analytics
-- ============================================================================

CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Activity information
    action VARCHAR(100) NOT NULL, -- page_view, feature_use, api_call, etc.
    category VARCHAR(100),
    label VARCHAR(255),
    value DECIMAL(10, 2),

    -- Context
    page_url TEXT,
    referrer TEXT,
    ip_address INET,
    user_agent TEXT,

    -- Session tracking
    session_id VARCHAR(255),
    is_new_session BOOLEAN DEFAULT FALSE,

    -- Device and location
    device_info JSONB DEFAULT '{}',
    location JSONB DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_user_activity_user_id (user_id),
    INDEX idx_user_activity_organization_id (organization_id),
    INDEX idx_user_activity_action (action),
    INDEX idx_user_activity_session_id (session_id),
    INDEX idx_user_activity_created_at (created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for user activity (weekly)
CREATE TABLE user_activity_2024_w01 PARTITION OF user_activity
    FOR VALUES FROM ('2024-01-01') TO ('2024-01-08');
-- Add more partitions as needed

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_debug_session_duration
    BEFORE UPDATE ON debug_sessions
    FOR EACH ROW
    WHEN (NEW.ended_at IS NOT NULL)
    EXECUTE FUNCTION calculate_session_duration();

-- Function to increment dashboard view count
CREATE OR REPLACE FUNCTION increment_dashboard_views() RETURNS TRIGGER AS $$
BEGIN
    UPDATE dashboards
    SET view_count = view_count + 1,
        last_viewed_at = CURRENT_TIMESTAMP
    WHERE id = NEW.dashboard_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check alert conditions
CREATE OR REPLACE FUNCTION check_alert_condition(
    p_metric_value DECIMAL,
    p_condition JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_operator TEXT;
    v_threshold DECIMAL;
BEGIN
    v_operator := p_condition->>'operator';
    v_threshold := (p_condition->>'threshold')::DECIMAL;

    RETURN CASE v_operator
        WHEN '>' THEN p_metric_value > v_threshold
        WHEN '>=' THEN p_metric_value >= v_threshold
        WHEN '<' THEN p_metric_value < v_threshold
        WHEN '<=' THEN p_metric_value <= v_threshold
        WHEN '=' THEN p_metric_value = v_threshold
        WHEN '!=' THEN p_metric_value != v_threshold
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS for Performance
-- ============================================================================

-- Daily aggregated metrics
CREATE MATERIALIZED VIEW daily_metrics_summary AS
SELECT
    organization_id,
    project_id,
    name AS metric_name,
    DATE(timestamp) AS date,
    COUNT(*) AS data_points,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS median_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99_value
FROM metrics
GROUP BY organization_id, project_id, name, DATE(timestamp);

CREATE INDEX idx_daily_metrics_summary_date ON daily_metrics_summary (date);
CREATE INDEX idx_daily_metrics_summary_org_id ON daily_metrics_summary (organization_id);

-- User activity summary
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT
    user_id,
    organization_id,
    DATE(created_at) AS activity_date,
    COUNT(DISTINCT session_id) AS session_count,
    COUNT(*) AS action_count,
    ARRAY_AGG(DISTINCT action) AS actions_performed
FROM user_activity
GROUP BY user_id, organization_id, DATE(created_at);

CREATE INDEX idx_user_activity_summary_date ON user_activity_summary (activity_date);
CREATE INDEX idx_user_activity_summary_user_id ON user_activity_summary (user_id);