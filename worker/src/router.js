// Router for SpiderCare Worker

import { 
    errorResponse, 
    corsPreflightResponse, 
    methodNotAllowedResponse 
  } from './utils/responses.js';
  
  import { handleRegister, handleLogin, handleLogout } from './handlers/auth.js';
  import { handleGreeting, handleChat } from './handlers/chat.js';
  import { 
    handleGetUserSettings, 
    handleUpdateUserSettings, 
    handleChangePassword,
    handleDeleteAccount 
  } from './handlers/user.js';
  import { 
    handleGetChatHistory, 
    handleGetConversations, 
    handleDeleteConversation,
    handleSearchConversations 
  } from './handlers/chat.js';
  import { handleServeStatic } from './handlers/static.js';
  
  import { authMiddleware } from './middleware/auth.js';
  
  // Define routes and their handlers
  const routes = [
    // Auth routes (no auth required)
    { 
      path: '/api/auth/register', 
      methods: { 
        POST: handleRegister
      }
    },
    { 
      path: '/api/auth/login', 
      methods: { 
        POST: handleLogin
      }
    },
    {
      path: '/api/auth/logout',
      methods: {
        POST: handleLogout
      },
      middleware: [authMiddleware]
    },
    
    // Chat routes
    {
      path: '/api/greeting',
      methods: {
        GET: handleGreeting
      }
    },
    {
      path: '/api/chat',
      methods: {
        POST: handleChat
      }
    },
    
    // User routes (auth required)
    {
      path: '/api/user/settings',
      methods: {
        GET: handleGetUserSettings,
        PUT: handleUpdateUserSettings
      },
      middleware: [authMiddleware]
    },
    {
      path: '/api/user/change-password',
      methods: {
        POST: handleChangePassword
      },
      middleware: [authMiddleware]
    },
    {
      path: '/api/user/delete-account',
      methods: {
        DELETE: handleDeleteAccount
      },
      middleware: [authMiddleware]
    },
    
    // Chat history routes (auth required)
    {
      path: '/api/history',
      methods: {
        GET: handleGetConversations
      },
      middleware: [authMiddleware]
    },
    {
      path: '/api/history/search',
      methods: {
        GET: handleSearchConversations
      },
      middleware: [authMiddleware]
    },
    {
      pattern: /^\/api\/history\/([a-zA-Z0-9-]+)$/,
      methods: {
        GET: (request, env, params) => handleGetChatHistory(request, env, params[1]),
        DELETE: (request, env, params) => handleDeleteConversation(request, env, params[1])
      },
      middleware: [authMiddleware]
    },
    
    // Catch all for static files
    {
      pattern: /^\/(.*)$/,
      methods: {
        GET: (request, env, params) => handleServeStatic(request, env, params[1])
      }
    }
  ];
  
  // Main router function
  export async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return corsPreflightResponse();
    }
    
    // Find a matching route
    let matchedRoute = null;
    let matchParams = [];
    
    for (const route of routes) {
      if (route.path && route.path === path) {
        matchedRoute = route;
        break;
      } else if (route.pattern) {
        const match = path.match(route.pattern);
        if (match) {
          matchedRoute = route;
          matchParams = match.slice(1);
          break;
        }
      }
    }
    
    // Return 404 if no route is found
    if (!matchedRoute) {
      return errorResponse('Not found', 404);
    }
    
    // Check if method is allowed for this route
    if (!matchedRoute.methods[method]) {
      const allowedMethods = Object.keys(matchedRoute.methods).join(', ');
      return methodNotAllowedResponse([allowedMethods]);
    }
    
    // Process middleware if any
    if (matchedRoute.middleware && matchedRoute.middleware.length > 0) {
      for (const middleware of matchedRoute.middleware) {
        const middlewareResult = await middleware(request, env);
        
        // If middleware returns a Response, return it immediately
        if (middlewareResult instanceof Response) {
          return middlewareResult;
        }
        
        // Otherwise, middleware may modify the request object
      }
    }
    
    try {
      // Call the handler with the matched params
      return await matchedRoute.methods[method](request, env, matchParams);
    } catch (error) {
      console.error('Route handler error:', error);
      return errorResponse('Internal server error', 500);
    }
  }