/**
 * Authentication Handler
 * Manages user authentication, registration, and API key generation
 */

import { generateUUID } from '../utils/uuid';

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: 'user' | 'admin' | 'enterprise' | 'owner' | 'developer' | 'analyst' | 'viewer' | 'billing';
  organizationRole?: 'owner' | 'admin' | 'developer' | 'analyst' | 'viewer' | 'billing';
  createdAt: string;
  updatedAt?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status?: 'active' | 'inactive' | 'cancelled';
    expiresAt: string;
    requestLimit?: number;
    limits?: {
      projects?: number;
      sessions?: number;
      apiKeys?: number;
      requestsPerMinute?: number;
    };
  };
  permissions?: string[];
}

interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
  rateLimit: number;
  permissions: string[];
  ipWhitelist: string[];
  status: 'active' | 'revoked' | 'expired';
  revokedAt?: string;
}

export class AuthHandler {
  private env: any;
  private testUsers: Map<string, User>;

  constructor(env: any) {
    this.env = env;
    this.testUsers = this.initializeTestUsers();
  }

  /**
   * Initialize test users for development and testing
   */
  private initializeTestUsers(): Map<string, User> {
    const users = new Map<string, User>();
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Test users with different subscription tiers
    const testUserData = [
      {
        id: 'user_free_001',
        email: 'free@rapidtriage.me',
        name: 'Free User',
        password: 'FreeUser123!',
        role: 'user' as const,
        subscription: {
          plan: 'free' as const,
          status: 'active' as const,
          expiresAt: futureDate,
          limits: {
            projects: 1,
            sessions: 100,
            apiKeys: 3,
            requestsPerMinute: 100
          }
        },
        permissions: ['profile:read', 'profile:update', 'project:read', 'project:create:limited']
      },
      {
        id: 'user_starter_001',
        email: 'starter@rapidtriage.me',
        name: 'Starter User',
        password: 'StarterUser123!',
        role: 'user' as const,
        subscription: {
          plan: 'starter' as const,
          status: 'active' as const,
          expiresAt: futureDate,
          limits: {
            projects: 5,
            sessions: 1000,
            apiKeys: 5,
            requestsPerMinute: 500
          }
        },
        permissions: ['profile:*', 'project:*', 'apikey:*', 'workspace:create', 'workspace:read']
      },
      {
        id: 'user_pro_001',
        email: 'pro@rapidtriage.me',
        name: 'Pro User',
        password: 'ProUser123!',
        role: 'user' as const,
        subscription: {
          plan: 'pro' as const,
          status: 'active' as const,
          expiresAt: futureDate,
          limits: {
            projects: 25,
            sessions: 10000,
            apiKeys: 10,
            requestsPerMinute: 1000
          }
        },
        permissions: ['*']
      },
      {
        id: 'user_enterprise_001',
        email: 'enterprise@rapidtriage.me',
        name: 'Enterprise User',
        password: 'EnterpriseUser123!',
        role: 'enterprise' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate,
          limits: {
            projects: -1, // unlimited
            sessions: -1,
            apiKeys: -1,
            requestsPerMinute: 10000
          }
        },
        permissions: ['*']
      },
      // Organization role users
      {
        id: 'user_org_owner',
        email: 'owner@rapidtriage.me',
        name: 'Organization Owner',
        password: 'OrgOwner123!',
        role: 'owner' as const,
        organizationRole: 'owner' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['*']
      },
      {
        id: 'user_org_admin',
        email: 'admin@rapidtriage.me',
        name: 'Organization Admin',
        password: 'OrgAdmin123!',
        role: 'admin' as const,
        organizationRole: 'admin' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['organization:*', 'project:*', 'team:*', '!billing:*', '!organization:delete']
      },
      {
        id: 'user_org_developer',
        email: 'developer@rapidtriage.me',
        name: 'Organization Developer',
        password: 'OrgDev123!',
        role: 'developer' as const,
        organizationRole: 'developer' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['project:*', 'debug:*', 'apikey:*', '!team:*', '!billing:*']
      },
      {
        id: 'user_org_analyst',
        email: 'analyst@rapidtriage.me',
        name: 'Organization Analyst',
        password: 'OrgAnalyst123!',
        role: 'analyst' as const,
        organizationRole: 'analyst' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['analytics:*', 'reports:*', 'dashboard:*', 'project:read', '!project:write']
      },
      {
        id: 'user_org_viewer',
        email: 'viewer@rapidtriage.me',
        name: 'Organization Viewer',
        password: 'OrgViewer123!',
        role: 'viewer' as const,
        organizationRole: 'viewer' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['*:read', '!*:write', '!*:delete', '!*:create']
      },
      {
        id: 'user_org_billing',
        email: 'billing@rapidtriage.me',
        name: 'Organization Billing',
        password: 'OrgBilling123!',
        role: 'billing' as const,
        organizationRole: 'billing' as const,
        subscription: {
          plan: 'enterprise' as const,
          status: 'active' as const,
          expiresAt: futureDate
        },
        permissions: ['billing:*', 'invoice:*', 'subscription:*', '!project:*', '!team:*']
      }
    ];

    // Create users with hashed passwords
    for (const userData of testUserData) {
      const { password, ...userInfo } = userData;
      // Simple hash for test users (not secure, only for testing)
      // Use btoa for base64 encoding in Cloudflare Workers
      const passwordHash = `test:${btoa(password)}`;

      users.set(userInfo.email, {
        ...userInfo,
        passwordHash,
        createdAt: now,
        emailVerified: true,
        twoFactorEnabled: false
      } as User);
    }

    return users;
  }
  
  /**
   * Generate random string for salts and tokens
   */
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Hash password using SHA-256 (in production, use bcrypt or argon2)
   */
  private async hashPassword(password: string, salt?: string): Promise<string> {
    const actualSalt = salt || this.generateRandomString(16);
    const encoder = new TextEncoder();
    const data = encoder.encode(password + actualSalt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${actualSalt}:${hashHex}`;
  }
  
  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    const computedHash = await this.hashPassword(password, salt);
    return computedHash.split(':')[1] === hash;
  }
  
  /**
   * Generate JWT token (simplified - in production use proper JWT library)
   */
  private async generateJWT(userId: string, email: string): Promise<string> {
    const header = btoa(JSON.stringify({
      alg: 'HS256',
      typ: 'JWT'
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const payload = btoa(JSON.stringify({
      sub: userId,
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Sign with HMAC-SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${payload}.${this.env.JWT_SECRET}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = btoa(String.fromCharCode(...hashArray))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    return `${header}.${payload}.${signature}`;
  }
  
  /**
   * Verify JWT token
   */
  private async verifyJWT(token: string): Promise<any> {
    try {
      const [header, payload, signature] = token.split('.');
      
      // Verify signature
      const encoder = new TextEncoder();
      const data = encoder.encode(`${header}.${payload}.${this.env.JWT_SECRET}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedSignature = btoa(String.fromCharCode(...hashArray))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      // Decode and verify payload
      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Check expiration
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decodedPayload;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Generate API key
   */
  private generateApiKey(): string {
    const prefix = 'rtm';
    const random = this.generateRandomString(32);
    return `${prefix}_${random}`;
  }
  
  /**
   * Handle user registration
   */
  async handleRegister(request: Request): Promise<Response> {
    try {
      const body = await request.json() as any;
      const { email, password, name, company, referralCode } = body;
      
      // Validate input
      if (!email || !password || !name) {
        return new Response(JSON.stringify({
          error: 'Validation Error',
          message: 'Email, password, and name are required',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return new Response(JSON.stringify({
          error: 'Validation Error',
          message: 'Password must be at least 8 characters',
          code: 'WEAK_PASSWORD'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Check if user already exists
      if (this.env.SESSIONS) {
        const existingUser = await this.env.SESSIONS.get(`user:email:${email}`);
        if (existingUser) {
          return new Response(JSON.stringify({
            error: 'User Already Exists',
            message: 'An account with this email already exists',
            code: 'USER_EXISTS'
          }), {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
      
      // Create user
      const userId = generateUUID();
      const user: User = {
        id: userId,
        email,
        name,
        passwordHash: await this.hashPassword(password),
        role: 'user',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        twoFactorEnabled: false,
        subscription: {
          plan: 'free',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
          requestLimit: 100
        }
      };
      
      // Store user
      if (!this.env.SESSIONS) {
        throw new Error('SESSIONS KV namespace not configured');
      }

      await this.env.SESSIONS.put(`user:${userId}`, JSON.stringify(user));
      await this.env.SESSIONS.put(`user:email:${email}`, userId);

      // Store additional metadata
      if (company) {
        await this.env.SESSIONS.put(`user:${userId}:company`, company);
      }
      if (referralCode) {
        await this.env.SESSIONS.put(`user:${userId}:referral`, referralCode);
      }
      
      // Generate tokens
      const token = await this.generateJWT(userId, email);
      const refreshToken = this.generateRandomString(32);
      
      // Store refresh token
      if (this.env.SESSIONS) {
        await this.env.SESSIONS.put(
          `refresh:${refreshToken}`,
          userId,
          { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
        );
      }
      
      // Return response
      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: 86400, // 24 hours
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.name, // Add username field for consistency
          role: user.role,
          organizationRole: user.organizationRole,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          subscription: user.subscription,
          permissions: user.permissions || []
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);

      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to create account',
        code: 'REGISTRATION_FAILED',
        details: errorMessage // Include error details for debugging
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle user login
   */
  async handleLogin(request: Request): Promise<Response> {
    try {
      let body: any;
      try {
        body = await request.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        return new Response(JSON.stringify({
          error: 'Invalid Request',
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const { email, password, twoFactorCode } = body;

      // Debug: Log test users count
      console.log('Test users initialized:', this.testUsers.size, 'users');
      console.log('Login attempt for:', email);
      
      // Validate input
      if (!email || !password) {
        return new Response(JSON.stringify({
          error: 'Validation Error',
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get user by email - check test users first
      let user: User | null = null;

      // Check if it's a test user
      const testUser = this.testUsers.get(email);
      if (testUser) {
        // Verify test user password (simple check for test users)
        const [prefix, hash] = testUser.passwordHash.split(':');
        if (prefix === 'test') {
          // Use atob for base64 decoding in Cloudflare Workers
          const testPassword = atob(hash);
          if (password === testPassword) {
            user = testUser;
          }
        }
      }

      // If not a test user, check regular storage
      if (!user && this.env.SESSIONS) {
        const userId = await this.env.SESSIONS.get(`user:email:${email}`);
        if (userId) {
          const userData = await this.env.SESSIONS.get(`user:${userId}`);
          if (userData) {
            user = JSON.parse(userData);
          }
        }
      }
      
      // Create demo user if it's demo@example.com and doesn't exist
      if (!user && email === 'demo@example.com' && password === 'demo1234') {
        const demoUserId = 'user_demo_' + Date.now();
        const demoUser: User = {
          id: demoUserId,
          email: 'demo@example.com',
          name: 'Demo User',
          passwordHash: await this.hashPassword('demo1234'),
          subscription: {
            plan: 'pro',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          twoFactorEnabled: false,
          emailVerified: true
        };
        
        // Store demo user
        if (this.env.SESSIONS) {
          await this.env.SESSIONS.put(`user:${demoUserId}`, JSON.stringify(demoUser));
          await this.env.SESSIONS.put(`user:email:demo@example.com`, demoUserId);
          await this.env.SESSIONS.put(`user:${demoUserId}:company`, 'Acme Corporation');
          
          // Create some demo API keys
          const demoKeys = [
            {
              id: 'key_demo_1',
              key: 'rtm_demo_key_1234567890',
              name: 'Production API Key',
              createdAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
              status: 'active'
            },
            {
              id: 'key_demo_2',
              key: 'rtm_demo_key_0987654321',
              name: 'Development API Key',
              createdAt: new Date().toISOString(),
              lastUsedAt: null,
              status: 'active'
            }
          ];
          await this.env.SESSIONS.put(`user:${demoUserId}:apikeys`, JSON.stringify(demoKeys));
        }
        
        user = demoUser;
      }
      
      // Check if user exists
      if (!user) {
        return new Response(JSON.stringify({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Verify password (skip for already verified test users)
      const isTestUser = this.testUsers.has(user.email);
      if (!isTestUser && !(await this.verifyPassword(password, user.passwordHash))) {
        return new Response(JSON.stringify({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Check 2FA if enabled
      if (user.twoFactorEnabled && !twoFactorCode) {
        return new Response(JSON.stringify({
          error: 'Two-Factor Required',
          message: 'Please provide two-factor authentication code',
          code: '2FA_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Generate tokens
      const token = await this.generateJWT(user.id, user.email);
      const refreshToken = this.generateRandomString(32);
      
      // Store refresh token
      if (this.env.SESSIONS) {
        await this.env.SESSIONS.put(
          `refresh:${refreshToken}`,
          user.id,
          { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
        );
      }
      
      // Return response
      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: 86400, // 24 hours
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.name, // Add username field for consistency
          role: user.role,
          organizationRole: user.organizationRole,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          subscription: user.subscription,
          permissions: user.permissions || []
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle API key generation
   */
  async handleCreateApiKey(request: Request): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const body = await request.json() as any;
      const { name, expiresIn, rateLimit, permissions, ipWhitelist } = body;
      
      // Validate input
      if (!name) {
        return new Response(JSON.stringify({
          error: 'Validation Error',
          message: 'API key name is required',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get user to check subscription limits
      let user: User | null = null;
      if (this.env.SESSIONS) {
        const userData = await this.env.SESSIONS.get(`user:${payload.sub}`);
        if (userData) {
          user = JSON.parse(userData);
        }
      }
      
      if (!user) {
        return new Response(JSON.stringify({
          error: 'User Not Found',
          message: 'User account not found',
          code: 'USER_NOT_FOUND'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Check API key limits based on subscription
      const maxKeys = user.subscription.plan === 'free' ? 3 :
                     user.subscription.plan === 'pro' ? 10 :
                     100; // enterprise
      
      // Count existing active keys
      let keyCount = 0;
      if (this.env.SESSIONS) {
        const keysData = await this.env.SESSIONS.get(`user:${payload.sub}:apikeys`);
        if (keysData) {
          const keyIds = JSON.parse(keysData);
          // Count only active keys
          for (const keyId of keyIds) {
            const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
            if (keyData) {
              const key = JSON.parse(keyData);
              if (key.status === 'active') {
                keyCount++;
              }
            }
          }
        }
      }
      
      if (keyCount >= maxKeys) {
        return new Response(JSON.stringify({
          error: 'Limit Exceeded',
          message: `Maximum API keys (${maxKeys}) reached for your plan`,
          code: 'KEY_LIMIT_EXCEEDED'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Generate API key
      const apiKeyId = generateUUID();
      const apiKeyValue = this.generateApiKey();
      
      const apiKey: ApiKey = {
        id: apiKeyId,
        userId: payload.sub,
        name,
        key: apiKeyValue,
        prefix: apiKeyValue.split('_')[0],
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString() : null,
        requestCount: 0,
        rateLimit: rateLimit || user.subscription.requestLimit,
        permissions: permissions || ['read', 'write'],
        ipWhitelist: ipWhitelist || [],
        status: 'active'
      };
      
      // Store API key
      if (this.env.SESSIONS) {
        // Store key data
        await this.env.SESSIONS.put(`apikey:${apiKeyId}`, JSON.stringify(apiKey));
        await this.env.SESSIONS.put(`apikey:value:${apiKeyValue}`, apiKeyId);
        
        // Update user's key list
        const keysData = await this.env.SESSIONS.get(`user:${payload.sub}:apikeys`);
        const keys = keysData ? JSON.parse(keysData) : [];
        keys.push(apiKeyId);
        await this.env.SESSIONS.put(`user:${payload.sub}:apikeys`, JSON.stringify(keys));
      }
      
      // Return response (only show full key once)
      return new Response(JSON.stringify({
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Only shown once!
        prefix: apiKey.prefix,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        permissions: apiKey.permissions,
        ipWhitelist: apiKey.ipWhitelist,
        message: 'Save this API key securely. It will not be shown again.'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('API key creation error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to create API key',
        code: 'KEY_CREATION_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle listing API keys
   */
  async handleListApiKeys(request: Request): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get user's API keys
      const apiKeys: ApiKey[] = [];
      if (this.env.SESSIONS) {
        const keysData = await this.env.SESSIONS.get(`user:${payload.sub}:apikeys`);
        if (keysData) {
          const keyIds = JSON.parse(keysData);
          for (const keyId of keyIds) {
            const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
            if (keyData) {
              const key = JSON.parse(keyData);
              // Only include active keys
              if (key.status === 'active') {
                // Don't return the actual key value
                delete key.key;
                apiKeys.push(key);
              }
            }
          }
        }
      }
      
      // Parse pagination parameters
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      
      // Paginate results
      const paginatedKeys = apiKeys.slice(offset, offset + limit);
      
      return new Response(JSON.stringify({
        data: paginatedKeys,
        pagination: {
          page,
          limit,
          total: apiKeys.length,
          totalPages: Math.ceil(apiKeys.length / limit),
          hasNext: offset + limit < apiKeys.length,
          hasPrev: page > 1
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('List API keys error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to list API keys',
        code: 'LIST_KEYS_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle OAuth callback from Keycloak
   */
  async handleOAuthCallback(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      // Handle error from Keycloak
      if (error) {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              .error {
                color: #e53e3e;
                margin-bottom: 20px;
              }
              .btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Failed</h1>
              <p>${errorDescription || error || 'An error occurred during authentication'}</p>
              <a href="/login" class="btn">Try Again</a>
            </div>
          </body>
          </html>
        `, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // If no code, redirect to login
      if (!code) {
        return Response.redirect(new URL('/login', request.url).toString(), 302);
      }

      // For now, create a mock token and redirect to profile
      // In production, you would exchange the code for tokens with Keycloak
      const mockToken = 'keycloak-' + code.substring(0, 20);

      // Return HTML that sets the token and redirects
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
            }
            .success {
              color: #38a169;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ Authentication Successful!</h1>
            <p>Redirecting to your profile...</p>
          </div>
          <script>
            // Store authentication data
            const token = '${mockToken}';
            const user = {
              id: 'keycloak-user',
              name: 'Keycloak User',
              email: 'user@rapidtriage.me',
              company: 'RapidTriageME',
              subscription: {
                plan: 'pro',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            };

            localStorage.setItem('rapidtriage_auth_token', token);
            sessionStorage.setItem('rapidtriage_auth_token', token);
            localStorage.setItem('rapidtriage_user', JSON.stringify(user));

            // Redirect to profile
            setTimeout(() => {
              window.location.href = '/profile';
            }, 1500);
          </script>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

    } catch (error) {
      console.error('OAuth callback error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Handle getting user profile
   */
  async handleGetProfile(request: Request): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get user data
      let user: User | null = null;
      if (this.env.SESSIONS) {
        const userData = await this.env.SESSIONS.get(`user:${payload.sub}`);
        if (userData) {
          user = JSON.parse(userData);
        }
      }
      
      if (!user) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Remove sensitive data
      const { passwordHash, ...safeUser } = user;
      
      // Get additional metadata
      let company = null;
      let apiKeyCount = 0;
      let requestsToday = 0;
      if (this.env.SESSIONS) {
        company = await this.env.SESSIONS.get(`user:${payload.sub}:company`);
        
        // Get today's request count
        const today = new Date().toISOString().split('T')[0];
        const dailyKey = `user:${payload.sub}:requests:${today}`;
        const todayCount = await this.env.SESSIONS.get(dailyKey);
        requestsToday = parseInt(todayCount || '0');
        
        // Count active API keys
        const keysData = await this.env.SESSIONS.get(`user:${payload.sub}:apikeys`);
        if (keysData) {
          const keyIds = JSON.parse(keysData);
          // Count only active keys
          for (const keyId of keyIds) {
            const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
            if (keyData) {
              const key = JSON.parse(keyData);
              if (key.status === 'active') {
                apiKeyCount++;
              }
            }
          }
        }
      }
      
      return new Response(JSON.stringify({
        ...safeUser,
        username: safeUser.name, // Add username field for compatibility
        organization: company, // Add organization field for compatibility
        company,
        apiKeyCount,
        requestsToday,
        subscription: {
          ...user.subscription,
          daysRemaining: Math.ceil((new Date(user.subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve profile',
        code: 'PROFILE_FETCH_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle updating user profile
   */
  async handleUpdateProfile(request: Request): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const body = await request.json() as any;
      const { name, company, twoFactorEnabled } = body;
      
      // Get current user data
      let user: User | null = null;
      if (this.env.SESSIONS) {
        const userData = await this.env.SESSIONS.get(`user:${payload.sub}`);
        if (userData) {
          user = JSON.parse(userData);
        }
      }
      
      if (!user) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Update allowed fields
      if (name !== undefined) user.name = name;
      if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
      
      // Store updated user
      if (this.env.SESSIONS) {
        await this.env.SESSIONS.put(`user:${payload.sub}`, JSON.stringify(user));
        
        // Update company if provided
        if (company !== undefined) {
          await this.env.SESSIONS.put(`user:${payload.sub}:company`, company);
        }
      }
      
      // Remove sensitive data for response
      const { passwordHash, ...safeUser } = user;
      
      return new Response(JSON.stringify({
        success: true,
        user: safeUser,
        company
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle revoking API key
   */
  async handleRevokeApiKey(request: Request, keyId: string): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get API key
      let apiKey: ApiKey | null = null;
      if (this.env.SESSIONS) {
        const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
        if (keyData) {
          apiKey = JSON.parse(keyData);
        }
      }
      
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'API key not found',
          code: 'KEY_NOT_FOUND'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Check ownership
      if (apiKey.userId !== payload.sub) {
        return new Response(JSON.stringify({
          error: 'Forbidden',
          message: 'You do not have permission to revoke this key',
          code: 'INSUFFICIENT_PERMISSIONS'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Revoke API key (mark as revoked instead of deleting)
      if (this.env.SESSIONS) {
        // Update key status to revoked
        apiKey.status = 'revoked';
        apiKey.revokedAt = new Date().toISOString();
        
        // Store updated key data
        await this.env.SESSIONS.put(`apikey:${keyId}`, JSON.stringify(apiKey));
        
        // Delete the key value mapping so it can't be used for authentication
        await this.env.SESSIONS.delete(`apikey:value:${apiKey.key}`);
        
        // Keep the key in the user's list for historical record
        // (no need to update the list since we're keeping it for history)
      }
      
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Revoke API key error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to revoke API key',
        code: 'REVOKE_KEY_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle getting user metrics (request counts, usage stats)
   */
  async handleUserMetrics(request: Request): Promise<Response> {
    try {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.verifyJWT(token);
      
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Get date range from query params
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days') || '7');
      
      // Collect metrics
      const metrics: any = {
        userId: payload.sub,
        period: {
          days,
          start: new Date(Date.now() - (days - 1) * 86400000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        daily: [],
        totalRequests: 0,
        requestsToday: 0,
        byApiKey: []
      };
      
      if (this.env.SESSIONS) {
        // Get daily request counts for the user
        for (let i = 0; i < days; i++) {
          const date = new Date(Date.now() - i * 86400000);
          const dateKey = date.toISOString().split('T')[0];
          const dailyKey = `user:${payload.sub}:requests:${dateKey}`;
          
          const count = await this.env.SESSIONS.get(dailyKey);
          const requestCount = parseInt(count || '0');
          
          metrics.daily.unshift({
            date: dateKey,
            requests: requestCount
          });
          
          metrics.totalRequests += requestCount;
          
          if (i === 0) {
            metrics.requestsToday = requestCount;
          }
        }
        
        // Get per-API-key breakdown
        const keysData = await this.env.SESSIONS.get(`user:${payload.sub}:apikeys`);
        if (keysData) {
          const keyIds = JSON.parse(keysData);
          
          for (const keyId of keyIds) {
            const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
            if (keyData) {
              const apiKey = JSON.parse(keyData);
              
              // Only include active keys
              if (apiKey.status === 'active') {
                const today = new Date().toISOString().split('T')[0];
                const dailyKeyKey = `apikey:${keyId}:requests:${today}`;
                const todayCount = await this.env.SESSIONS.get(dailyKeyKey);
                
                metrics.byApiKey.push({
                  id: keyId,
                  name: apiKey.name,
                  totalRequests: apiKey.requestCount || 0,
                  requestsToday: parseInt(todayCount || '0'),
                  lastUsedAt: apiKey.lastUsedAt
                });
              }
            }
          }
        }
      }
      
      // Also add fields the profile page expects
      const usageResponse = {
        ...metrics,
        apiCallsToday: metrics.requestsToday,
        apiCallsMonth: metrics.totalRequests,
        storageUsed: Math.floor(Math.random() * 100), // Placeholder for now
      };

      return new Response(JSON.stringify(usageResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=60' // Cache for 1 minute
        }
      });
      
    } catch (error) {
      console.error('Get user metrics error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve user metrics',
        code: 'METRICS_FETCH_FAILED'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}