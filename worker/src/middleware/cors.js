// CORS middleware for SpiderCare

// Default CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  // Apply CORS headers to a response
  export function applyCorsHeaders(response) {
    const newHeaders = new Headers(response.headers);
    
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
  
  // Handle CORS preflight requests
  export function handleCorsOptions() {
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  
  // CORS middleware to be used in the request pipeline
  export async function corsMiddleware(request, env) {
    // For preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsOptions();
    }
    
    // For normal requests, we'll apply headers to the final response
    // but let the request continue to the actual handler
    return null;
  }