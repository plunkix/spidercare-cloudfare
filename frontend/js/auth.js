/**
 * Authentication functionality for SpiderCare
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (api.auth.isLoggedIn()) {
      // Redirect to chat page if on login or register page
      if (isAuthPage()) {
        window.location.href = 'chat.html';
      }
    } else {
      // Redirect to login page if on protected page
      if (isProtectedPage()) {
        redirectToLogin();
      }
    }
    
    // Set up login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    
    // Set up logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout);
    }
  });
  
  /**
   * Handle login form submission
   * @param {Event} event - Form submission event
   */
  async function handleLogin(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous alerts
    clearAlerts();
    
    try {
      // Validate inputs
      if (!email || !password) {
        showAlert('Email and password are required', 'error');
        return;
      }
      
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      
      // Call login API
      await api.auth.login({ email, password });
      
      // Redirect to chat page on success
      window.location.href = 'chat.html';
    } catch (error) {
      // Show error message
      showAlert(error.message || 'Login failed', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  }
  
  /**
   * Handle register form submission
   * @param {Event} event - Form submission event
   */
  async function handleRegister(event) {
    event.preventDefault();
    
    // Get form data
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Clear previous alerts
    clearAlerts();
    
    try {
      // Validate inputs
      if (!username || !email || !password) {
        showAlert('All fields are required', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
      }
      
      if (password.length < 8) {
        showAlert('Password must be at least 8 characters long', 'error');
        return;
      }
      
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
      
      // Call register API
      await api.auth.register({ username, email, password });
      
      // Redirect to chat page on success
      window.location.href = 'chat.html';
    } catch (error) {
      // Show error message
      showAlert(error.message || 'Registration failed', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  }
  
  /**
   * Handle logout button click
   */
  async function handleLogout() {
    try {
      await api.auth.logout();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout by clearing local storage and redirecting
      localStorage.clear();
      window.location.href = 'login.html';
    }
  }
  
  /**
   * Show an alert message
   * @param {string} message - Alert message
   * @param {string} type - Alert type ('success' or 'error')
   */
  function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alertElement.remove();
    }, 5000);
  }
  
  /**
   * Clear all alert messages
   */
  function clearAlerts() {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }
  }
  
  /**
   * Check if current page is an authentication page (login/register)
   * @returns {boolean} - Whether current page is an auth page
   */
  function isAuthPage() {
    const path = window.location.pathname;
    return path.endsWith('login.html') || path.endsWith('register.html');
  }
  
  /**
   * Check if current page is a protected page
   * @returns {boolean} - Whether current page is protected
   */
  function isProtectedPage() {
    const path = window.location.pathname;
    const publicPages = ['index.html', 'login.html', 'register.html'];
    
    // Check if current page is in the public pages list
    return !publicPages.some(page => path.endsWith(page)) && 
           !path.endsWith('/') && // Root path
           path !== ''; // Empty path
  }
  
  /**
   * Redirect to login page with return URL
   */
  function redirectToLogin() {
    const currentPage = window.location.pathname.split('/').pop();
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
  }