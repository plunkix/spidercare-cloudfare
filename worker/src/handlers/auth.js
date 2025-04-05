// Authentication handler for SpiderCare

import { createResponse, errorResponse } from '../utils/responses.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation.js';
import { hashPassword, comparePasswords, generateToken } from '../utils/security.js';
import { createUser, getUserByEmail, createSession, invalidateSession } from '../services/database.js';

// Register a new user
export async function handleRegister(request, env) {
  try {
    // Parse the request body
    const body = await request.json();
    const { username, email, password } = body;
    
    // Validate input
    if (!username || !email || !password) {
      return errorResponse('All fields are required.', 400);
    }
    
    if (!validateUsername(username)) {
      return errorResponse('Username must be at least 3 characters and can only contain letters, numbers, and underscores.', 400);
    }
    
    if (!validateEmail(email)) {
      return errorResponse('Please enter a valid email address.', 400);
    }
    
    if (!validatePassword(password)) {
      return errorResponse('Password must be at least 8 characters long.', 400);
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(env.DB, email);
    if (existingUser) {
      return errorResponse('A user with this email already exists.', 409);
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = await createUser(env.DB, {
      username,
      email,
      password_hash: hashedPassword
    });
    
    // Create a session token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
    
    await createSession(env.DB, {
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString()
    });
    
    // Return success response with token
    return createResponse({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('An error occurred during registration. Please try again.', 500);
  }
}

// Login user
export async function handleLogin(request, env) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return errorResponse('Email and password are required.', 400);
    }
    
    // Get user from database
    const user = await getUserByEmail(env.DB, email);
    if (!user) {
      return errorResponse('Invalid email or password.', 401);
    }
    
    // Verify password
    const passwordValid = await comparePasswords(password, user.password_hash);
    if (!passwordValid) {
      return errorResponse('Invalid email or password.', 401);
    }
    
    // Create a session token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
    
    await createSession(env.DB, {
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString()
    });
    
    // Return success response with token
    return createResponse({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login. Please try again.', 500);
  }
}

// Logout user
export async function handleLogout(request, env) {
  try {
    // Get the token from the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Invalidate the session
    await invalidateSession(env.DB, token);
    
    // Return success response
    return createResponse({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('An error occurred during logout. Please try again.', 500);
  }
}