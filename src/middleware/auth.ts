/**
 * Authentication Middleware for RapidTriageME
 * Handles token-based, JWT, and API key authentication
 */

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
}

export class AuthMiddleware {
  private authToken: string;
  private jwtSecret: string;
  private env: any;
  
  constructor(authToken: string, jwtSecret: string, env?: any) {
    this.authToken = authToken;
    this.jwtSecret = jwtSecret;
    this.env = env;
  }
  
  /**
   * Verify JWT token (simplified version)
   */
  private async verifyJWT(token: string): Promise<any> {
    try {
      const [header, payload, signature] = token.split('.');
      
      // Verify signature
      const encoder = new TextEncoder();
      const data = encoder.encode(`${header}.${payload}.${this.jwtSecret}`);
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
   * Verify API key from KV storage
   */
  private async verifyApiKey(key: string): Promise<ApiKey | null> {
    if (!this.env?.SESSIONS) {
      return null;
    }
    
    try {
      // Check if API key exists and get its ID
      const keyId = await this.env.SESSIONS.get(`apikey:value:${key}`);
      if (!keyId) {
        return null;
      }
      
      // Get the full API key data
      const keyData = await this.env.SESSIONS.get(`apikey:${keyId}`);
      if (!keyData) {
        return null;
      }
      
      const apiKey: ApiKey = JSON.parse(keyData);
      
      // Check if key has expired
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return null;
      }
      
      // Update last used timestamp
      apiKey.lastUsedAt = new Date().toISOString();
      apiKey.requestCount++;
      await this.env.SESSIONS.put(`apikey:${keyId}`, JSON.stringify(apiKey));
      
      return apiKey;
    } catch (error) {
      console.error('API key verification failed:', error);
      return null;
    }
  }
  
  async verify(request: Request): Promise<{ authenticated: boolean; user?: any }> {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { authenticated: false };
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Simple token authentication (legacy support)
    if (token === this.authToken) {
      return { 
        authenticated: true,
        user: { type: 'api_token', legacy: true }
      };
    }
    
    // Check if it's an API key (starts with rtm_)
    if (token.startsWith('rtm_')) {
      const apiKey = await this.verifyApiKey(token);
      if (apiKey) {
        return {
          authenticated: true,
          user: {
            type: 'api_key',
            keyId: apiKey.id,
            userId: apiKey.userId,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit,
            ipWhitelist: apiKey.ipWhitelist
          }
        };
      }
    }
    
    // JWT authentication
    if (token.split('.').length === 3) {
      const payload = await this.verifyJWT(token);
      if (payload) {
        return {
          authenticated: true,
          user: { 
            type: 'jwt', 
            userId: payload.sub,
            email: payload.email,
            iat: payload.iat,
            exp: payload.exp
          }
        };
      }
    }
    
    return { authenticated: false };
  }
}