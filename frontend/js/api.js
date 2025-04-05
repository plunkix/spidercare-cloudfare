/**
 * API client for SpiderCare
 * Handles all API requests to the backend
 */

// API endpoint - replace with your Cloudflare Worker URL when deployed
const API_BASE_URL = 'https://spidercare.tathesrushti.workers.dev';

// Storage keys
const TOKEN_KEY = 'spidercare_token';
const USER_KEY = 'spidercare_user';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request body data
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<object>} - API response
 */
async function apiRequest(endpoint, method = 'GET', data = null, requiresAuth = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication token if required
  if (requiresAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error('Authentication required');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    credentials: 'omit' // Don't send cookies
  };
  
  // Add request body for non-GET requests
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  // Make the request
  const response = await fetch(url, options);
  
  // Parse the JSON response
  const responseData = await response.json();
  
  // Handle API errors
  if (!response.ok) {
    throw new Error(responseData.message || 'An error occurred');
  }
  
  return responseData;
}

/**
 * Auth API
 */
const auth = {
  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} - Registration response
   */
  async register(userData) {
    const response = await apiRequest('/api/auth/register', 'POST', userData);
    
    // Store token and user data
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * Log in a user
   * @param {object} credentials - User login credentials
   * @returns {Promise<object>} - Login response
   */
  async login(credentials) {
    const response = await apiRequest('/api/auth/login', 'POST', credentials);
    
    // Store token and user data
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    return response;
  },
  
  /**
   * Log out the current user
   * @returns {Promise<object>} - Logout response
   */
  async logout() {
    try {
      // Call the logout API
      await apiRequest('/api/auth/logout', 'POST', null, true);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
  
  /**
   * Check if a user is logged in
   * @returns {boolean} - Whether a user is logged in
   */
  isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Get the current user data
   * @returns {object|null} - User data or null if not logged in
   */
  getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
};

/**
 * Chat API
 */
const chat = {
  /**
   * Get a greeting message
   * @returns {Promise<object>} - Greeting response
   */
  async getGreeting() {
    return await apiRequest('/api/greeting');
  },
  
  /**
   * Send a chat message
   * @param {string} message - User message
   * @param {string} conversationId - Conversation ID (optional)
   * @returns {Promise<object>} - Chat response
   */
  async sendMessage(message, conversationId = null) {
    const data = {
      message
    };
    
    if (conversationId) {
      data.conversation_id = conversationId;
    }
    
    return await apiRequest('/api/chat', 'POST', data, auth.isLoggedIn());
  },
  
  /**
   * Get chat history for a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<object>} - Chat history response
   */
  async getHistory(conversationId) {
    return await apiRequest(`/api/history/${conversationId}`, 'GET', null, true);
  },
  
  /**
   * Get all conversations for the current user
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} - Conversations response
   */
  async getConversations(page = 1, limit = 10) {
    return await apiRequest(`/api/history?page=${page}&limit=${limit}`, 'GET', null, true);
  },
  
  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<object>} - Delete response
   */
  async deleteConversation(conversationId) {
    return await apiRequest(`/api/history/${conversationId}`, 'DELETE', null, true);
  },
  
  /**
   * Search conversations
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} - Search response
   */
  async searchConversations(query, page = 1, limit = 10) {
    return await apiRequest(`/api/history/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, 'GET', null, true);
  }
};

/**
 * User API
 */
const user = {
  /**
   * Get user settings
   * @returns {Promise<object>} - Settings response
   */
  async getSettings() {
    return await apiRequest('/api/user/settings', 'GET', null, true);
  },
  
  /**
   * Update user settings
   * @param {object} settings - User settings
   * @returns {Promise<object>} - Update response
   */
  async updateSettings(settings) {
    return await apiRequest('/api/user/settings', 'PUT', settings, true);
  },
  
  /**
   * Change user password
   * @param {object} passwordData - Password change data
   * @returns {Promise<object>} - Change password response
   */
  async changePassword(passwordData) {
    return await apiRequest('/api/user/change-password', 'POST', passwordData, true);
  },
  
  /**
   * Delete user account
   * @returns {Promise<object>} - Delete account response
   */
  async deleteAccount() {
    const response = await apiRequest('/api/user/delete-account', 'DELETE', null, true);
    
    // Clear local storage on successful account deletion
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    return response;
  }
};

// Export the API client
window.api = {
  auth,
  chat,
  user
};