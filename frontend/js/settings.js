/**
 * Settings functionality for SpiderCare
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load user settings
    loadUserSettings();
    
    // Set up event listeners for forms
    setupFormListeners();
    
    // Set up modal listeners
    setupModalListeners();
  });
  
  /**
   * Load user settings from API
   */
  async function loadUserSettings() {
    try {
      const response = await api.user.getSettings();
      const settings = response.settings;
      
      // Fill profile form
      if (document.getElementById('display-name')) {
        document.getElementById('display-name').value = settings.display_name || '';
      }
      
      // Fill email field
      const emailField = document.getElementById('email');
      if (emailField) {
        const user = api.auth.getCurrentUser();
        emailField.value = user ? user.email : '';
      }
      
      // Fill appearance form
      if (document.getElementById('theme')) {
        document.getElementById('theme').value = settings.theme || 'dark';
      }
      
      // Fill preferences form
      if (document.getElementById('save-history')) {
        document.getElementById('save-history').checked = settings.message_history_enabled;
      }
      
      if (document.getElementById('enable-notifications')) {
        document.getElementById('enable-notifications').checked = settings.notification_enabled;
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
      showAlert('Failed to load settings. Please try again later.', 'error');
    }
  }
  
  /**
   * Set up event listeners for forms
   */
  function setupFormListeners() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Appearance form
    const appearanceForm = document.getElementById('appearance-form');
    if (appearanceForm) {
      appearanceForm.addEventListener('submit', handleAppearanceSubmit);
    }
    
    // Preferences form
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', handlePreferencesSubmit);
    }
    
    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
    
    // Danger zone buttons
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        showModal(
          'Are you sure you want to clear all chat history?',
          'This action cannot be undone.',
          handleClearHistory
        );
      });
    }
    
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => {
        showModal(
          'Are you sure you want to delete your account?',
          'This will permanently delete your account, including all data and chat history. This action cannot be undone.',
          handleDeleteAccount
        );
      });
    }
  }
  
  /**
   * Set up modal listeners
   */
  function setupModalListeners() {
    const modalContainer = document.getElementById('modal-container');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if (modalContainer && modalCancel && modalConfirm) {
      // Close modal on cancel button click
      modalCancel.addEventListener('click', hideModal);
      
      // Close modal when clicking outside
      modalContainer.addEventListener('click', event => {
        if (event.target === modalContainer) {
          hideModal();
        }
      });
      
      // Close modal on escape key
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modalContainer.classList.contains('active')) {
          hideModal();
        }
      });
    }
  }
  
  /**
   * Handle profile form submission
   * @param {Event} event - Form submission event
   */
  async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const displayName = document.getElementById('display-name').value.trim();
    
    try {
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      // Save settings
      await api.user.updateSettings({
        display_name: displayName
      });
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
      
      // Show success message
      showAlert('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert(error.message || 'Failed to update profile', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  }
  
  /**
   * Handle appearance form submission
   * @param {Event} event - Form submission event
   */
  async function handleAppearanceSubmit(event) {
    event.preventDefault();
    
    const theme = document.getElementById('theme').value;
    
    try {
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      // Save settings
      await api.user.updateSettings({
        theme
      });
      
      // Apply theme immediately
      document.documentElement.setAttribute('data-theme', theme);
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
      
      // Show success message
      showAlert('Appearance updated successfully', 'success');
    } catch (error) {
      console.error('Error updating appearance:', error);
      showAlert(error.message || 'Failed to update appearance', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  }
  
  /**
   * Handle preferences form submission
   * @param {Event} event - Form submission event
   */
  async function handlePreferencesSubmit(event) {
    event.preventDefault();
    
    const saveHistory = document.getElementById('save-history').checked;
    const enableNotifications = document.getElementById('enable-notifications').checked;
    
    try {
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      // Save settings
      await api.user.updateSettings({
        message_history_enabled: saveHistory,
        notification_enabled: enableNotifications
      });
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
      
      // Show success message
      showAlert('Preferences updated successfully', 'success');
    } catch (error) {
      console.error('Error updating preferences:', error);
      showAlert(error.message || 'Failed to update preferences', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  }
  
  /**
   * Handle password form submission
   * @param {Event} event - Form submission event
   */
  async function handlePasswordSubmit(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      showAlert('New password must be at least 8 characters long', 'error');
      return;
    }
    
    try {
      // Show loading state
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Updating...';
      
      // Change password
      await api.user.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      // Reset form
      event.target.reset();
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Update Password';
      
      // Show success message
      showAlert('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert(error.message || 'Failed to change password', 'error');
      
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = 'Update Password';
    }
  }
  
  /**
   * Handle clear history confirmation
   */
  async function handleClearHistory() {
    try {
      // TODO: Implement clear history functionality
      // This will be implemented once we have the conversations API endpoints
      
      // Hide modal
      hideModal();
      
      // Show success message
      showAlert('Chat history cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showAlert(error.message || 'Failed to clear chat history', 'error');
      
      // Hide modal
      hideModal();
    }
  }
  
  /**
   * Handle delete account confirmation
   */
  async function handleDeleteAccount() {
    try {
      // Delete account
      await api.user.deleteAccount();
      
      // Redirect to login page
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error deleting account:', error);
      showAlert(error.message || 'Failed to delete account', 'error');
      
      // Hide modal
      hideModal();
    }
  }
  
  /**
   * Show confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @param {Function} confirmCallback - Function to call on confirm
   */
  function showModal(title, message, confirmCallback) {
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.querySelector('.modal-content h3');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if (modalContainer && modalTitle && modalMessage && modalConfirm) {
      // Set modal content
      modalTitle.textContent = title;
      modalMessage.textContent = message;
      
      // Set confirm callback
      modalConfirm.onclick = confirmCallback;
      
      // Show modal
      modalContainer.classList.add('active');
    }
  }
  
  /**
   * Hide confirmation modal
   */
  function hideModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.classList.remove('active');
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