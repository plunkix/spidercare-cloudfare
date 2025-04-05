// Gemini API service for SpiderCare

// System prompt that defines the Spider-Man persona
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

// Call Gemini API
export async function callGeminiAPI(userMessage, env) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  const API_KEY = env.SPIDERCARE_API_KEY; // Should be set as a Cloudflare Workers secret
  
  // If API is disabled for testing, return a mock response
  if (env.AI_ENABLED !== "true") {
    return getRandomMockResponse(userMessage);
  }
  
  try {
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
        maxOutputTokens: 800,
        topP: 0.95,
        topK: 40
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
      console.error('Gemini API error status:', response.status);
      const errorData = await response.json();
      console.error('Gemini API error details:', errorData);
      throw new Error(`Gemini API returned ${response.status}`);
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
  } catch (error) {
    console.error('Gemini API call error:', error);
    
    // Return a fallback response if the API call fails
    return "Sorry, I'm having some trouble with my web-shooters right now. Could you try again in a moment?";
  }
}

// Mock responses for testing without API
function getRandomMockResponse(userMessage) {
  const mockResponses = [
    "I totally get that! Life can be a bit like swinging between buildings - sometimes exhilarating, sometimes scary, but always moving forward. What specific part of this situation is bothering you the most?",
    
    "That's a tough one. You know, my Uncle Ben used to say that with great power comes great responsibility, but he also taught me that it's okay to ask for help when you need it. How are you taking care of yourself through this?",
    
    "I'm hearing how frustrated you are with this situation. Sometimes our spider-sense tingles for good reason! Have you tried looking at this from a different angle? Sometimes a new perspective helps me when I'm stuck.",
    
    "Sounds like you're juggling a lot right now! Even superheroes need a break sometimes. What's one small thing you could do today to give yourself a moment of peace?",
    
    "That's really impressive! It takes courage to handle situations like that. How did you feel afterward?",
    
    "I'm here for you. Sometimes life throws challenges at us faster than I can shoot webs, but talking through them can help. What would make the biggest difference for you right now?",
    
    "I understand how that could make you feel stuck. Sometimes when I'm in a tight spot, I try to focus on just the next step rather than the whole complicated situation. What might be a small first step for you?",
    
    "That's a really thoughtful way to look at things! It reminds me of something I've learned while swinging around the city - sometimes the path forward isn't straight, but if we keep moving, we find our way.",
  ];
  
  // For more realistic responses, we'll acknowledge their message before giving a mock response
  const acknowledgments = [
    `About "${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}" - `,
    `I see what you mean about ${userMessage.split(' ').slice(0, 3).join(' ')}... `,
    `Regarding what you said - `,
    `That's interesting. `,
    `Thanks for sharing that. `,
    ``  // Empty acknowledgment (sometimes just respond directly)
  ];
  
  const randomAcknowledgment = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  return randomAcknowledgment + randomResponse;
}