/**
 * Chat history functionality for SpiderCare
 */

// Current pagination state
let currentPage = 1;
let totalPages = 1;
let selectedConversationId = null;

document.addEventListener('DOMContentLoaded', function() {
  // Load conversations
  loadConversations(1);
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Search button
  const searchButton = document.getElementById('search-button');
  if (searchButton) {
    searchButton.addEventListener('click', handleSearch);
  }
  
  // Search input (enter key)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  // Pagination buttons
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  
  if (prevPageButton) {
    prevPageButton.addEventListener('click', () => {
      if (currentPage > 1) {
        loadConversations(currentPage - 1);
      }
    });
  }
  
  if (nextPageButton) {
    nextPageButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        loadConversations(currentPage + 1);
      }
    });
  }
  
  // Continue chat button
  const continueChat = document.getElementById('continue-chat');
  if (continueChat) {
    continueChat.addEventListener('click', () => {
      if (selectedConversationId) {
        window.location.href = `chat.html?conversation=${selectedConversationId}`;
      }
    });
  }
  
  // Delete conversation button
  const deleteConversation = document.getElementById('delete-conversation');
  if (deleteConversation) {
    deleteConversation.addEventListener('click', () => {
      if (selectedConversationId) {
        showModal(
          'Delete Conversation',
          'Are you sure you want to delete this conversation? This action cannot be undone.',
          handleDeleteConversation
        );
      }
    });
  }
  
  // Modal buttons
  const modalContainer = document.getElementById('modal-container');
  const modalCancel = document.getElementById('modal-cancel');
  
  if (modalContainer && modalCancel) {
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
 * Load conversations from API
 * @param {number} page - Page number to load
 */
async function loadConversations(page = 1) {
  try {
    // Show loading state
    showLoading();
    
    // Call the API
    const response = await api.chat.getConversations(page);
    
    // Update pagination state
    currentPage = response.pagination.page;
    totalPages = response.pagination.pages;
    
    // Update pagination UI
    updatePagination(response.pagination);
    
    // Hide loading
    hideLoading();
    
    // Display conversations
    displayConversations(response.conversations);
  } catch (error) {
    console.error('Error loading conversations:', error);
    hideLoading();
    showAlert('Failed to load conversations. Please try again later.', 'error');
  }
}

/**
 * Handle search button click
 */
async function handleSearch() {
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();
  
  if (!query) {
    // If search is empty, load all conversations
    loadConversations(1);
    return;
  }
  
  try {
    // Show loading state
    showLoading();
    
    // Call the search API
    const response = await api.chat.searchConversations(query);
    
    // Update pagination state
    currentPage = response.pagination.page;
    totalPages = response.pagination.pages;
    
    // Update pagination UI
    updatePagination(response.pagination);
    
    // Hide loading
    hideLoading();
    
    // Display conversations
    displayConversations(response.conversations);
  } catch (error) {
    console.error('Error searching conversations:', error);
    hideLoading();
    showAlert('Search failed. Please try again later.', 'error');
  }
}

/**
 * Display conversations in the list
 * @param {Array} conversations - List of conversations
 */
function displayConversations(conversations) {
  const conversationsList = document.getElementById('conversations-list');
  const emptyState = document.getElementById('empty-state');
  
  // Clear current conversations
  conversationsList.innerHTML = '';
  
  // Show empty state if no conversations
  if (!conversations || conversations.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'flex';
    }
    return;
  }
  
  // Hide empty state
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // Add each conversation to the list
  conversations.forEach(conversation => {
    const conversationItem = document.createElement('div');
    conversationItem.className = 'conversation-item';
    conversationItem.dataset.id = conversation.id;
    
    // Format dates
    const createdDate = new Date(conversation.created_at);
    const lastMessageDate = new Date(conversation.last_message);
    
    conversationItem.innerHTML = `
      <div class="conversation-date">${formatDate(createdDate)}</div>
      <div class="conversation-preview">${truncateText(conversation.preview, 100)}</div>
    `;
    
    // Add click event to load conversation
    conversationItem.addEventListener('click', () => {
      // Remove active class from all items
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked item
      conversationItem.classList.add('active');
      
      // Load conversation details
      loadConversationDetails(conversation.id);
    });
    
    conversationsList.appendChild(conversationItem);
  });
}

/**
 * Load conversation details
 * @param {string} conversationId - Conversation ID
 */
