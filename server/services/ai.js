const config = require('../config');

/**
 * Generate AI response using Google Gemini 1.5 Flash API.
 * If API Key is missing or request fails, falls back to a smart offline mock assistant.
 * 
 * @param {string} promptText - The user prompt
 * @param {Array} history - Previous messages for context (optional)
 * @returns {Promise<string>} Generated text response
 */
async function generateAIResponse(promptText, history = []) {
  const apiKey = config.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const contents = [];
      
      // Inject system instruction for friendly, concise, and conversational tones (messaging style)
      const systemInstruction = "You are Aether AI, a friendly and concise chatbot in Aether Chat. Keep your responses short, conversational, and natural, like a normal human chatting on WhatsApp. Avoid giant bulleted lists or long essays. Respond in 1-3 sentences for general chatting unless a longer explanation is explicitly requested.";
      
      // Append history
      if (history && history.length > 0) {
        history.slice(-6).forEach(msg => {
          const role = msg.sender.username === 'aetherai' ? 'model' : 'user';
          contents.push({
            role: role,
            parts: [{ text: msg.content }]
          });
        });
      }
      
      // Append current prompt
      contents.push({
        role: 'user',
        parts: [{ text: promptText }]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            maxOutputTokens: 256, // smaller token count to keep it concise
            temperature: 0.8
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          const replyText = data.candidates[0].content.parts[0].text;
          if (replyText && replyText.trim().length > 0) {
            return replyText.trim();
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Gemini API returned non-OK status:', response.status, errorText);
      }
    } catch (err) {
      console.error('Gemini API call failed, falling back to mock response:', err);
    }
  }

  // Fallback / Mock generator
  return generateOfflineFallback(promptText);
}

/**
 * Generates concise, casual, human-like responses based on user queries when Gemini is offline.
 */
function generateOfflineFallback(prompt) {
  const p = prompt.toLowerCase();

  // 1. Custom Themes & Colors
  if (p.includes('theme') || p.includes('color') || p.includes('appearance') || p.includes('font') || p.includes('customize')) {
    return "Hey! You can customize your theme, font family, and accent colors by clicking the **Settings** cog in the bottom-left sidebar. We have Midnight, Cyber Neon, Royal Purple, Emerald Dark, Crimson Elite, and Light Professional. Let me know if you want help picking one! 😊";
  }

  // 2. Channel Coordination & Rooms
  if (p.includes('channel') || p.includes('room') || p.includes('group') || p.includes('create') || p.includes('dm')) {
    return "To start coordinating, you can make a Group Channel by clicking the **Compass** or the **+** next to 'Group Channels' in your sidebar. If you just want a private 1-on-1, click the **+** next to 'Direct Messages' to start a DM chat!";
  }

  // 3. Security, Lockouts & Sessions
  if (p.includes('security') || p.includes('lock') || p.includes('login') || p.includes('session') || p.includes('attempt') || p.includes('password')) {
    return "We take security seriously! Accounts get locked temporarily after 8 failed login attempts (starting with 15 mins). You can check all active devices logged into your account under **Settings > Sessions** and change your password there too.";
  }

  // 4. Greeting/General
  if (p.includes('hello') || p.includes('hi') || p.includes('hey') || p.includes('who are you') || p.includes('help') || p.includes('start')) {
    return "Hey! I'm Aether AI, your chat assistant. Ask me anything about themes, creating channels, or security features. What's on your mind? 🚀";
  }

  // Default Fallback Response
  return `I hear you! I'm currently running in offline fallback mode, but I can help you with app-related topics like customizing themes, channel settings, or security. What are you up to?`;
}

module.exports = {
  generateAIResponse
};
