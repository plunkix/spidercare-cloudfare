// Database service for SpiderCare
// Provides functions to interact with Cloudflare D1 database

// ==================== User Operations ====================

// Create a new user
export async function createUser(db, userData) {
    const { username, email, password_hash } = userData;
    
    try {
      const result = await db.prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?) RETURNING id'
      )
      .bind(username, email, password_hash)
      .first();
      
      // Create default settings for the user
      await createUserSettings(db, result.id);
      
      return result.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Get user by email
  export async function getUserByEmail(db, email) {
    try {
      return await db.prepare(
        'SELECT * FROM users WHERE email = ?'
      )
      .bind(email)
      .first();
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
  
  // Get user by ID
  export async function getUserById(db, userId) {
    try {
      return await db.prepare(
        'SELECT * FROM users WHERE id = ?'
      )
      .bind(userId)
      .first();
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
  
  // Update user
  export async function updateUser(db, userId, userData) {
    const { username, email } = userData;
    
    try {
      await db.prepare(
        'UPDATE users SET username = ?, email = ? WHERE id = ?'
      )
      .bind(username, email, userId)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Update user password
  export async function updateUserPassword(db, userId, passwordHash) {
    try {
      await db.prepare(
        'UPDATE users SET password_hash = ? WHERE id = ?'
      )
      .bind(passwordHash, userId)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }
  
  // Delete user and all associated data
  export async function deleteUser(db, userId) {
    try {
      // Start a transaction to delete all user data
      await db.exec('BEGIN TRANSACTION');
      
      // Delete sessions
      await db.prepare('DELETE FROM sessions WHERE user_id = ?')
        .bind(userId)
        .run();
        
      // Delete chat history
      await db.prepare('DELETE FROM chat_history WHERE user_id = ?')
        .bind(userId)
        .run();
        
      // Delete settings
      await db.prepare('DELETE FROM user_settings WHERE user_id = ?')
        .bind(userId)
        .run();
        
      // Delete user
      await db.prepare('DELETE FROM users WHERE id = ?')
        .bind(userId)
        .run();
        
      await db.exec('COMMIT');
      return true;
    } catch (error) {
      await db.exec('ROLLBACK');
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  // ==================== Session Operations ====================
  
  // Create a new session
  export async function createSession(db, sessionData) {
    const { user_id, token, expires_at } = sessionData;
    
    try {
      await db.prepare(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
      )
      .bind(user_id, token, expires_at)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
  
  // Get session by token
  export async function getSessionByToken(db, token) {
    try {
      return await db.prepare(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      )
      .bind(token)
      .first();
    } catch (error) {
      console.error('Error getting session by token:', error);
      throw error;
    }
  }
  
  // Invalidate a session
  export async function invalidateSession(db, token) {
    try {
      await db.prepare(
        'DELETE FROM sessions WHERE token = ?'
      )
      .bind(token)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }
  
  // Invalidate all sessions for a user
  export async function invalidateUserSessions(db, userId) {
    try {
      await db.prepare(
        'DELETE FROM sessions WHERE user_id = ?'
      )
      .bind(userId)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      throw error;
    }
  }
  
  // Clean up expired sessions
  export async function cleanupExpiredSessions(db) {
    try {
      await db.prepare(
        'DELETE FROM sessions WHERE expires_at <= datetime("now")'
      )
      .run();
      
      return true;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }
  
  // ==================== Chat History Operations ====================
  
  // Save a chat message
  export async function saveChatMessage(db, messageData) {
    const { user_id, conversation_id, message, is_user } = messageData;
    
    try {
      await db.prepare(
        'INSERT INTO chat_history (user_id, conversation_id, message, is_user) VALUES (?, ?, ?, ?)'
      )
      .bind(user_id, conversation_id, message, is_user ? 1 : 0)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }
  
  // Get chat history by conversation ID
  export async function getChatHistoryByConversationId(db, userId, conversationId) {
    try {
      return await db.prepare(
        'SELECT * FROM chat_history WHERE user_id = ? AND conversation_id = ? ORDER BY created_at ASC'
      )
      .bind(userId, conversationId)
      .all();
    } catch (error) {
      console.error('Error getting chat history by conversation ID:', error);
      throw error;
    }
  }
  
  // Get all conversations for a user
  export async function getUserConversations(db, userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    try {
      // Get distinct conversation IDs with their latest message timestamp
      const result = await db.prepare(`
        SELECT conversation_id, MAX(created_at) as last_message
        FROM chat_history
        WHERE user_id = ?
        GROUP BY conversation_id
        ORDER BY last_message DESC
        LIMIT ? OFFSET ?
      `)
      .bind(userId, limit, offset)
      .all();
      
      // Get the first message of each conversation for a preview
      const conversations = [];
      for (const row of result.results) {
        const firstMessage = await db.prepare(`
          SELECT message, is_user, created_at
          FROM chat_history
          WHERE user_id = ? AND conversation_id = ?
          ORDER BY created_at ASC
          LIMIT 1
        `)
        .bind(userId, row.conversation_id)
        .first();
        
        conversations.push({
          id: row.conversation_id,
          preview: firstMessage.message,
          created_at: firstMessage.created_at,
          last_message: row.last_message
        });
      }
      
      // Get the total count for pagination
      const countResult = await db.prepare(`
        SELECT COUNT(DISTINCT conversation_id) as total
        FROM chat_history
        WHERE user_id = ?
      `)
      .bind(userId)
      .first();
      
      return {
        conversations,
        pagination: {
          total: countResult.total,
          page,
          limit,
          pages: Math.ceil(countResult.total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }
  
  // Delete a conversation
  export async function deleteConversation(db, userId, conversationId) {
    try {
      await db.prepare(
        'DELETE FROM chat_history WHERE user_id = ? AND conversation_id = ?'
      )
      .bind(userId, conversationId)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
  
  // Search conversations
  export async function searchConversations(db, userId, query, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;
    
    try {
      // Get distinct conversation IDs that match the search term
      const result = await db.prepare(`
        SELECT DISTINCT conversation_id
        FROM chat_history
        WHERE user_id = ? AND message LIKE ?
        LIMIT ? OFFSET ?
      `)
      .bind(userId, searchTerm, limit, offset)
      .all();
      
      // Get details for each matching conversation
      const conversations = [];
      for (const row of result.results) {
        // Get the first message containing the search term
        const matchingMessage = await db.prepare(`
          SELECT message, is_user, created_at
          FROM chat_history
          WHERE user_id = ? AND conversation_id = ? AND message LIKE ?
          ORDER BY created_at ASC
          LIMIT 1
        `)
        .bind(userId, row.conversation_id, searchTerm)
        .first();
        
        // Get the first message of the conversation for context
        const firstMessage = await db.prepare(`
          SELECT message, created_at
          FROM chat_history
          WHERE user_id = ? AND conversation_id = ?
          ORDER BY created_at ASC
          LIMIT 1
        `)
        .bind(userId, row.conversation_id)
        .first();
        
        // Get the last message timestamp
        const lastMessage = await db.prepare(`
          SELECT created_at
          FROM chat_history
          WHERE user_id = ? AND conversation_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `)
        .bind(userId, row.conversation_id)
        .first();
        
        conversations.push({
          id: row.conversation_id,
          preview: firstMessage.message,
          matchingMessage: matchingMessage.message,
          created_at: firstMessage.created_at,
          last_message: lastMessage.created_at
        });
      }
      
      // Get the total count for pagination
      const countResult = await db.prepare(`
        SELECT COUNT(DISTINCT conversation_id) as total
        FROM chat_history
        WHERE user_id = ? AND message LIKE ?
      `)
      .bind(userId, searchTerm)
      .first();
      
      return {
        conversations,
        pagination: {
          total: countResult.total,
          page,
          limit,
          pages: Math.ceil(countResult.total / limit)
        }
      };
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }
  
  // ==================== User Settings Operations ====================
  
  // Create default settings for a new user
  export async function createUserSettings(db, userId) {
    try {
      await db.prepare(
        'INSERT INTO user_settings (user_id, display_name, theme, message_history_enabled, notification_enabled) VALUES (?, NULL, "dark", 1, 0)'
      )
      .bind(userId)
      .run();
      
      return true;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }
  
  // Get user settings
  export async function getUserSettings(db, userId) {
    try {
      return await db.prepare(
        'SELECT * FROM user_settings WHERE user_id = ?'
      )
      .bind(userId)
      .first();
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }
  
  // Update user settings
  export async function updateUserSettings(db, userId, settings) {
    const { display_name, theme, message_history_enabled, notification_enabled } = settings;
    
    try {
      await db.prepare(
        'UPDATE user_settings SET display_name = ?, theme = ?, message_history_enabled = ?, notification_enabled = ? WHERE user_id = ?'
      )
      .bind(
        display_name,
        theme,
        message_history_enabled ? 1 : 0,
        notification_enabled ? 1 : 0,
        userId
      )
      .run();
      
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }