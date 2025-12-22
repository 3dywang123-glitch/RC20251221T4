import dotenv from 'dotenv';

dotenv.config();

interface AICallOptions {
  model: string;
  prompt: string;
  images?: string[];
  responseFormat?: 'json' | 'text';
  thinkingBudget?: number;
}

interface AIResponse {
  text: string;
}

export const callAI = async (options: AICallOptions): Promise<AIResponse> => {
  const { model, prompt, images = [], responseFormat = 'text', thinkingBudget } = options;

  // Use configurable endpoint with fallback
  const endpoint = process.env.AI_API_ENDPOINT || 'https://hnd1.aihub.zeabur.ai/';
  const apiKey = process.env.GEMINI_API_KEY || 'sk-demo'; 

  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  // Build messages array
  const content: any[] = [{ type: "text", text: prompt }];
  
  // Add images if provided
  for (const imageDataUri of images) {
    if (imageDataUri && imageDataUri.startsWith('data:image')) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageDataUri
        }
      });
    }
  }

  // Build request body for OpenAI-compatible API
  const requestBody: any = {
    model: model,
    messages: [
      {
        role: "user",
        content: content
      }
    ],
    temperature: 0.7,
    max_tokens: 8000
  };

  // Add response format for JSON mode
  if (responseFormat === 'json') {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(`${endpoint}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    
    // Extract text from OpenAI-style response
    const text = data.choices?.[0]?.message?.content || "";
    
    return { text };
  } catch (error) {
    console.error("AI API call failed:", error);
    throw error;
  }
};

// Robust JSON Parsing Helper (migrated from core.ts)
export const parseJSON = (text: string): Record<string, any> => {
  if (!text) return {};
  
  // Handle AI Refusals gracefully
  if (text.trim().startsWith("I am unable") || text.includes("unable to fulfill") || text.includes("I cannot")) {
      console.warn("AI Refusal detected:", text);
      return {};
  }

  const attemptParse = (str: string) => {
    try {
      let clean = str.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      clean = clean.trim();
      return JSON.parse(clean);
    } catch (e) {
      throw e;
    }
  };

  try {
    return attemptParse(text);
  } catch (e) {
    try {
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) {
        const substring = text.substring(firstOpen, lastClose + 1);
        return attemptParse(substring);
      }
    } catch (e2) {
      // Ignore
    }
    console.error("Failed to parse JSON. Raw text:", text);
    throw new Error("Invalid JSON response from AI");
  }
};

// ==================== V2 Analysis Services ====================

// Smart Classification & Extraction
export const classifyAndExtract = async (images: string[], model: string = 'gemini-3-flash-preview') => {
  const promptText = `
  You are an expert UI/UX Analyst for Asian Social Apps (WeChat, RedNote, Instagram).
  Analyze the **COLLECTION** of screenshots provided as a single dataset.
  
  **MISSION**: 
  1. Determine the **DOMINANT** screen type across all images.
  2. Extract the **TARGET USER'S** profile info by synthesizing text from all images.

  **CLASSIFICATION RULES (Priority Order)**:
  
  1. **"CHAT" (Conversation Logs)** - Speech bubbles, alternating rows, bottom input bar.
  2. **"PROFILE" (User Home / Feed)** - Large Avatar + Bio + Stats at the top. Vertical list of posts.
  3. **"POST" (Single Content Detail / Moment)** - Focused view of ONE main post with comments.
  4. **"UNKNOWN"** - Fallback for unclear images.

  **EXTRACTION TASK**:
  - **NAME**: Look for the username.
  - **BIO/INFO**: Scan all images for Age, Occupation, or Bio text tags.
  - **AVATAR_BOX & SOURCE**: 
    - Identify the TARGET USER'S avatar (NOT the app owner's/self).
    - Return avatarBox [ymin, xmin, ymax, xmax] (0-1000).
    - Return avatarSourceIndex: The 0-based index of the image containing this best avatar.

  **OUTPUT FORMAT (JSON ONLY)**:
  {
    "type": "CHAT" | "POST" | "PROFILE" | "UNKNOWN",
    "avatarBox": [int, int, int, int] or null,
    "avatarSourceIndex": int,
    "extractedProfile": {
      "name": "string",
      "gender": "Female" | "Male" | "Unknown",
      "age": "string or empty",
      "occupation": "string or empty",
      "bio": "string or empty"
    }
  }
`;

  const response = await callAI({
    model,
    prompt: promptText,
    images,
    responseFormat: 'json'
  });

  const data = parseJSON(response.text);
  
  return {
    type: data.type || 'UNKNOWN',
    confidence: 0.9,
    extractedProfile: {
      name: data.extractedProfile?.name || '',
      gender: (['Male', 'Female'].includes(data.extractedProfile?.gender) ? data.extractedProfile?.gender : 'Female'),
      age: data.extractedProfile?.age || '', 
      occupation: data.extractedProfile?.occupation || '',
      bio: data.extractedProfile?.bio || ''
    },
    avatarBox: data.avatarBox || null,
    avatarSourceIndex: typeof data.avatarSourceIndex === 'number' ? data.avatarSourceIndex : 0,
    analysisSummary: `Detected ${data.type || 'Content'}`
  };
};

// Profile Overview Analysis (Social Media Profile)
export const analyzeProfileOverview = async (
  url: string, 
  screenshots: string[], 
  language: string = 'en',
  model: string = 'gemini-3-flash-preview'
) => {
  const langInstruction = language === 'cn' ? 'Respond in Simplified Chinese (简体中文).' : 'Respond in English.';

  const prompt = `
      You are an Elite Digital Forensic Psychologist & Profiler.
      Analyze the provided social media screenshots (e.g., WeChat Moments, Instagram) and context: ${url}.
      
      **IMPORTANT**: ${langInstruction}
      **MISSION**: Decode the "Impression Management" strategy of this profile.
      **TONE**: Surgical, Incisive, Clinical but **Emotionally Deep**.
      
      **GLOBAL REQUIREMENT FOR SECTIONS 1-4**:
      For the first four sections, write a **CONCISE BUT DEEP** analysis (approx 150-200 words per section).

      --- ANALYSIS SECTIONS (Map to JSON) ---
      1. **Surface vs. Subtext**: [Decode the Visual Semiotics. Describe the aesthetic and what it signals.]
      
      2. **Target Audience**: [Who is this performance designed for? Analyze the Signaling Strategy.]
      
      3. **Persona & Impression**: [Name the Character. Infer Big Five traits. Analyze the Shadow Self..]
      
      4. **Performance & Purpose**: [Analyze the "Return on Investment". What Emotional Currency are they farming?]
      
      5. **Suggested Replies / Opening Lines**: 3 distinct, high-EQ DMs based on this analysis.

      **RESPONSE FORMAT (JSON ONLY)**:
      {
        "platform": "string",
        "handle": "string",
        "timeframe": "string",
        "reportTags": ["string"],
        "surfaceSubtext": "string",
        "targetAudience": "string",
        "personaImpression": "string",
        "performancePurpose": "string",
        "suggestedReplies": ["string"]
      }
    `;

  const response = await callAI({
    model,
    prompt,
    images: screenshots.slice(0, 3),
    responseFormat: 'json'
  });

  const data = parseJSON(response.text);
  
  return {
    id: Date.now().toString(),
    url,
    platform: data.platform || "Unknown",
    handle: data.handle || "Unknown",
    timeframe: data.timeframe || "Unknown",
    reportTags: data.reportTags || [],
    surfaceSubtext: data.surfaceSubtext || "Analysis pending...",
    targetAudience: data.targetAudience || "Analysis pending...",
    personaImpression: data.personaImpression || "Analysis pending...",
    performancePurpose: data.performancePurpose || "Analysis pending...",
    suggestedReplies: data.suggestedReplies || [],
    report: JSON.stringify(data, null, 2),
    timestamp: Date.now()
  };
};

// Post Analysis
export const analyzePost = async (
  content: string, 
  images: string[], 
  language: string = 'en',
  model: string = 'gemini-3-flash-preview'
) => {
  const isCn = language === 'cn';
  const langInstruction = isCn 
    ? 'Respond in STRICT Simplified Chinese (简体中文). DO NOT use English in the output.' 
    : 'Respond in English.';

  const headers = isCn 
    ? {
        h1: "1. 视觉语境与氛围解码",
        h2: "2. 潜台词与深层信号",
        h3: "3. 目标受众与指向性",
        h4: "4. 人设与印象管理",
        h5: "5. 动机与博弈评估"
      }
    : {
        h1: "1. Visual Context & Atmosphere",
        h2: "2. Subtext & Hidden Signals",
        h3: "3. Target Audience & Directionality",
        h4: "4. Persona & Impression Management",
        h5: "5. Motivation & Strategic Verdict"
      };

  const prompt = `
  You are an expert Social Dynamics Analyst & Psychologist.
  **IMPORTANT**: ${langInstruction}

  **MISSION**: Perform a **Deep, Expansive** analysis of the provided social media post. 
  **CRITICAL**: Do NOT just describe the image. Interpret **WHY** it was posted.
  **TONE**: Perceptive, Witty, Insightful, and Empathetic.

  **ANALYSIS STRUCTURE (Markdown in JSON)**:
  ### ${headers.h1}
  [Analyze the environment, lighting, chaos vs order. Approx 250-300 words.]

  ### ${headers.h2}
  [Decode the friction between the visual and the textual. 250-300 words.]

  ### ${headers.h3}
  [Profile the Hidden Audience. 250-300 words.]

  ### ${headers.h4}
  [Define the Persona Construction. 250-300 words.]

  ### ${headers.h5}
  [Write a strategic summary. Approx 150 words.]

  **REPLY GENERATION RULES**:
  Generate 3 distinct types of replies:
  1. **The Playful Challenge**: Lighthearted, slightly teasing.
  2. **The Resonator**: Validates the hidden emotion.
  3. **The Curiosity Hook**: A low-friction question demanding a reply.

  **OUTPUT JSON**:
  {
    "analysis": "string (The Markdown analysis)",
    "suggestedReplies": ["String 1", "String 2", "String 3"],
    "tags": ["#Tag1", "#Tag2", "#RiskLevel:High/Low"]
  }
`;

  const finalPrompt = content ? `Caption: "${content}"\n\n${prompt}` : prompt;

  const response = await callAI({
    model,
    prompt: finalPrompt,
    images: images.slice(0, 2),
    responseFormat: 'json'
  });

  const data = parseJSON(response.text);
  
  return {
    analysis: data.analysis || "Analysis failed.",
    suggestedReplies: data.suggestedReplies || [],
    tags: data.tags || []
  };
};

// Chat Log Analysis
export const analyzeChatLog = async (
  target: { name?: string; age?: string; gender?: string; occupation?: string },
  user: { name?: string; occupation?: string },
  context: { stage?: string; goal?: string; duration?: string; chatLogs: string; chatImages: string[] },
  language: string = 'en',
  model: string = 'gemini-3-flash-preview'
) => {
  const isCn = language === 'cn';
  const langInstruction = isCn 
    ? 'Respond in STRICT Simplified Chinese (简体中文). DO NOT use English in the output.' 
    : 'Respond in English.';

  const headers = isCn 
    ? {
        h1: "1. 核心诊断",
        h2: "2. 深度行为解码",
        h3: "3. 关键互动",
        h4: "4. 战略优化",
        h5: "5. 战术手册",
        h6: "6. 分析师结语"
      }
    : {
        h1: "1. Executive Diagnosis",
        h2: "2. Deep Behavioral Decoding",
        h3: "3. Key Dynamics",
        h4: "4. Strategic Calibration",
        h5: "5. Tactical Playbook",
        h6: "6. Consultant's Verdict"
      };

  const prompt = `
  You are an Expert Clinical Relationship Psychologist & Behavioral Profiler.
  **IMPORTANT**: ${langInstruction}

  **MISSION**: Do not just summarize the conversation. Interpret the subtext. Identify the "Unspoken Contract".
  **TONE**: Professional, Objective, Honest, High-Resolution.

  --- CASE FILE ---
  ${target.name ? `- Target: ${target.name} (${target.age || '?'} / ${target.gender || '?'} / ${target.occupation || '?'})` : ''}
  ${user.name ? `- User: ${user.name} (${user.occupation || '?'})` : ''}
  - Goal: ${context.goal || 'Not specified'}

  --- CHAT LOGS ---
  "${context.chatLogs}"

  **CRITICAL RULES**:
  1. **Subtext Over Text**: Focus on latency, investment, tone shifts.
  2. **Honesty**: If the relationship dynamic is unbalanced, state it clearly.
  3. **Evidence-Based**: Refer to specific messages as evidence.
  4. **Structure**: Write LONG, DENSE, NARRATIVE paragraphs.
  5. **Psychological Frameworks**: Use terms like Anxious-Avoidant, Reciprocity, Validation Seeking.

  **OUTPUT STRUCTURE (JSON ONLY)**:
  {
    "compatibilityScore": 0,
    "statusAssessment": "String",
    "partnerPersonalityAnalysis": "String",
    "greenFlags": ["String"],
    "redFlags": ["String"],
    "communicationDos": ["String"],
    "communicationDonts": ["String"],
    "magicTopics": ["String"],
    "strategy": "Markdown with headers ### ${headers.h1} through ### ${headers.h6}",
    "dateIdeas": [{ "title": "String", "description": "String" }],
    "tags": ["#Tag"]
  }
`;

  const response = await callAI({
    model,
    prompt,
    images: context.chatImages.slice(0, 3),
    responseFormat: 'json'
  });

  const data = parseJSON(response.text);
  
  return {
    compatibilityScore: data.compatibilityScore || 0,
    statusAssessment: data.statusAssessment || "Analysis complete.",
    partnerPersonalityAnalysis: data.partnerPersonalityAnalysis,
    greenFlags: data.greenFlags || [],
    redFlags: data.redFlags || [],
    communicationDos: data.communicationDos || [],
    communicationDonts: data.communicationDonts || [],
    magicTopics: data.magicTopics || [],
    strategy: data.strategy || "",
    dateIdeas: data.dateIdeas || [],
    iceBreakers: [], 
    tags: data.tags || [],
    generatedAt: Date.now(),
    goalContext: context.goal
  };
};

// Personality Analysis V2
export const analyzePersonalityV2 = async (
  profile: { name: string; occupation: string; bio: string; age: string; socialLinks?: string },
  avatarB64: string | undefined,
  additionalImages: string[],
  socialAnalysisHistory: any[],
  postAnalysisHistory: any[],
  consultationHistory: any[],
  avatarAnalysis?: string,
  supplementaryInfo?: string,
  language: string = 'en',
  model: string = 'gemini-3-flash-preview'
) => {
  // Context Construction from history
  let deepContext = "";
  
  if (socialAnalysisHistory.length > 0) {
    const latestSocial = socialAnalysisHistory[socialAnalysisHistory.length - 1];
    deepContext += `\n[[INTELLIGENCE SOURCE 1: LATEST SOCIAL PROFILE ANALYSIS]]\nPlatform: ${latestSocial.platform}\nHandle: ${latestSocial.handle}\nCore Impression: ${latestSocial.personaImpression || latestSocial.persona_impression}\nHidden Subtext: ${latestSocial.surfaceSubtext || latestSocial.surface_subtext}\nUnderlying Motivation: ${latestSocial.performancePurpose || latestSocial.performance_purpose}\n`;
  }

  if (postAnalysisHistory.length > 0) {
    const recentPosts = postAnalysisHistory.slice(-2);
    deepContext += `\n[[INTELLIGENCE SOURCE 2: RECENT MICRO-BEHAVIORS (POSTS)]]\n${recentPosts.map(p => `Content: "${p.content}"\nPsychological Decode: ${p.analysis}`).join('\n---\n')}\n`;
  }

  if (consultationHistory.length > 0) {
    const latestConsult = consultationHistory[consultationHistory.length - 1];
    deepContext += `\n[[INTELLIGENCE SOURCE 3: PREVIOUS RELATIONSHIP DIAGNOSIS]]\nStatus: ${latestConsult.statusAssessment || latestConsult.status_assessment}\nObserved Traits: ${latestConsult.partnerPersonalityAnalysis || latestConsult.partner_personality_analysis}\nRecommended Strategy: ${latestConsult.strategy}\n`;
  }

  const isCn = language === 'cn';
  const langInstruction = isCn ? 'Respond in STRICT Simplified Chinese (简体中文).' : 'Respond in English.';

  const headers = isCn 
    ? {
        archetype: "1. 核心原型",
        bigFive: "2. 五维人格模型",
        decoding: "3. 深度心理侧写",
        playbook: "策略行动指南"
      }
    : {
        archetype: "1. The Archetype",
        bigFive: "2. The Big Five Dimensions",
        decoding: "3. Deep Psychological Decoding",
        playbook: "Strategic Playbook"
      };

  const prompt = `
  You are a Master Psychological Profiler (Clinical & Data-Driven). 
  **MISSION**: Construct a high-precision, deep-dive personality profile for "${profile.name}".
  
  **IMPORTANT**: ${langInstruction}

  **INPUT DATA**:
  - Basic Info: ${profile.age}, ${profile.occupation}
  - Bio: "${profile.bio}"
  - User Notes: "${supplementaryInfo || 'None'}"
  - Avatar Vibe: ${avatarAnalysis || 'N/A'}
  
  ${deepContext}

  **CORE DIRECTIVE**: 
  - **SYNTHESIZE**: Use the "INTELLIGENCE SOURCES".
  - **THE "PAIN GAP"**: Analyze the psychological cost of their mask.
  - **CONSISTENCY**: Ensure JSON numerical scores align with narrative analysis.

  **REQUIRED OUTPUT STRUCTURE**:
  1. **'summary' Field** MUST contain these 3 SPECIFIC HEADERS:
     ### ${headers.archetype}
     [Name their psychological archetype. Write a powerful narrative summary.]

     ### ${headers.bigFive}
     [Analyze their Big Five traits based on evidence.]

     ### ${headers.decoding}
     [CRITICAL: 300-400 words. Deep psychological narrative.]

  2. **'datingAdvice' Field**:
     [Actionable strategy. Use **Bold Labels** instead of headers.]

  **RESPONSE FORMAT (JSON ONLY)**:
  {
    "bigFive": { "openness": 0-100, "conscientiousness": 0-100, "extraversion": 0-100, "agreeableness": 0-100, "neuroticism": 0-100 },
    "mbti": "string",
    "emotionalStability": 0-100,
    "coreInterests": ["string"],
    "communicationStyle": "string",
    "summary": "string (Contains headers ### 1, ### 2, ### 3)",
    "datingAdvice": "string (NO headers)",
    "avatarAnalysis": "string",
    "dataSufficiency": 0-100,
    "tags": ["#Tag"]
  }
`;

  const images: string[] = [];
  if (avatarB64) images.push(avatarB64);
  images.push(...additionalImages.slice(0, 5));

  const response = await callAI({
    model,
    prompt,
    images,
    responseFormat: 'json'
  });

  const data = parseJSON(response.text);

  return {
    bigFive: data.bigFive || { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
    mbti: data.mbti || "Unknown",
    emotionalStability: data.emotionalStability || 50,
    coreInterests: data.coreInterests || [],
    communicationStyle: data.communicationStyle || "Average",
    summary: data.summary || "No summary generated.",
    datingAdvice: data.datingAdvice || "No specific advice generated.",
    avatarAnalysis: data.avatarAnalysis || avatarAnalysis,
    dataSufficiency: data.dataSufficiency || 0,
    generatedAt: Date.now(),
    tags: data.tags || []
  };
};

// Avatar Analysis
export const analyzeAvatar = async (
  name: string, 
  imageB64: string, 
  model: string = 'gemini-2.0-flash-exp'
) => {
  const prompt = `
    You are an expert psychologist and vibe reader. 
    Analyze this avatar for ${name}. 
    What does this specific choice of image say about their self-perception, aesthetic, and current mood? 
    Keep it punchy, insightful, and slightly witty. Max 2 sentences.
  `;

  const response = await callAI({
    model,
    prompt,
    images: [imageB64]
  });

  return { analysis: response.text };
};

// Compress image helper
export const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  // In server environment, we might use a library like sharp
  // For now, return as-is
  return base64Str;
};

// Persona Reply for Chat Simulation (Simulate Chat)
// ✅ Updated: Adds language support and explicit "Coach Insight" generation
export const generatePersonaReply = async (
  target: any,
  messages: any[],
  language: string = 'en',
  model: string = 'gemini-2.0-flash-exp'
) => {
  const isCn = language === 'cn';
  const langInstruction = isCn 
    ? 'Respond in STRICT Simplified Chinese (简体中文). The character reply AND the insight must be in Chinese.' 
    : 'Respond in English.';

  const prompt = `
    You are an AI Simulation Engine playing two roles simultaneously:
    
    ROLE 1: The Persona ("${target.name}")
    - You are ${target.name}, ${target.age} years old, ${target.occupation}.
    - Personality: ${target.bio} ${target.personalityReport ? `(MBTI: ${target.personalityReport.mbti})` : ''}
    - You must respond to the user's last message naturally, staying strictly in character.

    ROLE 2: The Dating Coach (The "Insight")
    - You are an expert Social Dynamics Coach observing this interaction.
    - You must analyze the User's last message. Was it attractive? Need, insecure? Or confident?
    - Give brief, tactical advice on what the user did right or wrong.

    **IMPORTANT**: ${langInstruction}

    Recent conversation:
    ${messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n')}

    OUTPUT FORMAT (JSON):
    {
      "reply": "The character's text message reply (In character)",
      "insight": "Coach's analysis of the user's move (Tactical advice, NOT just a summary)"
    }
  `;

  const response = await callAI({
    model,
    prompt,
    responseFormat: 'json'
  });

  return parseJSON(response.text);
};
