// Cloudflare Worker for SpiderCare
// This replaces the Flask backend with a serverless function

// Sample responses - just for the basic version
// In the full version, you would replace this with API calls to Claude/GPT
const SPIDER_RESPONSES = [
    "With great power comes great responsibility—and that includes taking care of your mental health! Tell me more about what you're feeling.",
    "Sounds like you're swinging through some tough emotions there. I've been there too—juggling being Spider-Man and Peter Parker isn't always easy!",
    "You know, my Aunt May always says that the hardest battles are fought in the mind. What strategies have helped you face challenges like this before?",
    "Even superheroes have tough days. I remember when I was feeling overwhelmed with responsibility, I learned to break big problems into smaller ones—just like taking down villains one web at a time!",
    "My spider-sense is telling me there's more to this story. What else is on your mind that might be contributing to these feelings?",
    "That's really brave of you to share. Vulnerability is a superpower too, you know! How can I support you right now?",
    "Sometimes I remind myself that I can't save everyone in New York City in one day. It's okay to focus on just one neighborhood at a time. What's one small step you could take today?",
    "When I'm feeling stuck, I try to look at the situation from a different angle—sometimes literally hanging upside down! Have you considered viewing this challenge differently?",
    "Balancing multiple responsibilities can feel like trying to stop a train with bare hands—trust me, I've actually done that and it's not fun! What could you let go of temporarily to make things more manageable?",
    "You're doing better than you think. Remember, even Spider-Man falls sometimes—it's the getting back up that makes you strong!"
  ];
  
  // Greeting messages
  const GREETING_MESSAGES = [
    "Hey there! Your friendly neighborhood Spider-Therapist here! What's going on in your world today that you'd like to talk about?",
    "Web-slinging into your day! I'm your friendly neighborhood therapist. What's on your mind today?",
    "Spider-sense tingling! Seems like you might need someone to talk to. What's up?",
    "With great power comes great conversation! I'm here to listen. What would you like to discuss today?"
  ];
  
  // System prompt for when you connect to LLM API
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
    
    // In the full version, this is where you would call the LLM API
    // For now, we'll just return a random response
    const response = getRandomItem(SPIDER_RESPONSES);
    
    // For full version, you could implement the LLM API call using fetch
    // Example (commented out):
    /*
    const LLM_API_URL = 'https://api.anthropic.com/v1/messages';
    const API_KEY = SPIDERCARE_API_KEY; // You'd set this as a Cloudflare Workers secret
    
    try {
      const llmResponse = await fetch(LLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": userMessage }
          ]
        })
      });
      
      const data = await llmResponse.json();
      return new Response(
        JSON.stringify({ message: data.content[0].text }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        }
      );
    } catch (error) {
      // Fallback to random response if API call fails
      return new Response(
        JSON.stringify({ message: getRandomItem(SPIDER_RESPONSES) }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        }
      );
    }
    */
    
    return new Response(
      JSON.stringify({ message: response }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    );
  }
