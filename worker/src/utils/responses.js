// Response utilities for SpiderCare

// Default headers for JSON responses
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Create a successful JSON response
  export function createResponse(data, status = 200, headers = {}) {
    const responseBody = JSON.stringify({
      success: true,
      ...data
    });
    
    return new Response(responseBody, {
      status,
      headers: {
        ...defaultHeaders,
        ...headers
      }
    });
  }
  
  // Create an error JSON response
  export function errorResponse(message, status = 400, errors = null, headers = {}) {
    const responseBody = JSON.stringify({
      success: false,
      message,
      ...(errors && { errors })
    });
    
    return new Response(responseBody, {
      status,
      headers: {
        ...defaultHeaders,
        ...headers
      }
    });
  }
  
  // Create a no content response (204)
  export function noContentResponse(headers = {}) {
    return new Response(null, {
      status: 204,
      headers: {
        ...defaultHeaders,
        ...headers
      }
    });
  }
  
  // Create a redirect response
  export function redirectResponse(url, status = 302, headers = {}) {
    return new Response(null, {
      status,
      headers: {
        ...defaultHeaders,
        Location: url,
        ...headers
      }
    });
  }
  
  // Create an HTML response
  export function htmlResponse(html, status = 200, headers = {}) {
    return new Response(html, {
      status,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        ...headers
      }
    });
  }
  
  // Create a file response
  export function fileResponse(content, contentType, filename, status = 200, headers = {}) {
    return new Response(content, {
      status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...headers
      }
    });
  }
  
  // Create a CORS preflight response
  export function corsPreflightResponse() {
    return new Response(null, {
      status: 204,
      headers: defaultHeaders
    });
  }
  
  // Create a validation error response
  export function validationErrorResponse(errors, message = 'Validation failed', headers = {}) {
    return errorResponse(message, 400, errors, headers);
  }
  
  // Create an unauthorized response
  export function unauthorizedResponse(message = 'Unauthorized', headers = {}) {
    return errorResponse(message, 401, null, headers);
  }
  
  // Create a forbidden response
  export function forbiddenResponse(message = 'Forbidden', headers = {}) {
    return errorResponse(message, 403, null, headers);
  }
  
  // Create a not found response
  export function notFoundResponse(message = 'Not found', headers = {}) {
    return errorResponse(message, 404, null, headers);
  }
  
  // Create a method not allowed response
  export function methodNotAllowedResponse(allowed = [], headers = {}) {
    return errorResponse('Method not allowed', 405, null, {
      ...headers,
      'Allow': allowed.join(', ')
    });
  }
  
  // Create a conflict response
  export function conflictResponse(message = 'Conflict', headers = {}) {
    return errorResponse(message, 409, null, headers);
  }
  
  // Create a server error response
  export function serverErrorResponse(message = 'Internal server error', headers = {}) {
    return errorResponse(message, 500, null, headers);
  }