// Security utilities for SpiderCare

// Since Cloudflare Workers don't have node's crypto module,
// we'll use Web Crypto API for cryptographic operations

// Hash a password
export async function hashPassword(password) {
    // Convert password string to buffer
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Generate a salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Hash the password with salt
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      concatBuffers(salt, data)
    );
    
    // Convert buffers to Base64 strings
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return the salt and hash separated by a colon
    return `${saltHex}:${hashHex}`;
  }
  
  // Compare a password with a hash
  export async function comparePasswords(password, storedHash) {
    // Split the stored hash into salt and hash
    const [saltHex, hash] = storedHash.split(':');
    
    // Convert salt from hex to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Convert password string to buffer
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Hash the password with the extracted salt
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      concatBuffers(salt, data)
    );
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare the hashes
    return hash === newHash;
  }
  
  // Generate a random token for user sessions
  export function generateToken(length = 64) {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Helper function to concatenate two Uint8Arrays
  function concatBuffers(buffer1, buffer2) {
    const result = new Uint8Array(buffer1.length + buffer2.length);
    result.set(buffer1, 0);
    result.set(buffer2, buffer1.length);
    return result;
  }
  
  // Sanitize a string to prevent XSS attacks
  export function sanitizeString(str) {
    if (!str) return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }