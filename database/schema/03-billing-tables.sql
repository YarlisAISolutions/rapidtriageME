-- ============================================================================
-- Billing & Subscription Tables Schema for RapidTriageME
-- ============================================================================
-- Comprehensive billing system with usage tracking, invoicing, and Stripe integration
-- Supports multiple pricing models: flat-rate, usage-based, and hybrid
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise', 'custom');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired', 'paused', 'pending');
CREATE TYPE billing_period AS ENUM ('monthly', 'quarterly', 'yearly', 'lifetime');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');
CREATE TYPE transaction_type AS ENUM ('payment', 'refund', 'credit', 'debit', 'adjustment', 'chargeback');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'void', 'uncollectible');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR');

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE
-- Define available subscription plans and their features
-- ============================================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    tier subscription_tier NOT NULL,
    description TEXT,

    -- Pricing
    price_monthly DECIMAL(10, 2),
    price_quarterly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    setup_fee DECIMAL(10, 2) DEFAULT 0,
    currency currency_code DEFAULT 'USD',

    -- Trial configuration
    trial_days INTEGER DEFAULT 0,
    trial_features JSONB DEFAULT '{}',

    -- Features and limits
    features JSONB NOT NULL DEFAULT '{
        "api_calls_per_day": 100,
        "api_calls_per_month": 3000,
        "api_keys": 1,
        "team_members": 1,
        "projects": 1,
        "log_retention_days": 7,
        "storage_gb": 1,
        "bandwidth_gb": 10,
        "custom_domains": false,
        "white_label": false,
        "sso": false,
        "audit_logs": false,
        "priority_support": false,
        "sla": false,
        "dedicated_account_manager": false
    }',

    -- Rate limits
    rate_limits JSONB DEFAULT '{
        "requests_per_second": 10,
        "requests_per_minute": 100,
        "requests_per_hour": 1000,
        "concurrent_connections": 10
    }',

    -- Stripe integration
    stripe_product_id VARCHAR(255),
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_quarterly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),

    -- Plan configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE, -- Visible on pricing page
    is_recommended BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    badge_text VARCHAR(50), -- e.g., "Most Popular", "Best Value"

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_subscription_plans_slug (slug),
    INDEX idx_subscription_plans_tier (tier),
    INDEX idx_subscription_plans_is_active (is_active)
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- Active subscriptions for users and organizations
-- ============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID, -- Will reference organizations table
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    -- Subscription details
    status subscription_status DEFAULT 'trialing',
    billing_period billing_period DEFAULT 'monthly',
    quantity INTEGER DEFAULT 1, -- For seat-based pricing

    -- Stripe integration
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_payment_method_id VARCHAR(255),

    -- Billing cycle
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancellation_feedback JSONB DEFAULT '{}',

    -- Pause functionality
    paused_at TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    resume_at TIMESTAMP WITH TIME ZONE,

    -- Usage limits override
    custom_limits JSONB DEFAULT '{}',

    -- Discount
    coupon_id UUID, -- References coupons table
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    discount_end_date TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_subscriptions_user_id (user_id),
    INDEX idx_subscriptions_organization_id (organization_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_stripe_customer_id (stripe_customer_id),
    INDEX idx_subscriptions_current_period_end (current_period_end)
);

-- ============================================================================
-- USAGE_METRICS TABLE
-- Track all usage for billing purposes
-- ============================================================================

CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID, -- Will reference organizations table
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,

    -- Metric information
    metric_type VARCHAR(50) NOT NULL, -- api_call, storage, bandwidth, audit, screenshot, etc.
    metric_name VARCHAR(100), -- Specific API endpoint or resource
    quantity DECIMAL(20, 4) DEFAULT 1,
    unit VARCHAR(20), -- requests, bytes, seconds, etc.

    -- Cost calculation
    unit_price DECIMAL(10, 6) DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    currency currency_code DEFAULT 'USD',

    -- Context
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    resource_id VARCHAR(255), -- ID of the resource being tracked
    metadata JSONB DEFAULT '{}',

    -- Request details (for API calls)
    request_method VARCHAR(10),
    request_path TEXT,
    response_status INTEGER,
    response_time_ms INTEGER,
    ip_address INET,

    -- Billing period
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date DATE DEFAULT CURRENT_DATE,

    -- Indexes
    INDEX idx_usage_metrics_user_id (user_id),
    INDEX idx_usage_metrics_organization_id (organization_id),
    INDEX idx_usage_metrics_subscription_id (subscription_id),
    INDEX idx_usage_metrics_metric_type (metric_type),
    INDEX idx_usage_metrics_date (date),
    INDEX idx_usage_metrics_timestamp (timestamp)
);

-- ============================================================================
-- INVOICES TABLE
-- Invoice management
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    organization_id UUID, -- Will reference organizations table
    subscription_id UUID REFERENCES subscriptions(id),

    -- Invoice details
    status invoice_status DEFAULT 'draft',
    currency currency_code DEFAULT 'USD',

    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    balance_due DECIMAL(10, 2),

    -- Billing information
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address JSONB DEFAULT '{}',
    tax_id VARCHAR(50),

    -- Stripe integration
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Period
    period_start DATE,
    period_end DATE,

    -- Line items stored as JSONB
    line_items JSONB DEFAULT '[]',

    -- Payment details
    payment_method VARCHAR(50),
    payment_details JSONB DEFAULT '{}',

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    voided_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_invoices_user_id (user_id),
    INDEX idx_invoices_organization_id (organization_id),
    INDEX idx_invoices_subscription_id (subscription_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_issue_date (issue_date),
    INDEX idx_invoices_due_date (due_date)
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- Payment transactions and financial records
-- ============================================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID, -- Will reference organizations table
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Transaction details
    type transaction_type NOT NULL,
    status payment_status DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency currency_code DEFAULT 'USD',

    -- Payment method
    payment_method VARCHAR(50), -- card, bank_transfer, paypal, etc.
    payment_method_details JSONB DEFAULT '{}', -- Last 4 digits, bank name, etc.

    -- Stripe integration
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    stripe_refund_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),

    -- Gateway response
    gateway_response JSONB DEFAULT '{}',
    gateway_reference VARCHAR(255),

    -- Fees
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2),

    -- Description
    description TEXT,
    reference_number VARCHAR(100),

    -- Related transactions (for refunds, chargebacks)
    parent_transaction_id UUID REFERENCES transactions(id),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_organization_id (organization_id),
    INDEX idx_transactions_subscription_id (subscription_id),
    INDEX idx_transactions_invoice_id (invoice_id),
    INDEX idx_transactions_type (type),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_created_at (created_at)
);

-- ============================================================================
-- COUPONS TABLE
-- Discount coupons and promotional codes
-- ============================================================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
    discount_value DECIMAL(10, 2) NOT NULL,
    currency currency_code DEFAULT 'USD',

    -- Applicability
    applicable_plans TEXT[], -- Array of plan slugs
    minimum_amount DECIMAL(10, 2),
    first_time_only BOOLEAN DEFAULT FALSE,

    -- Usage limits
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,

    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_is_active (is_active),
    INDEX idx_coupons_valid_until (valid_until)
);

-- ============================================================================
-- PAYMENT_METHODS TABLE
-- Stored payment methods for users
-- ============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID, -- Will reference organizations table

    -- Method details
    type VARCHAR(50) NOT NULL, -- card, bank_account, paypal
    is_default BOOLEAN DEFAULT FALSE,

    -- Card details (encrypted/tokenized)
    card_brand VARCHAR(20), -- visa, mastercard, amex
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_holder_name VARCHAR(255),

    -- Bank details (encrypted/tokenized)
    bank_name VARCHAR(255),
    bank_last4 VARCHAR(4),
    bank_routing_number VARCHAR(20),

    -- Billing address
    billing_address JSONB DEFAULT '{}',

    -- Stripe integration
    stripe_payment_method_id VARCHAR(255),
    stripe_source_id VARCHAR(255),

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_payment_methods_user_id (user_id),
    INDEX idx_payment_methods_organization_id (organization_id),
    INDEX idx_payment_methods_is_default (is_default)
);

-- ============================================================================
-- BILLING_EVENTS TABLE
-- Audit trail for all billing-related events
-- ============================================================================

CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID,
    subscription_id UUID REFERENCES subscriptions(id),

    -- Event details
    event_type VARCHAR(100) NOT NULL, -- subscription_created, payment_succeeded, etc.
    event_source VARCHAR(50), -- stripe, admin, system
    event_data JSONB DEFAULT '{}',

    -- Related entities
    invoice_id UUID REFERENCES invoices(id),
    transaction_id UUID REFERENCES transactions(id),

    -- Webhook data
    webhook_id VARCHAR(255),
    webhook_payload JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_billing_events_user_id (user_id),
    INDEX idx_billing_events_subscription_id (subscription_id),
    INDEX idx_billing_events_event_type (event_type),
    INDEX idx_billing_events_created_at (created_at)
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate usage costs
CREATE OR REPLACE FUNCTION calculate_usage_cost() RETURNS TRIGGER AS $$
DECLARE
    v_unit_price DECIMAL(10, 6);
BEGIN
    -- Get unit price based on metric type and subscription
    SELECT
        CASE NEW.metric_type
            WHEN 'api_call' THEN 0.0001
            WHEN 'storage' THEN 0.10 -- per GB
            WHEN 'bandwidth' THEN 0.08 -- per GB
            ELSE 0
        END INTO v_unit_price;

    NEW.unit_price = v_unit_price;
    NEW.total_cost = NEW.quantity * v_unit_price;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_usage_cost_trigger
    BEFORE INSERT ON usage_metrics
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usage_cost();

-- Function to update invoice balance
CREATE OR REPLACE FUNCTION update_invoice_balance() RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_due = NEW.total_amount - NEW.paid_amount;

    IF NEW.balance_due <= 0 THEN
        NEW.status = 'paid';
        NEW.paid_at = CURRENT_TIMESTAMP;
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partially_paid';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_balance_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount)
    EXECUTE FUNCTION update_invoice_balance();

-- Update triggers for timestamp management
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA - Subscription Plans
-- ============================================================================

INSERT INTO subscription_plans (name, slug, tier, price_monthly, price_yearly, features, trial_days) VALUES
('Free', 'free', 'free', 0, 0, '{
    "api_calls_per_day": 100,
    "api_calls_per_month": 3000,
    "api_keys": 1,
    "team_members": 1,
    "projects": 1,
    "log_retention_days": 7,
    "storage_gb": 1,
    "bandwidth_gb": 10
}', 0),
('Starter', 'starter', 'starter', 29, 290, '{
    "api_calls_per_day": 1000,
    "api_calls_per_month": 30000,
    "api_keys": 3,
    "team_members": 3,
    "projects": 3,
    "log_retention_days": 30,
    "storage_gb": 10,
    "bandwidth_gb": 100,
    "custom_domains": true
}', 14),
('Pro', 'pro', 'pro', 99, 990, '{
    "api_calls_per_day": 5000,
    "api_calls_per_month": 150000,
    "api_keys": 10,
    "team_members": 10,
    "projects": 10,
    "log_retention_days": 90,
    "storage_gb": 50,
    "bandwidth_gb": 500,
    "custom_domains": true,
    "white_label": true,
    "sso": true,
    "audit_logs": true,
    "priority_support": true
}', 14),
('Enterprise', 'enterprise', 'enterprise', 499, 4990, '{
    "api_calls_per_day": -1,
    "api_calls_per_month": -1,
    "api_keys": -1,
    "team_members": -1,
    "projects": -1,
    "log_retention_days": 365,
    "storage_gb": 500,
    "bandwidth_gb": 5000,
    "custom_domains": true,
    "white_label": true,
    "sso": true,
    "audit_logs": true,
    "priority_support": true,
    "sla": true,
    "dedicated_account_manager": true
}', 30);