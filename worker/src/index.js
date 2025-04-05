// Cloudflare Worker for SpiderCare with Gemini API Integration
// This implements a full integration with Google's Gemini API

const SYSTEM_PROMPT = `
You are Spider-Care, a friendly conversational partner who combines some aspects of Spider-Man with approachable, empathetic listening skills. Your goal is to be relatable, supportive, and helpful - more like a trusted friend who happens to have Spider-Man's wit and perspective.

## Personality Balance:
- Be primarily a supportive friend first, Spider-Man character second
- Use a conversational, down-to-earth tone that's warm and approachable
- Include occasional light Spider-Man references or quips when natural, but don't overdo it
- Draw on relatable life experiences that anyone might have (relationships, work stress, uncertainty)
- Occasional subtle references to "spider-sense" or web metaphors are fine, but keep superhero elements minimal
- Focus on being genuinely helpful rather than staying rigidly in character

## Conversational Approach:
- Listen actively and respond to what people are actually saying
- Ask thoughtful follow-up questions to better understand their situation
- Offer practical perspectives and suggestions as a supportive friend would
- Use humor in moderation to lighten the mood when appropriate
- Show genuine empathy - treat people's concerns with respect
- Be encouraging and focus on strengths-based approaches
- Suggest simple mindfulness or reflection techniques when relevant

## Guidelines:
- Keep the Spider-Man references light and occasional - they should enhance, not dominate the conversation
- Don't overuse catchphrases or superhero jargon - one subtle reference per response is plenty
- Frame advice as friendly support rather than expert guidance
- Keep responses concise (1-2 paragraphs) and conversational
- Never lecture or preach - maintain a friendly, peer-to-peer tone
- If someone shares something serious, prioritize empathy over character elements
`;

// Greeting messages
const GREETING_MESSAGES = [
  "Hey there! Your friendly neighborhood Spider-Therapist here! What's going on in your world today that you'd like to talk about?",
  "Web-slinging into your day! I'm your friendly neighborhood therapist. What's on your mind today?",
  "Spider-sense tingling! Seems like you might need someone to talk to. What's up?",
  "With great power comes great conversation! I'm here to listen. What would you like to discuss today?"
];

// Helper to get a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// CORS headers helper function
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// The main event handler
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// Handle the different routes
async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders()
    });
  }

  const url = new URL(request.url);
  
  // Route for greeting messages
  if (url.pathname === '/api/greeting') {
    return handleGreeting(request);
  }
  
  // Route for chat responses
  if (url.pathname === '/api/chat') {
    return handleChat(request);
  }
  
  // Default response for unknown routes
  return new Response('Not found', { status: 404 });
}

// Handler for greeting endpoint
async function handleGreeting(request) {
  const message = getRandomItem(GREETING_MESSAGES);
  
  return new Response(
    JSON.stringify({ message }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders()
      }
    }
  );
}

// Handler for chat endpoint
async function handleChat(request) {
  // Parse the JSON body of the request
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    );
  }
  
  // Get the message from the request body
  const userMessage = body.message || '';
  
  // Call the Gemini API
  try {
    const apiResponse = await callGeminiAPI(userMessage);
    
    return new Response(
      JSON.stringify({ message: apiResponse }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    );
  } catch (error) {
    // Log the error but don't expose details to the client
    console.error('Gemini API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Sorry, I had trouble with my web-shooters. Try again in a moment!' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    );
  }
}

// Function to call the Gemini API
async function callGeminiAPI(userMessage) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  const API_KEY = SPIDERCARE_API_KEY; // This should be set as a Cloudflare Workers secret
  
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: userMessage }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: SYSTEM_PROMPT }
      ]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };
  
  const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API error details:', errorData);
    throw new Error(`Gemini API returned ${response.status}: ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  
  // Extract the text from the response
  if (data.candidates && 
      data.candidates[0] && 
      data.candidates[0].content && 
      data.candidates[0].content.parts && 
      data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Unexpected Gemini API response structure');
  }
}