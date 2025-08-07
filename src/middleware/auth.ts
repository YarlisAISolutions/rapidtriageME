/**
 * Authentication Middleware for RapidTriageME
 * Handles token-based and JWT authentication
 */

export class AuthMiddleware {
  private authToken: string;
  // private jwtSecret: string;
  
  constructor(authToken: string, _jwtSecret: string) {
    this.authToken = authToken;
    // this.jwtSecret = _jwtSecret;
  }
  
  async verify(request: Request): Promise<{ authenticated: boolean; user?: any }> {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { authenticated: false };
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Simple token authentication
    if (token === this.authToken) {
      return { 
        authenticated: true,
        user: { type: 'api_token' }
      };
    }
    
    // JWT authentication (would need proper JWT library in production)
    try {
      // For demo purposes, just check if it's a valid format
      if (token.split('.').length === 3) {
        // In production, properly verify JWT signature
        return {
          authenticated: true,
          user: { type: 'jwt', payload: {} }
        };
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
    
    return { authenticated: false };
  }
}