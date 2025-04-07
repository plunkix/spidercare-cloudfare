// Static file handler for SpiderCare

import { htmlResponse, errorResponse } from '../utils/responses.js';

// Content type map for common file extensions
const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Serve static files
export async function handleServeStatic(request, env, path) {
  // Default to index.html for root path
  if (!path || path === '' || path === '/') {
    path = 'index.html';
  }
  
  // Safely get extension
  const lastDotIndex = path.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? path.substring(lastDotIndex) : '';
  const contentType = contentTypes[extension] || 'text/plain';
  
  try {
    // In a real implementation, you would:
    // 1. Check if the file exists in Cloudflare R2, KV, or Assets
    // 2. Return the file if it exists
    // 3. Return a 404 if it doesn't
    
    // For this implementation, we'll return a simple placeholder message
    // that indicates the frontend files should be served from a static hosting
    // solution in production.
    
    if (path === 'index.html') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SpiderCare Static Files</title>
          <style>
            body {
              font-family: 'Montserrat', sans-serif;
              color: #e0e6f2;
              background-color: #0a1428;
              padding: 2rem;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: #111c33;
              padding: 2rem;
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
            h1 {
              color: #e62429;
              margin-bottom: 1rem;
            }
            a {
              color: #e62429;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            code {
              background-color: #0d2456;
              padding: 0.2rem 0.4rem;
              border-radius: 4px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>SpiderCare Static File Serving</h1>
            <p>This is a placeholder for the static file serving functionality. In production, you should:</p>
            <ol>
              <li>Deploy your frontend files to a static hosting service (like Cloudflare Pages)</li>
              <li>Configure your Worker to either serve files from Cloudflare R2/KV/Assets or proxy to the static hosting</li>
            </ol>
            <p>You requested the file: <code>${path}</code></p>
            <p>For local development, you can serve the frontend files using a simple HTTP server:</p>
            <pre><code>cd frontend
npx http-server</code></pre>
            <p><a href="https://developers.cloudflare.com/workers/tutorials/configure-your-cdn/">Learn more about configuring Cloudflare Workers with static assets</a></p>
          </div>
        </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html'
        }
      });
    }
    
    // Return a placeholder message for all other files
    return new Response(`
      This is a placeholder for the static file: ${path}
      
      In production, this would be served from Cloudflare Pages, R2, or KV storage.
    `, {
      headers: {
        'Content-Type': contentType
      }
    });
    
  } catch (error) {
    console.error('Static file error:', error);
    return errorResponse('Error serving static file', 500);
  }
}