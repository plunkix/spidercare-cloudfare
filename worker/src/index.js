// Main entry point for SpiderCare Worker
import { handleRequest } from './router.js';
import { applyCorsHeaders } from './middleware/cors.js';
import { cleanupExpiredSessions } from './services/database.js';

// Export default object with methods for different events
export default {
  // Handle fetch events
  async fetch(request, env, ctx) {
    try {
      // Handle request via router
      const response = await handleRequest(request, env);
      
      // Apply CORS headers to the response
      return applyCorsHeaders(response);
    } catch (error) {
      console.error('Unhandled error:', error);
      
      // Return a generic error response
      return new Response(JSON.stringify({
        success: false,
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  },

  // Handle scheduled events
  async scheduled(event, env, ctx) {
    // Check the cron trigger
    console.log('Scheduled event triggered:', event.cron);
    
    // Run maintenance tasks
    try {
      // Clean up expired sessions
      await cleanupExpiredSessions(env.DB);
      
      console.log('Maintenance tasks completed successfully');
    } catch (error) {
      console.error('Error in maintenance tasks:', error);
    }
  }
};