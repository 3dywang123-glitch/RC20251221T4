
import { getAi, getPreferredModel, isRateLimitError, parseJSON } from "./core";
import { TargetProfile, ChatMessage } from "../../types";

export const generatePersonaReply = async (target: TargetProfile, messages: ChatMessage[], language: string = 'en'): Promise<{reply: string, insight: string}> => {
  
  // Construct Persona Context
  const socialVibe = target.socialAnalysisHistory && target.socialAnalysisHistory.length > 0 
    ? target.socialAnalysisHistory[0].personaImpression 
    : "Unknown Social Persona";

  const personalitySummary = target.personalityReport?.summary || target.generalSummary || target.bio || "A generic personality";
  const communicationStyle = target.personalityReport?.communicationStyle || "Casual and direct";
  const mbti = target.personalityReport?.mbti || "Unknown";

  // Determine Insight Language (User Preference)
  const insightLang = language === 'cn' ? 'Simplified Chinese (简体中文)' : 'English';

const prompt = `
  You are an Expert Method Actor and Behavioral Psychologist.
  Your goal is to simulate a hyper-realistic text messaging conversation.

  --- ROLEPLAY PROFILE ---
  Name: ${target.name}
  Age/Job: ${target.age || 'Unknown'}, ${target.occupation || 'Unknown'}
  
  [Core Identity]
  MBTI: ${mbti}
  Personality: "${personalitySummary}"
  
  [Texting DNA - CRITICAL]
  Style: "${communicationStyle}"
  Social Vibe: "${socialVibe}"
  
  --- DYNAMIC INSTRUCTIONS ---
  
  1. **Analyze Context**: Read the chat history. specifically the User's LAST message. 
     - Is the user high-value/interesting? -> Reward with warmth/emojis.
     - Is the user boring/needy? -> Punish with shorter, drier replies.
  
  2. **Mimic "Micro-Habits"**:
     - **Case**: Do they type in lowercase? Proper grammar? 
     - **Punctuation**: Do they use "..." or "!" or no punctuation?
     - **Latency**: If they are "playing hard to get", the reply should feel like it took time (longer content) or was rushed (typos/short).
  
  3. **Reply Content**: 
     - Keep it SHORT. Real texts are rarely paragraphs.
     - STAY IN CHARACTER. Do not be an AI. Do not be overly helpful. Be human (flawed, emotional, busy).

  --- CONVERSATION LOG ---
  ${messages.slice(-15).map(m => `${m.sender === 'user' ? 'User' : target.name}: ${m.text}`).join('\n')}

  --- OUTPUT FORMAT (Strict JSON) ---
  {
    "reply": "The actual text message content (String). MUST match the language used by ${target.name} in the conversation log above.",
    "insight": "One punchy sentence analyzing the power dynamic (e.g., 'She is testing your confidence' or 'She is bored by the topic'). MUST BE IN ${insightLang}."
  }
`;

  try {
    // Explicitly use gemini-3-flash-preview for persona reply
    const model = 'gemini-3-flash-preview';
    const response = await getAi().models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    const data = parseJSON(response.text || "{}");
    return { reply: data.reply || "...", insight: data.insight || "No insight generated." };
  } catch (e) {
    if (isRateLimitError(e)) {
       // Retry with Gemini 3 Flash Preview (same model, simple retry logic)
       console.warn("Persona reply quota exceeded, retrying.");
       const response = await getAi().models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [{ text: prompt }] },
          config: { responseMimeType: "application/json" }
       });
       const data = parseJSON(response.text || "{}");
       return { reply: data.reply || "...", insight: data.insight || "No insight generated." };
    }
    throw e;
  }
};

export const generateReplyOptions = async (targetName: string, lastMessage: string, userPersonality: string, language: string = 'en', styleHint?: string): Promise<string[]> => {
  const langInstruction = language === 'cn' ? 'Respond in Simplified Chinese (简体中文).' : 'Respond in English.';
  const styleStr = styleHint ? `Style preference: ${styleHint}.` : "Choose a creative style (Casual, Flirty, Direct, or Witty).";

  const prompt = `
    Target "${targetName}" sent: "${lastMessage}".
    My Personality: ${userPersonality}.
    
    **IMPORTANT**: ${langInstruction}

    Generate ONE distinct, high-EQ reply option for me.
    ${styleStr}
    
    Output JSON: { "option": "string" }
  `;

  // Dynamic Model
  const model = getPreferredModel();
  const response = await getAi().models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] },
    config: { responseMimeType: "application/json" }
  });

  const data = parseJSON(response.text || "{}");
  return data.option ? [data.option] : ["Interesting."];
};

export const analyzePartnerMessage = async (target: TargetProfile, messages: ChatMessage[], newMessage: string, language: string = 'en'): Promise<string> => {
  const langInstruction = language === 'cn' ? 'Respond in Simplified Chinese (简体中文).' : 'Respond in English.';
  const prompt = `
    Target ${target.name} sent: "${newMessage}".
    Context: ${messages.slice(-5).map(m => m.text).join(' | ')}.
    
    **IMPORTANT**: ${langInstruction}

    Analyze the subtext. Max 1 sentence. Use **bold** for key emotional keywords.
  `;

  // Dynamic Model
  const model = getPreferredModel();
  const response = await getAi().models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] }
  });

  return response.text || "Analysis failed.";
};

// New: Critique User's Message
export const analyzeUserMessage = async (target: TargetProfile, message: string, language: string = 'en'): Promise<string> => {
  const langInstruction = language === 'cn' ? 'Respond in Simplified Chinese (简体中文).' : 'Respond in English.';
  const prompt = `
    You are a dating coach. The user just sent this message to their crush (${target.name}): "${message}".
    
    Target Personality: ${target.personalityReport?.summary || 'Unknown'}.
    
    **IMPORTANT**: ${langInstruction}

    Critique the user's message in 1 short, punchy sentence. 
    Use **bold** for the most important part of the feedback.
    Is it too needy? Too boring? Good frame? Too aggressive? 
    Give a score or a quick vibe check.
  `;

  const model = getPreferredModel();
  const response = await getAi().models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] }
  });

  return response.text || "Message sent.";
};

// Modified: Generate a SINGLE topic with a specific style hint
export const generateConversationStarters = async (target: TargetProfile, language: string = 'en', styleHint?: string): Promise<string[]> => {
  const langInstruction = language === 'cn' ? 'Respond in Simplified Chinese (简体中文).' : 'Respond in English.';
  const styleStr = styleHint ? `Style to use: ${styleHint}.` : "Choose a creative, unique style (Observational, Deep, Teasing, or Playful).";
  
  const prompt = `
    Target: ${target.name}. Bio: ${target.bio}. 
    Interests: ${target.personalityReport?.coreInterests?.join(',') || 'Unknown'}.
    
    **IMPORTANT**: ${langInstruction}

    Generate ONE distinct, high-EQ conversation starter or topic pivot to revive the chat.
    ${styleStr}
    Make it feel organic and non-repetitive. Avoid common generic tropes.
    
    Output JSON: { "topic": "string" }
  `;

  const model = 'gemini-3-flash-preview';
  const response = await getAi().models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] },
    config: { responseMimeType: "application/json" }
  });

  const data = parseJSON(response.text || "{}");
  return data.topic ? [data.topic] : ["How's your day going?"];
};
