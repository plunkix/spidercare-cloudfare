// Validation utilities for SpiderCare

// Validate email format
export function validateEmail(email) {
    if (!email) return false;
    
    // RFC 5322 compliant regex pattern for email validation
    const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return pattern.test(email);
  }
  
  // Validate password strength
  export function validatePassword(password) {
    if (!password) return false;
    
    // Basic password requirements: at least 8 characters
    return password.length >= 8;
  }
  
  // More strict password validation if needed
  export function validateStrongPassword(password) {
    if (!password) return false;
    if (password.length < 8) return false;
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) return false;
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
  }
  
  // Validate username
  export function validateUsername(username) {
    if (!username) return false;
    
    // Username requirements: 3-20 characters, alphanumeric and underscores only
    const pattern = /^[a-zA-Z0-9_]{3,20}$/;
    
    return pattern.test(username);
  }
  
  // Validate URL
  export function validateURL(url) {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  // Validate that a string is not empty
  export function validateRequired(value) {
    if (value === undefined || value === null) return false;
    return value.toString().trim().length > 0;
  }
  
  // Validate string length
  export function validateLength(str, min, max) {
    if (!str) return false;
    
    const length = str.toString().length;
    
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    
    return true;
  }
  
  // Validate number range
  export function validateNumberRange(num, min, max) {
    if (num === undefined || num === null) return false;
    
    const number = Number(num);
    
    if (isNaN(number)) return false;
    if (min !== undefined && number < min) return false;
    if (max !== undefined && number > max) return false;
    
    return true;
  }
  
  // Validate form data against a schema
  export function validateFormData(data, schema) {
    const errors = {};
    
    for (const field in schema) {
      const value = data[field];
      const validations = schema[field];
      
      // Check if field is required
      if (validations.required && !validateRequired(value)) {
        errors[field] = `${field} is required`;
        continue;
      }
      
      // Skip other validations if value is empty and not required
      if (!value && !validations.required) continue;
      
      // Check type
      if (validations.type) {
        let isValidType = true;
        
        switch (validations.type) {
          case 'email':
            isValidType = validateEmail(value);
            break;
          case 'url':
            isValidType = validateURL(value);
            break;
          case 'number':
            isValidType = !isNaN(Number(value));
            break;
          case 'integer':
            isValidType = Number.isInteger(Number(value));
            break;
          case 'boolean':
            isValidType = typeof value === 'boolean' || value === 'true' || value === 'false';
            break;
        }
        
        if (!isValidType) {
          errors[field] = `${field} is not a valid ${validations.type}`;
          continue;
        }
      }
      
      // Check min/max length
      if ((validations.minLength !== undefined || validations.maxLength !== undefined) && 
          !validateLength(value, validations.minLength, validations.maxLength)) {
        let errorMsg = `${field} must be`;
        
        if (validations.minLength !== undefined && validations.maxLength !== undefined) {
          errorMsg += ` between ${validations.minLength} and ${validations.maxLength} characters`;
        } else if (validations.minLength !== undefined) {
          errorMsg += ` at least ${validations.minLength} characters`;
        } else {
          errorMsg += ` at most ${validations.maxLength} characters`;
        }
        
        errors[field] = errorMsg;
        continue;
      }
      
      // Check number range
      if ((validations.min !== undefined || validations.max !== undefined) && 
          !validateNumberRange(value, validations.min, validations.max)) {
        let errorMsg = `${field} must be`;
        
        if (validations.min !== undefined && validations.max !== undefined) {
          errorMsg += ` between ${validations.min} and ${validations.max}`;
        } else if (validations.min !== undefined) {
          errorMsg += ` at least ${validations.min}`;
        } else {
          errorMsg += ` at most ${validations.max}`;
        }
        
        errors[field] = errorMsg;
        continue;
      }
      
      // Check pattern
      if (validations.pattern && !validations.pattern.test(value)) {
        errors[field] = validations.patternError || `${field} does not match the required pattern`;
        continue;
      }
      
      // Custom validation
      if (validations.validate && typeof validations.validate === 'function') {
        const result = validations.validate(value, data);
        
        if (result !== true) {
          errors[field] = result || `${field} failed validation`;
          continue;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }