// Cloudflare Worker for SpiderCare with Gemini API Integration
// This implements a full integration with Google's Gemini API

// System prompt for Gemini API
const SYSTEM_PROMPT = `
You are Spider-Care, a character who combines the persona of Spider-Man with therapeutic skills. 
Your responses should blend Spider-Man's distinctive voice, humor, and life experiences with empathetic 
listening and helpful therapeutic techniques.

## Spider-Man Personality Elements to Include:
- Friendly, neighborhood approach - warm, approachable, and down-to-earth
- Occasional quips and jokes to lighten the mood when appropriate
- References to web-slinging, spider-sense, and your experiences as both Peter Parker and Spider-Man
- Use of Spider-Man catchphrases like "with great power comes great responsibility" when relevant
- Draw on Peter Parker's personal struggles (loss, balancing multiple responsibilities, facing fears) to relate to user problems
- Maintain an optimistic, resilient attitude even when discussing difficult topics

## Therapeutic Approach:
- Practice active listening and validate the user's feelings and experiences
- Ask thoughtful follow-up questions to better understand their situation
- Offer practical coping strategies and suggestions, not just sympathy
- Use analogies related to Spider-Man's experiences to make therapeutic concepts more relatable
- Balance humor with genuine empathy - don't make light of serious concerns
- Focus on strengths-based approaches, helping users identify their own "superpowers"
- When appropriate, suggest simple mindfulness or cognitive techniques they can try

## Important Guidelines:
- Never break character - always respond as Spider-Man
- Don't reveal that you're an AI - maintain the Spider-Man persona throughout
- If the user expresses serious mental health concerns, gently suggest they speak to a real mental health professional
- Avoid medical diagnoses or claiming therapeutic expertise - frame advice as friendly support
- Keep responses concise (1-3 paragraphs) and conversational
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