async function loadConversationDetails(conversationId) {
  try {
    // Show loading
    const conversationMessages = document.getElementById('conversation-messages');
    conversationMessages.innerHTML = '<div class="loading-indicator"><div class="loading-spinner"></div><p>Loading conversation...</p></div>';
    
    // Update selected conversation
    selectedConversationId = conversationId;
    
    // Enable action buttons
    document.getElementById('continue-chat').disabled = false;
    document.getElementById('delete-conversation').disabled = false;
    
    // Update details header
    const detailsHeader = document.querySelector('.details-header');
    detailsHeader.innerHTML = '<h3>Loading conversation...</h3>';
    
    // Get conversation details
    const response = await api.chat.getHistory(conversationId);
    
    // Update header
    const firstMessageDate = new Date(response.messages[0].timestamp);
    detailsHeader.innerHTML = `
      <h3>Conversation from ${formatDate(firstMessageDate)}</h3>
      <p>${response.messages.length} messages</p>
    `;
    
    // Display messages
    conversationMessages.innerHTML = '';
    
    response.messages.forEach(msg => {
      const messageRow = document.createElement('div');
      messageRow.classList.add('message-row');
      
      if (msg.is_user) {
        messageRow.classList.add('user-message-row');
        messageRow.innerHTML = `
          <div class="message user-message">${msg.message}</div>
          <div class="avatar user-avatar">
            <svg class="user-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
            </svg>
          </div>
        `;
      } else {
        messageRow.classList.add('spider-message-row');
        messageRow.innerHTML = `
          <div class="avatar spider-avatar">
            <svg class="spider-icon" viewBox="0 0 24 24">
              <path d="M16.5,5.5C17.6,5.5 18.5,4.6 18.5,3.5C18.5,2.4 17.6,1.5 16.5,1.5C15.4,1.5 14.5,2.4 14.5,3.5C14.5,4.6 15.4,5.5 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9C3.45,9 3,8.55 3,8C3,7.45 3.45,7 4,7H7V9H4M5,5C4.45,5 4,4.55 4,4C4,3.45 4.45,3 5,3H10V5H5M2,11C1.45,11 1,10.55 1,10C1,9.45 1.45,9 2,9H7V11H2Z"/>
            </svg>
          </div>
          <div class="message spider-message">${msg.message}</div>
        `;
      }
      
      conversationMessages.appendChild(messageRow);
    });
    
  } catch (error) {
    console.error('Error loading conversation details:', error);
    
    // Show error message
    const conversationMessages = document.getElementById('conversation-messages');
    conversationMessages.innerHTML = '<div class="error-message">Failed to load conversation details. Please try again.</div>';
    
    // Update header
    const detailsHeader = document.querySelector('.details-header');
    detailsHeader.innerHTML = `
      <h3>Error Loading Conversation</h3>
      <p>Could not load the conversation details.</p>
    `;
  }
}

/**
 * Handle delete conversation confirmation
 */
async function handleDeleteConversation() {
  if (!selectedConversationId) {
    hideModal();
    return;
  }
  
  try {
    // Show loading
    const modalConfirm = document.getElementById('modal-confirm');
    modalConfirm.textContent = 'Deleting...';
    modalConfirm.disabled = true;
    
    // Delete conversation
    await api.chat.deleteConversation(selectedConversationId);
    
    // Hide modal
    hideModal();
    
    // Reload conversations
    loadConversations(currentPage);
    
    // Clear details
    clearConversationDetails();
    
    // Show success message
    showAlert('Conversation deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting conversation:', error);
    
    // Reset button
    const modalConfirm = document.getElementById('modal-confirm');
    modalConfirm.textContent = 'Delete';
    modalConfirm.disabled = false;
    
    // Show error
    showAlert('Failed to delete conversation. Please try again.', 'error');
    
    // Hide modal
    hideModal();
  }
}

/**
 * Clear conversation details
 */
function clearConversationDetails() {
  // Reset selected conversation
  selectedConversationId = null;
  
  // Disable action buttons
  document.getElementById('continue-chat').disabled = true;
  document.getElementById('delete-conversation').disabled = true;
  
  // Clear conversation messages
  const conversationMessages = document.getElementById('conversation-messages');
  conversationMessages.innerHTML = '';
  
  // Reset details header
  const detailsHeader = document.querySelector('.details-header');
  detailsHeader.innerHTML = `
    <h3>Select a Conversation</h3>
    <p>Click on a conversation to view its details</p>
  `;
}

/**
 * Update pagination UI
 * @param {object} pagination - Pagination data
 */
function updatePagination(pagination) {
  const pageInfo = document.getElementById('page-info');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  
  if (pageInfo) {
    pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
  }
  
  if (prevPageButton) {
    prevPageButton.disabled = pagination.page <= 1;
  }
  
  if (nextPageButton) {
    nextPageButton.disabled = pagination.page >= pagination.pages;
  }
}

/**
 * Show loading indicator
 */
function showLoading() {
  const conversationsList = document.getElementById('conversations-list');
  const emptyState = document.getElementById('empty-state');
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  conversationsList.innerHTML = '<div class="loading-indicator"><div class="loading-spinner"></div><p>Loading conversations...</p></div>';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  // Loading will be replaced when conversations are displayed
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
    modalConfirm.textContent = 'Delete';
    modalConfirm.disabled = false;
    
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

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  // Check if date is valid
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Invalid date';
  }
  
  // Format: Mon, Jan 1, 2023
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Truncate text to a certain length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}