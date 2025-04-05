// Main entry point for SpiderCare Worker

import { handleRequest } from './router.js';
import { applyCorsHeaders } from './middleware/cors.js';
import { cleanupExpiredSessions } from './services/database.js';

// Handle fetch events
addEventListener('fetch', event => {
  event.respondWith(handleFetchEvent(event));
});

// Process fetch events through middleware and router
async function handleFetchEvent(event) {
  try {
    // Get the request
    const request = event.request;
    
    // Handle request via router
    const response = await handleRequest(request, event.env);
    
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
}

// Handle scheduled events (e.g., for maintenance tasks)
addEventListener('scheduled', event => {
  event.waitUntil(handleScheduledEvent(event));
});

// Process scheduled events
async function handleScheduledEvent(event) {
  // Check the cron trigger
  console.log('Scheduled event triggered:', event.cron);
  
  // Run maintenance tasks
  await runMaintenanceTasks(event.env);
}

// Run periodic maintenance tasks
async function runMaintenanceTasks(env) {
  try {
    // Clean up expired sessions
    await cleanupExpiredSessions(env.DB);
    
    console.log('Maintenance tasks completed successfully');
  } catch (error) {
    console.error('Error in maintenance tasks:', error);
  }
}