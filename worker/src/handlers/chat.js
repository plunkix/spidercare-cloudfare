// Chat handlers for SpiderCare

import { createResponse, errorResponse } from '../utils/responses.js';
import { sanitizeString } from '../utils/security.js';
import { callGeminiAPI } from '../services/gemini.js';
import { 
  saveChatMessage, 
  getChatHistoryByConversationId, 
  getUserConversations, 
  deleteConversation,
  searchConversations,
  getUserSettings
} from '../services/database.js';
// UUID v4 implementation using the crypto API
function uuidv4() {
    return crypto.randomUUID();
  }

// Greeting messages
const GREETING_MESSAGES = [
  "Hey there! Your friendly neighborhood Spider-Therapist here! What's going on in your world today that you'd like to talk about?",
  "Web-slinging into your day! I'm your friendly neighborhood therapist. What's on your mind today?",
  "Spider-sense tingling! Seems like you might need someone to talk to. What's up?",
  "With great power comes great conversation! I'm here to listen. What would you like to discuss today?"
];

// Get a random greeting message
export async function handleGreeting(request, env) {
  try {
    const message = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
    
    return createResponse({ message });
  } catch (error) {
    console.error('Greeting error:', error);
    return errorResponse('An error occurred while getting greeting', 500);
  }
}

// Handle a chat message
export async function handleChat(request, env) {
  try {
    // Parse the request body
    const body = await request.json();
    const userMessage = body.message || '';
    const conversationId = body.conversation_id || uuidv4();
    
    // If no message, return an error
    if (!userMessage.trim()) {
      return errorResponse('Message cannot be empty', 400);
    }
    
    // Get user ID if available (authenticated user)
    let userId = null;
    let saveHistory = false;
    
    if (request.user) {
      userId = request.user.id;
      
      // Check user settings for message history
      const settings = await getUserSettings(env.DB, userId);
      if (settings && settings.message_history_enabled) {
        saveHistory = true;
      }
    }
    
    // Sanitize input
    const sanitizedMessage = sanitizeString(userMessage);
    
    // Save user message to history if enabled
    if (userId && saveHistory) {
      await saveChatMessage(env.DB, {
        user_id: userId,
        conversation_id: conversationId,
        message: sanitizedMessage,
        is_user: true
      });
    }
    
    // Call the AI service
    const response = await callGeminiAPI(sanitizedMessage, env);
    
    // Save AI response to history if enabled
    if (userId && saveHistory) {
      await saveChatMessage(env.DB, {
        user_id: userId,
        conversation_id: conversationId,
        message: response,
        is_user: false
      });
    }
    
    // Return the response
    return createResponse({
      message: response,
      conversation_id: conversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    return errorResponse('An error occurred while processing your message', 500);
  }
}

// Get chat history for a conversation
export async function handleGetChatHistory(request, env, conversationId) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Get history from database
    const result = await getChatHistoryByConversationId(env.DB, userId, conversationId);
    
    if (!result || !result.results || result.results.length === 0) {
      return errorResponse('Conversation not found', 404);
    }
    
    // Format messages
    const messages = result.results.map(msg => ({
      id: msg.id,
      message: msg.message,
      is_user: Boolean(msg.is_user),
      timestamp: msg.created_at
    }));
    
    // Return messages
    return createResponse({
      conversation_id: conversationId,
      messages
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    return errorResponse('An error occurred while fetching chat history', 500);
  }
}

// Get all conversations for a user
export async function handleGetConversations(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Get page and limit parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get conversations from database
    const result = await getUserConversations(env.DB, userId, page, limit);
    
    // Return conversations
    return createResponse(result);
  } catch (error) {
    console.error('Get conversations error:', error);
    return errorResponse('An error occurred while fetching conversations', 500);
  }
}

// Delete a conversation
export async function handleDeleteConversation(request, env, conversationId) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Delete conversation from database
    await deleteConversation(env.DB, userId, conversationId);
    
    // Return success response
    return createResponse({
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return errorResponse('An error occurred while deleting conversation', 500);
  }
}

// Search conversations
export async function handleSearchConversations(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Get query, page and limit parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // If no query, return an error
    if (!query.trim()) {
      return errorResponse('Search query cannot be empty', 400);
    }
    
    // Search conversations in database
    const result = await searchConversations(env.DB, userId, query, page, limit);
    
    // Return search results
    return createResponse(result);
  } catch (error) {
    console.error('Search conversations error:', error);
    return errorResponse('An error occurred while searching conversations', 500);
  }
}