/**
 * Chat functionality for SpiderCare
 */

// Current conversation state
let currentConversationId = null;

document.addEventListener('DOMContentLoaded', function() {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  // Check if conversation ID is in URL
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation');
  
  if (conversationId) {
    // Load existing conversation
    currentConversationId = conversationId;
    loadConversation(conversationId);
  } else {
    // Load greeting message
    loadGreeting();
  }
  
  // Set up event listeners
  sendButton.addEventListener('click', handleSendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });
  
  // Focus input field
  userInput.focus();
});

/**
 * Load greeting message
 */
async function loadGreeting() {
  try {
    const response = await api.chat.getGreeting();
    addMessage(response.message, false);
  } catch (error) {
    console.error('Error loading greeting:', error);
    addMessage('Hey there! I\'m here to chat and support you. What\'s on your mind today?', false);
  }
}

/**
 * Load existing conversation
 * @param {string} conversationId - Conversation ID
 */
async function loadConversation(conversationId) {
  try {
    // Clear current messages
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Get conversation history
    const response = await api.chat.getHistory(conversationId);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Display messages
    if (response.messages && response.messages.length > 0) {
      response.messages.forEach(msg => {
        addMessage(msg.message, msg.is_user);
      });
      
      // Scroll to bottom
      scrollToBottom();
    } else {
      // If no messages, show greeting
      loadGreeting();
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    hideLoadingIndicator();
    addMessage('Sorry, I couldn\'t load the conversation history. Let\'s start a new chat!', false);
  }
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  
  if (message === '') return;
  
  // Add user message to chat
  addMessage(message, true);
  
  // Clear input
  userInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Send message to API
    const response = await api.chat.sendMessage(message, currentConversationId);
    
    // Update conversation ID if new
    if (!currentConversationId && response.conversation_id) {
      currentConversationId = response.conversation_id;
      
      // Update URL without reloading the page
      const url = new URL(window.location);
      url.searchParams.set('conversation', currentConversationId);
      window.history.pushState({}, '', url);
    }
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add response to chat
    addMessage(response.message, false);
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add error message
    addMessage('Sorry, I had trouble processing your message. Please try again.', false);
  }
}

/**
 * Add a message to the chat
 * @param {string} message - Message text
 * @param {boolean} isUser - Whether the message is from the user
 */
function addMessage(message, isUser = false) {
  const chatMessages = document.getElementById('chat-messages');
  
  const messageRow = document.createElement('div');
  messageRow.classList.add('message-row');
  
  if (isUser) {
    messageRow.classList.add('user-message-row');
    messageRow.innerHTML = `
      <div class="message user-message">${message}</div>
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
      <div class="message spider-message">${message}</div>
    `;
  }
  
  chatMessages.appendChild(messageRow);
  scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  
  // Check if typing indicator already exists
  if (document.getElementById('typing-indicator')) return;
  
  const typingRow = document.createElement('div');
  typingRow.classList.add('message-row', 'spider-message-row');
  typingRow.id = 'typing-indicator';
  typingRow.innerHTML = `
    <div class="avatar spider-avatar">
      <svg class="spider-icon" viewBox="0 0 24 24">
        <path d="M16.5,5.5C17.6,5.5 18.5,4.6 18.5,3.5C18.5,2.4 17.6,1.5 16.5,1.5C15.4,1.5 14.5,2.4 14.5,3.5C14.5,4.6 15.4,5.5 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9C3.45,9 3,8.55 3,8C3,7.45 3.45,7 4,7H7V9H4M5,5C4.45,5 4,4.55 4,4C4,3.45 4.45,3 5,3H10V5H5M2,11C1.45,11 1,10.55 1,10C1,9.45 1.45,9 2,9H7V11H2Z"/>
      </svg>
    </div>
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  chatMessages.appendChild(typingRow);
  scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-indicator';
  loadingDiv.classList.add('loading-indicator');
  loadingDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading conversation...</p>
  `;
  
  chatMessages.appendChild(loadingDiv);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}