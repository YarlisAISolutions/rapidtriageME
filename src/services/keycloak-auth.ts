/**
 * Keycloak Authentication Service for RapidTriageME
 *
 * Handles OAuth2/OIDC authentication with Keycloak including:
 * - Token validation and exchange
 * - User profile synchronization
 * - SSO implementation across services
 * - Session management
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

interface KeycloakConfig {
  authServerUrl: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
  publicKey?: string;
}

interface KeycloakToken {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
  session_state?: string;
  scope?: string;
}

interface KeycloakUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  groups?: string[];
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  attributes?: Record<string, any>;
}

export class KeycloakAuthService {
  private config: KeycloakConfig;
  private openidConfig: any;
  private jwksUri: string;

  constructor(env: any) {
    this.config = {
      authServerUrl: env.KEYCLOAK_URL || 'https://auth.yarlis.ai',
      realm: env.KEYCLOAK_REALM || 'rapidtriage-production',
      clientId: env.KEYCLOAK_CLIENT_ID || 'rapidtriage-webapp',
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      publicKey: env.KEYCLOAK_PUBLIC_KEY
    };

    this.jwksUri = `${this.config.authServerUrl}/realms/${this.config.realm}/protocol/openid-connect/certs`;
  }

  /**
   * Initialize OpenID configuration
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.authServerUrl}/realms/${this.config.realm}/.well-known/openid-configuration`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch OpenID configuration');
      }

      this.openidConfig = await response.json();
    } catch (error) {
      console.error('[KeycloakAuth] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(params: {
    redirectUri: string;
    state?: string;
    scope?: string;
    responseType?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): string {
    const url = new URL(this.openidConfig.authorization_endpoint);

    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', params.responseType || 'code');
    url.searchParams.set('scope', params.scope || 'openid email profile');

    if (params.state) {
      url.searchParams.set('state', params.state);
    }

    // PKCE parameters for public clients
    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', params.codeChallengeMethod || 'S256');
    }

    return url.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<KeycloakToken> {
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code: params.code,
      redirect_uri: params.redirectUri
    });

    if (this.config.clientSecret) {
      formData.append('client_secret', this.config.clientSecret);
    }

    if (params.codeVerifier) {
      formData.append('code_verifier', params.codeVerifier);
    }

    const response = await fetch(this.openidConfig.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<KeycloakToken> {
    const formData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: refreshToken
    });

    if (this.config.clientSecret) {
      formData.append('client_secret', this.config.clientSecret);
    }

    const response = await fetch(this.openidConfig.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Validate and decode access token
   */
  async validateToken(token: string): Promise<any> {
    try {
      // For Cloudflare Workers, we use a simplified JWT validation
      // In production, you should validate against Keycloak's public key
      const isValid = await jwt.verify(token, this.config.publicKey || 'secret');

      if (!isValid) {
        throw new Error('Invalid token signature');
      }

      const decoded = jwt.decode(token);

      // Check token expiration
      if (decoded.payload.exp && decoded.payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      // Check issuer
      const expectedIssuer = `${this.config.authServerUrl}/realms/${this.config.realm}`;
      if (decoded.payload.iss !== expectedIssuer) {
        throw new Error('Invalid token issuer');
      }

      return decoded.payload;
    } catch (error) {
      console.error('[KeycloakAuth] Token validation failed:', error);
      throw error;
    }
  }

  /**
   * Get user info from Keycloak
   */
  async getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
    const response = await fetch(this.openidConfig.userinfo_endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  /**
   * Logout user from Keycloak
   */
  getLogoutUrl(params: {
    redirectUri?: string;
    idTokenHint?: string;
  }): string {
    const url = new URL(this.openidConfig.end_session_endpoint);

    if (params.redirectUri) {
      url.searchParams.set('post_logout_redirect_uri', params.redirectUri);
    }

    if (params.idTokenHint) {
      url.searchParams.set('id_token_hint', params.idTokenHint);
    }

    return url.toString();
  }

  /**
   * Introspect token to check if it's active
   */
  async introspectToken(token: string): Promise<any> {
    const formData = new URLSearchParams({
      token: token,
      client_id: this.config.clientId
    });

    if (this.config.clientSecret) {
      formData.append('client_secret', this.config.clientSecret);
    }

    const response = await fetch(this.openidConfig.introspection_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error('Token introspection failed');
    }

    return await response.json();
  }

  /**
   * Create or update local user from Keycloak user info
   */
  async syncUser(userInfo: KeycloakUserInfo, env: any): Promise<any> {
    // Extract subscription tier from roles
    const roles = userInfo.realm_access?.roles || [];
    let subscriptionTier = 'free';

    if (roles.includes('enterprise_tier')) {
      subscriptionTier = 'enterprise';
    } else if (roles.includes('pro_tier')) {
      subscriptionTier = 'pro';
    } else if (roles.includes('starter_tier')) {
      subscriptionTier = 'starter';
    }

    // Create/update user in KV storage
    const user = {
      id: userInfo.sub,
      keycloakId: userInfo.sub,
      email: userInfo.email,
      emailVerified: userInfo.email_verified,
      name: userInfo.name || `${userInfo.given_name} ${userInfo.family_name}`.trim(),
      username: userInfo.preferred_username,
      roles: roles,
      groups: userInfo.groups || [],
      subscription: {
        plan: subscriptionTier,
        status: 'active'
      },
      attributes: userInfo.attributes || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in KV if available
    if (env.SESSIONS) {
      await env.SESSIONS.put(`user:${user.id}`, JSON.stringify(user));
      await env.SESSIONS.put(`user:email:${user.email}`, user.id);
    }

    return user;
  }

  /**
   * Check if user has required role
   */
  hasRole(userInfo: KeycloakUserInfo, role: string): boolean {
    const roles = userInfo.realm_access?.roles || [];
    return roles.includes(role);
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(userInfo: KeycloakUserInfo, roles: string[]): boolean {
    const userRoles = userInfo.realm_access?.roles || [];
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user belongs to group
   */
  inGroup(userInfo: KeycloakUserInfo, group: string): boolean {
    const groups = userInfo.groups || [];
    return groups.includes(group);
  }

  /**
   * Get user's subscription tier from roles
   */
  getSubscriptionTier(userInfo: KeycloakUserInfo): string {
    const roles = userInfo.realm_access?.roles || [];

    if (roles.includes('enterprise_tier')) return 'enterprise';
    if (roles.includes('pro_tier')) return 'pro';
    if (roles.includes('starter_tier')) return 'starter';
    return 'free';
  }

  /**
   * Generate PKCE challenge for public clients
   */
  static generatePKCEChallenge(): { verifier: string; challenge: string } {
    const verifier = this.generateRandomString(128);
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);

    // For Cloudflare Workers, we need to use Web Crypto API
    const hashArray = crypto.subtle.digest('SHA-256', data);

    // Convert to base64url
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hashArray as any)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { verifier, challenge };
  }

  /**
   * Generate random string for state parameter
   */
  static generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = crypto.getRandomValues(new Uint8Array(length));

    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }

    return result;
  }
}

/**
 * Keycloak middleware for request authentication
 */
export async function keycloakMiddleware(
  request: Request,
  env: any,
  authService: KeycloakAuthService
): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7);

    // Validate token
    const tokenPayload = await authService.validateToken(token);

    // Get full user info
    const userInfo = await authService.getUserInfo(token);

    // Sync user to local database
    const user = await authService.syncUser(userInfo, env);

    return {
      authenticated: true,
      user
    };
  } catch (error: any) {
    console.error('[KeycloakMiddleware] Authentication failed:', error);
    return {
      authenticated: false,
      error: error.message || 'Authentication failed'
    };
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(requiredRoles: string | string[]) {
  return async (request: Request, env: any, ctx: any) => {
    const authService = new KeycloakAuthService(env);
    const { authenticated, user, error } = await keycloakMiddleware(request, env, authService);

    if (!authenticated) {
      return new Response(JSON.stringify({ error: error || 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = authService.hasAnyRole(user, roles);

    if (!hasRequiredRole) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user to request context
    ctx.user = user;
    return null; // Continue to next middleware/handler
  };
}