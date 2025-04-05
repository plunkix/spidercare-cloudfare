// User handlers for SpiderCare

import { createResponse, errorResponse } from '../utils/responses.js';
import { validateRequired, validatePassword, validateUsername } from '../utils/validation.js';
import { hashPassword, comparePasswords } from '../utils/security.js';
import { 
  getUserSettings, 
  updateUserSettings, 
  updateUserPassword, 
  deleteUser,
  getUserById
} from '../services/database.js';

// Get user settings
export async function handleGetUserSettings(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Get settings from database
    const settings = await getUserSettings(env.DB, userId);
    
    if (!settings) {
      return errorResponse('Settings not found', 404);
    }
    
    // Return settings data
    return createResponse({
      settings: {
        display_name: settings.display_name,
        theme: settings.theme,
        message_history_enabled: Boolean(settings.message_history_enabled),
        notification_enabled: Boolean(settings.notification_enabled)
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse('An error occurred while fetching settings', 500);
  }
}

// Update user settings
export async function handleUpdateUserSettings(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Parse the request body
    const body = await request.json();
    const { display_name, theme, message_history_enabled, notification_enabled } = body;
    
    // Validate display_name if provided
    if (display_name && !validateUsername(display_name)) {
      return errorResponse('Display name must be at least 3 characters and can only contain letters, numbers, and underscores', 400);
    }
    
    // Validate theme if provided
    const validThemes = ['dark', 'light', 'system'];
    if (theme && !validThemes.includes(theme)) {
      return errorResponse('Invalid theme value', 400);
    }
    
    // Update settings in database
    await updateUserSettings(env.DB, userId, {
      display_name: display_name || null,
      theme: theme || 'dark',
      message_history_enabled: message_history_enabled === undefined ? true : Boolean(message_history_enabled),
      notification_enabled: notification_enabled === undefined ? false : Boolean(notification_enabled)
    });
    
    // Return success response
    return createResponse({
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse('An error occurred while updating settings', 500);
  }
}

// Change user password
export async function handleChangePassword(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Parse the request body
    const body = await request.json();
    const { current_password, new_password } = body;
    
    // Validate input
    if (!validateRequired(current_password) || !validateRequired(new_password)) {
      return errorResponse('Current password and new password are required', 400);
    }
    
    if (!validatePassword(new_password)) {
      return errorResponse('New password must be at least 8 characters long', 400);
    }
    
    // Get user to verify current password
    const user = await getUserById(env.DB, userId);
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // Verify current password
    const passwordValid = await comparePasswords(current_password, user.password_hash);
    
    if (!passwordValid) {
      return errorResponse('Current password is incorrect', 401);
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(new_password);
    
    // Update password in database
    await updateUserPassword(env.DB, userId, newPasswordHash);
    
    // Return success response
    return createResponse({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('An error occurred while changing password', 500);
  }
}

// Delete user account
export async function handleDeleteAccount(request, env) {
  try {
    // User is already authenticated by middleware
    const userId = request.user.id;
    
    // Delete user and all associated data
    await deleteUser(env.DB, userId);
    
    // Return success response
    return createResponse({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return errorResponse('An error occurred while deleting account', 500);
  }
}