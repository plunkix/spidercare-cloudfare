// Authentication middleware for protected routes

import { getSessionByToken } from '../services/database.js';
import { errorResponse } from '../utils/responses.js';
import { getUserById } from '../services/database.js';

// Middleware to check if user is authenticated
export async function authMiddleware(request, env) {
  // Extract the token from the Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Authentication required', 401);
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  if (!token) {
    return errorResponse('Invalid token format', 401);
  }
  
  try {
    // Verify the token and get the session
    const session = await getSessionByToken(env.DB, token);
    
    if (!session) {
      return errorResponse('Invalid or expired token', 401);
    }
    
    // Get user info
    const user = await getUserById(env.DB, session.user_id);
    
    if (!user) {
      return errorResponse('User not found', 401);
    }
    
    // Add user info to the request object for use in handlers
    request.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    // Add session info to the request object
    request.session = {
      id: session.id,
      token: session.token,
      expires_at: session.expires_at
    };
    
    // Continue to the next middleware or handler
    return null;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse('Authentication error', 500);
  }
}