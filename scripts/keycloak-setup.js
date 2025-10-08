#!/usr/bin/env node

/**
 * Keycloak Automated Setup Script for RapidTriageME
 *
 * This script automatically configures Keycloak with:
 * - Dynamic realm creation based on project metadata
 * - Theme extraction from website colors
 * - Client configuration for multiple domains
 * - Identity providers (Google, GitHub, Azure AD)
 * - User roles and groups for subscription tiers
 *
 * Usage: node keycloak-setup.js [--env production|staging|development]
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

class KeycloakConfig {
  constructor(env = 'production') {
    this.env = env;
    this.baseUrl = process.env.KEYCLOAK_URL || 'https://auth.yarlis.ai';
    this.adminUsername = process.env.KEYCLOAK_ADMIN_USER || 'root';
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'BkdNHvll-QeL5-lngxWKcs';

    // Load project metadata
    this.projectConfig = this.loadProjectConfig();

    // Dynamic naming based on project
    this.realmName = this.generateRealmName();
    this.clientPrefix = this.generateClientPrefix();

    // Theme colors extracted from website
    this.theme = {
      primary: '#667eea',
      secondary: '#764ba2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      background: '#1e1e1e',
      text: '#cccccc'
    };
  }

  async loadProjectConfig() {
    try {
      // Try to load from .project file
      const projectFile = await fs.readFile(path.join(process.cwd(), '.project'), 'utf8');
      const config = {};
      projectFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.toLowerCase().replace(/_/g, '')] = value.trim();
        }
      });
      return config;
    } catch (error) {
      // Fallback to default config
      return {
        projectname: 'RapidTriageME',
        domain: 'rapidtriage.me',
        provider: 'CLOUDFLARE',
        region: 'GLOBAL'
      };
    }
  }

  generateRealmName() {
    const projectName = this.projectConfig.projectname || 'rapidtriage';
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${cleanName}-${this.env}`;
  }

  generateClientPrefix() {
    const projectName = this.projectConfig.projectname || 'rapidtriage';
    return projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  async extractThemeFromWebsite(url) {
    try {
      const response = await axios.get(url || `https://${this.projectConfig.domain}`);
      const html = response.data;

      // Extract colors from CSS
      const colorRegex = /#[0-9A-Fa-f]{6}/g;
      const gradientRegex = /linear-gradient\([^)]+\)/g;

      const colors = html.match(colorRegex) || [];
      const gradients = html.match(gradientRegex) || [];

      if (colors.length > 0) {
        this.theme.primary = colors[0];
        this.theme.secondary = colors[1] || colors[0];
      }

      if (gradients.length > 0) {
        this.theme.gradient = gradients[0];
      }

      console.log('✅ Theme extracted from website:', this.theme);
    } catch (error) {
      console.log('ℹ️ Using default theme colors');
    }
  }
}

// ============================================================================
// KEYCLOAK API CLIENT
// ============================================================================

class KeycloakClient {
  constructor(config) {
    this.config = config;
    this.accessToken = null;
    this.api = axios.create({
      baseURL: `${config.baseUrl}/admin/realms`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async authenticate() {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.config.adminUsername,
          password: this.config.adminPassword
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.api.defaults.headers.Authorization = `Bearer ${this.accessToken}`;

      console.log('✅ Authenticated with Keycloak');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async createRealm() {
    const realmConfig = {
      realm: this.config.realmName,
      enabled: true,
      displayName: `${this.config.projectConfig.projectname} ${this.config.env}`,
      displayNameHtml: `<div style="background: ${this.config.theme.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${this.config.projectConfig.projectname}</div>`,

      // Login settings
      loginTheme: 'rapidtriage',
      accountTheme: 'rapidtriage',
      adminTheme: 'rapidtriage',
      emailTheme: 'rapidtriage',

      // Security settings
      sslRequired: 'external',
      registrationAllowed: true,
      registrationEmailAsUsername: true,
      rememberMe: true,
      verifyEmail: true,
      loginWithEmailAllowed: true,
      duplicateEmailsAllowed: false,
      resetPasswordAllowed: true,
      editUsernameAllowed: false,

      // Brute force detection
      bruteForceProtected: true,
      permanentLockout: false,
      maxFailureWaitSeconds: 900,
      minimumQuickLoginWaitSeconds: 60,
      waitIncrementSeconds: 60,
      quickLoginCheckMilliSeconds: 1000,
      maxDeltaTimeSeconds: 43200,
      failureFactor: 30,

      // Token settings
      accessTokenLifespan: 300,
      accessTokenLifespanForImplicitFlow: 900,
      ssoSessionIdleTimeout: 1800,
      ssoSessionMaxLifespan: 36000,
      ssoSessionIdleTimeoutRememberMe: 0,
      ssoSessionMaxLifespanRememberMe: 0,
      offlineSessionIdleTimeout: 2592000,
      offlineSessionMaxLifespanEnabled: false,
      offlineSessionMaxLifespan: 5184000,

      // Default roles
      defaultRoles: ['user', 'offline_access', 'uma_authorization'],

      // Internationalization
      internationalizationEnabled: true,
      supportedLocales: ['en', 'es', 'fr', 'de', 'pt', 'zh-CN'],
      defaultLocale: 'en',

      // Password policy
      passwordPolicy: 'hashIterations(27500) and length(8) and digits(1) and upperCase(1) and specialChars(1) and notUsername',

      // OTP Policy
      otpPolicyType: 'totp',
      otpPolicyAlgorithm: 'HmacSHA256',
      otpPolicyInitialCounter: 0,
      otpPolicyDigits: 6,
      otpPolicyLookAheadWindow: 1,
      otpPolicyPeriod: 30,

      // SMTP server (configure with actual values)
      smtpServer: {
        from: `noreply@${this.config.projectConfig.domain}`,
        fromDisplayName: this.config.projectConfig.projectname,
        host: 'smtp.sendgrid.net',
        port: 587,
        ssl: false,
        starttls: true,
        auth: true,
        user: process.env.SMTP_USER || 'apikey',
        password: process.env.SMTP_PASSWORD || ''
      }
    };

    try {
      await this.api.post('', realmConfig);
      console.log(`✅ Realm '${this.config.realmName}' created successfully`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Realm '${this.config.realmName}' already exists`);
        // Update existing realm
        await this.api.put(`/${this.config.realmName}`, realmConfig);
        console.log(`✅ Realm '${this.config.realmName}' updated`);
      } else {
        throw error;
      }
    }
  }

  async createClients() {
    const clients = [
      {
        clientId: `${this.config.clientPrefix}-webapp`,
        name: 'Web Application',
        description: 'Main web application',
        rootUrl: `https://${this.config.projectConfig.domain}`,
        baseUrl: '/',
        redirectUris: [
          `https://${this.config.projectConfig.domain}/*`,
          `https://www.${this.config.projectConfig.domain}/*`,
          `https://test.${this.config.projectConfig.domain}/*`,
          'http://localhost:3000/*',
          'http://localhost:8787/*'
        ],
        webOrigins: ['+'],
        protocol: 'openid-connect',
        publicClient: true,
        standardFlowEnabled: true,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: true,
        attributes: {
          'pkce.code.challenge.method': 'S256'
        }
      },
      {
        clientId: `${this.config.clientPrefix}-extension`,
        name: 'Browser Extension',
        description: 'Chrome/Firefox extension',
        redirectUris: [
          'chrome-extension://*/*',
          'moz-extension://*/*'
        ],
        webOrigins: ['*'],
        protocol: 'openid-connect',
        publicClient: true,
        standardFlowEnabled: true
      },
      {
        clientId: `${this.config.clientPrefix}-mobile`,
        name: 'Mobile Application',
        description: 'React Native mobile app',
        redirectUris: [
          `${this.config.clientPrefix}://auth/callback`,
          'exp://localhost:19000'
        ],
        protocol: 'openid-connect',
        publicClient: true,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true
      },
      {
        clientId: `${this.config.clientPrefix}-api`,
        name: 'API Backend',
        description: 'Backend API service',
        serviceAccountsEnabled: true,
        authorizationServicesEnabled: true,
        publicClient: false,
        protocol: 'openid-connect',
        secret: this.generateClientSecret()
      },
      {
        clientId: `${this.config.clientPrefix}-mcp`,
        name: 'MCP Server',
        description: 'Model Context Protocol server',
        serviceAccountsEnabled: true,
        publicClient: false,
        protocol: 'openid-connect',
        secret: this.generateClientSecret()
      }
    ];

    for (const client of clients) {
      try {
        await this.api.post(`/${this.config.realmName}/clients`, client);
        console.log(`✅ Client '${client.clientId}' created`);

        if (client.secret) {
          console.log(`   🔑 Secret: ${client.secret}`);
        }
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️ Client '${client.clientId}' already exists`);
        } else {
          console.error(`❌ Failed to create client '${client.clientId}':`, error.message);
        }
      }
    }
  }

  async createRoles() {
    const roles = [
      // Subscription tiers
      { name: 'free_tier', description: 'Free tier user' },
      { name: 'starter_tier', description: 'Starter subscription' },
      { name: 'pro_tier', description: 'Pro subscription' },
      { name: 'enterprise_tier', description: 'Enterprise subscription' },

      // Permission roles
      { name: 'admin', description: 'System administrator' },
      { name: 'developer', description: 'Developer access' },
      { name: 'analyst', description: 'Analytics access' },
      { name: 'viewer', description: 'Read-only access' },
      { name: 'billing', description: 'Billing management' },

      // Feature flags
      { name: 'beta_features', description: 'Access to beta features' },
      { name: 'api_access', description: 'API access permission' },
      { name: 'export_data', description: 'Data export permission' },
      { name: 'team_management', description: 'Team management permission' }
    ];

    for (const role of roles) {
      try {
        await this.api.post(`/${this.config.realmName}/roles`, role);
        console.log(`✅ Role '${role.name}' created`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️ Role '${role.name}' already exists`);
        } else {
          console.error(`❌ Failed to create role '${role.name}':`, error.message);
        }
      }
    }
  }

  async createGroups() {
    const groups = [
      {
        name: 'Organizations',
        subGroups: [
          { name: 'Free Users' },
          { name: 'Starter Users' },
          { name: 'Pro Users' },
          { name: 'Enterprise Users' }
        ]
      },
      {
        name: 'Departments',
        subGroups: [
          { name: 'Development' },
          { name: 'Marketing' },
          { name: 'Sales' },
          { name: 'Support' }
        ]
      }
    ];

    for (const group of groups) {
      try {
        const response = await this.api.post(`/${this.config.realmName}/groups`, {
          name: group.name
        });

        const groupId = response.headers.location?.split('/').pop();
        console.log(`✅ Group '${group.name}' created`);

        // Create subgroups
        if (group.subGroups && groupId) {
          for (const subGroup of group.subGroups) {
            await this.api.post(`/${this.config.realmName}/groups/${groupId}/children`, {
              name: subGroup.name
            });
            console.log(`   ✅ Subgroup '${subGroup.name}' created`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to create group '${group.name}':`, error.message);
      }
    }
  }

  async configureIdentityProviders() {
    const providers = [
      {
        alias: 'google',
        providerId: 'google',
        enabled: true,
        trustEmail: true,
        storeToken: true,
        addReadTokenRoleOnCreate: true,
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          defaultScope: 'openid email profile'
        }
      },
      {
        alias: 'github',
        providerId: 'github',
        enabled: true,
        trustEmail: true,
        storeToken: true,
        config: {
          clientId: process.env.GITHUB_CLIENT_ID || '',
          clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
        }
      },
      {
        alias: 'microsoft',
        providerId: 'microsoft',
        enabled: true,
        trustEmail: true,
        storeToken: true,
        config: {
          clientId: process.env.AZURE_CLIENT_ID || '',
          clientSecret: process.env.AZURE_CLIENT_SECRET || '',
          authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
        }
      }
    ];

    for (const provider of providers) {
      if (provider.config.clientId && provider.config.clientSecret) {
        try {
          await this.api.post(`/${this.config.realmName}/identity-provider/instances`, provider);
          console.log(`✅ Identity provider '${provider.alias}' configured`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Identity provider '${provider.alias}' already exists`);
          } else {
            console.error(`⚠️ Failed to configure '${provider.alias}':`, error.message);
          }
        }
      } else {
        console.log(`⚠️ Skipping '${provider.alias}' - missing credentials`);
      }
    }
  }

  async createCustomTheme() {
    // This would typically involve creating theme files
    // For now, we'll set theme attributes
    const themeConfig = {
      attributes: {
        logoUrl: `https://${this.config.projectConfig.domain}/logo.png`,
        primaryColor: this.config.theme.primary,
        secondaryColor: this.config.theme.secondary,
        backgroundColor: this.config.theme.background,
        textColor: this.config.theme.text,
        customCss: `
          .login-pf {
            background: ${this.config.theme.gradient};
          }
          .btn-primary {
            background-color: ${this.config.theme.primary};
            border-color: ${this.config.theme.primary};
          }
          .btn-primary:hover {
            background-color: ${this.config.theme.secondary};
            border-color: ${this.config.theme.secondary};
          }
        `
      }
    };

    console.log('✅ Custom theme configuration prepared');
    return themeConfig;
  }

  generateClientSecret() {
    return Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64');
  }

  async createTestUser() {
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'Test123!',
        temporary: false
      }],
      realmRoles: ['free_tier', 'user'],
      groups: ['/Organizations/Free Users']
    };

    try {
      await this.api.post(`/${this.config.realmName}/users`, testUser);
      console.log('✅ Test user created (test@example.com / Test123!)');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Test user already exists');
      } else {
        console.error('⚠️ Failed to create test user:', error.message);
      }
    }
  }

  async exportConfiguration() {
    const config = {
      realm: this.config.realmName,
      authServerUrl: `${this.config.baseUrl}/`,
      'ssl-required': 'external',
      resource: `${this.config.clientPrefix}-webapp`,
      'public-client': true,
      'confidential-port': 0
    };

    const envVars = `
# Keycloak Configuration
KEYCLOAK_URL=${this.config.baseUrl}
KEYCLOAK_REALM=${this.config.realmName}
KEYCLOAK_CLIENT_ID=${this.config.clientPrefix}-webapp
KEYCLOAK_API_CLIENT_ID=${this.config.clientPrefix}-api
KEYCLOAK_API_CLIENT_SECRET=<check console output>
    `.trim();

    await fs.writeFile('keycloak.json', JSON.stringify(config, null, 2));
    await fs.appendFile('.env', '\n' + envVars + '\n');

    console.log('✅ Configuration exported to keycloak.json and .env');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Keycloak Setup for RapidTriageME\n');

  const env = process.argv.includes('--env')
    ? process.argv[process.argv.indexOf('--env') + 1]
    : 'production';

  const config = new KeycloakConfig(env);

  // Load project configuration
  await config.loadProjectConfig();

  // Extract theme from website
  await config.extractThemeFromWebsite();

  const client = new KeycloakClient(config);

  try {
    // Authenticate with Keycloak
    await client.authenticate();

    // Create and configure realm
    console.log('\n📌 Creating Realm...');
    await client.createRealm();

    // Create clients
    console.log('\n📱 Creating Clients...');
    await client.createClients();

    // Create roles
    console.log('\n👥 Creating Roles...');
    await client.createRoles();

    // Create groups
    console.log('\n🏢 Creating Groups...');
    await client.createGroups();

    // Configure identity providers
    console.log('\n🔐 Configuring Identity Providers...');
    await client.configureIdentityProviders();

    // Create test user
    console.log('\n👤 Creating Test User...');
    await client.createTestUser();

    // Export configuration
    console.log('\n📤 Exporting Configuration...');
    await client.exportConfiguration();

    console.log('\n✅ Keycloak setup completed successfully!');
    console.log(`\n🌐 Admin Console: ${config.baseUrl}/admin/${config.realmName}/console`);
    console.log(`🔗 Account Console: ${config.baseUrl}/realms/${config.realmName}/account`);
    console.log(`🔑 Login URL: ${config.baseUrl}/realms/${config.realmName}/protocol/openid-connect/auth`);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { KeycloakConfig, KeycloakClient };