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
  const apiKey = process.env.GEMINI_API_KEY || 'sk-demo'; // 公开端点可能不需要密钥

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
    max_tokens: 8000,
    thinkingConfig: {
      thinkingBudget: 0
    }
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
  if (!text || typeof text !== 'string') return {};

  // Handle AI Refusals gracefully
  if (text.trim().startsWith("I am unable") || text.includes("unable to fulfill") || text.includes("I cannot")) {
     console.warn("AI Refusal detected:", text);
     return {};
  }

  const attemptParse = (str: string): Record<string, any> | null => {
    try {
      let clean = str.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      // Remove any trailing commas before closing braces/brackets
      clean = clean.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(clean);
    } catch (e) {
      return null;
    }
  };

  // First attempt: parse the entire text
  let result = attemptParse(text);
  if (result) return result;

  // Second attempt: extract JSON from code blocks
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  let match;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    result = attemptParse(match[1]);
    if (result) return result;
  }

  // Third attempt: find the outermost JSON object
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    const substring = text.substring(firstOpen, lastClose + 1);
    result = attemptParse(substring);
    if (result) return result;
  }

  // Fourth attempt: try to fix common JSON issues
  let fixedText = text;
  // Remove markdown formatting that might interfere
  fixedText = fixedText.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown
  fixedText = fixedText.replace(/\*(.*?)\*/g, '$1'); // Remove italic markdown
  // Ensure proper quote escaping
  fixedText = fixedText.replace(/([^\\])"([^"]*)"([^,}\]]*[^\\])"([^"]*)"([^,}\]]*)/g, '$1"$2\\"$3\\"$4"$5'); // This is a simplified fix
  result = attemptParse(fixedText);
  if (result) return result;

  // If all attempts fail, return a default object with the raw text
  console.error("Failed to parse JSON after multiple attempts. Raw text:", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
  return { rawResponse: text, parseError: true };
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

  // Compress images to 800px width for faster transmission
  const compressedImages = await Promise.all(images.map(img => compressImage(img, 800)));

  const response = await callAI({
    model,
    prompt: promptText,
    images: compressedImages,
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
      Do not waste words. Every sentence must provide a psychological insight.
      Go beyond surface facts. Analyze the *psychological needs* (e.g., validation, safety, dominance) and *emotional vulnerabilities* hidden behind the posts.

      --- ANALYSIS SECTIONS (Map to JSON) ---

      1. **Surface vs. Subtext**: 
         [Write a deep analysis (150-200 words). Decode the **Visual Semiotics**. Describe the aesthetic (e.g. "Muted Luxury", "Cyberpunk") and what it signals. Contrast the "Curated Grid" with the likely "Chaotic Reality". Analyze the **Specific Insecurity** this aesthetic is trying to cover up.]
      
      2. **Target Audience**: 
         [Write a deep analysis (150-200 words). Who is this performance designed for? (e.g. "Ex-partners", "Rivals", "High-Value Mates"). Analyze the **Signaling Strategy**: Is it "Broadcasting" for attention or "Narrowcasting" to a specific type? Decode the specific **Mating Call** or **Status Signal** hidden in the content.]
      
      3. **Persona & Impression**: 
         [Write a deep analysis (150-200 words). Name the Character (e.g., "The Stoic Founder", "The Chill Girl"). Infer the Big Five traits from their posting habits. Analyze the **Shadow Self**: What part of their personality are they *desperately* trying to hide from the world?]
      
      4. **Performance & Purpose**: 
         [Write a deep analysis (150-200 words). Analyze the "Return on Investment" for their posts. What specific **Emotional Currency** are they farming? (e.g. Intellect validation, Sexual validation, Pity). Identify the **Core Emotional Void** they are trying to fill through digital approval.]
      
      5. **Suggested Replies / Opening Lines**: 
         - 3 distinct, high-EQ DMs to slide into their inbox based on this analysis.
         - (1. Casual/Low pressure, 2. Direct/Confident, 3. Insightful/Deep).
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
  **CRITICAL**: Do NOT just describe the image. Interpret **WHY** it was posted. Decode the "Digital Body Language".

  **TONE**: Perceptive, Witty, Insightful, and Empathetic.

  **ANALYSIS STRUCTURE (Markdown in JSON)**:

  The 'analysis' string MUST use the EXACT headers defined below. 
  **DO NOT USE SUB-HEADERS**. 
  
  **GLOBAL REQUIREMENT FOR SECTIONS 1-4**:
  For the first four sections, you MUST write an **EXTENDED, HIGH-RESOLUTION** deep dive (approx 250-300 words per section). 
  Do not just list features. Construct a rich, cohesive narrative.
  Weave your observations (lighting, messy corners, caption irony, time of day) into a seamless story.
  Use **bold text** to highlight key psychological insights within the paragraphs.

  ### ${headers.h1}
  [Analyze the environment, lighting (natural vs artificial), and the chaos vs order in the background. Analyze the "Psychological Time" of the post—why *this* specific moment? Look for "Ghost Objects" (extra glasses, reflections, shadows). Decode the aesthetic effort: is it "Effortless" or "Calculated"? Tell the full story of the scene.]

  ### ${headers.h2}
  [Decode the friction between the visual and the textual. Is the caption a "Sub-tweet" or lyrics masking a specific complaint? Identify the **Specific Hook** (The Bait). Are they fishing for compliments, curiosity, jealousy, or pity? Analyze the emotional leakage in punctuation and emojis. What are they *not* saying?]

  ### ${headers.h3}
  [Profile the **Hidden Audience**. Is this a "Broadcast" to the world, or a "Sniper Shot" aimed at an Ex, a Crush, or a Rival? Analyze the **Directionality** of the signal. Are they signaling Singlehood, High Status, or Vulnerability? Who is supposed to see this and feel something?]

  ### ${headers.h4}
  [Define the **Persona Construction**. What archetype are they cosplaying (e.g., "The Unbothered Queen", "The Hustler", "The Victim")? Analyze the **Gap** between their "Stage Self" and reality. How do they *desperately* want to be perceived vs how they *actually* come across? Deconstruct their "Impression Management" strategy.]

  ### ${headers.h5}
  [Write a strategic summary (approx 150 words). Identify the **Core Drive** (Validation, Venting, Connection, Boredom). Assess their **State of Mind** (Vulnerable? High-Status?). Give a final **Strategic Verdict** on the value of this post and whether to engage.]

  ---

  **REPLY GENERATION RULES**:
  Generate 3 distinct types of replies (Short, Natural, Low-Demand):

  1.  **The Playful Challenge**: Lighthearted, slightly teasing, or challenging their frame in a fun way.
  2.  **The Resonator**: Validates the *hidden* emotion (not the surface one). "I see the real you."
  3.  **The Curiosity Hook**: A low-friction question related to a detail in the photo that demands a reply.

  **OUTPUT JSON**:
  {
    "analysis": "string (The Markdown analysis above)",
    "suggestedReplies": ["String 1", "String 2", "String 3"],
    "tags": ["#Tag1", "#Tag2", "#RiskLevel:High/Low"]
  }
`

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

  **MISSION**: Do not just summarize the conversation. Interpret the subtext. Identify the "Unspoken Contract" between these two people. Detect insecurities, hidden agendas, and attachment triggers.

  **TONE**: Professional, Objective, Honest, High-Resolution. Avoid generic advice.

  --- CASE FILE ---
  ${target.name ? `- Target: ${target.name} (${target.age || '?'} / ${target.gender || '?'} / ${target.occupation || '?'})` : ''}
  ${user.name ? `- User: ${user.name} (${user.occupation || '?'})` : ''}
  - Goal: ${context.goal || 'Not specified'}

  --- CHAT LOGS ---
  "${context.chatLogs}"

  **CRITICAL RULES**:
  1. **Subtext Over Text**: Focus on *latency* (time gaps), *investment* (message length), and *tone shifts*.
  2. **Honesty**: If the relationship dynamic is unbalanced, state it clearly.
  3. **Evidence-Based**: When analyzing personality, refer to specific messages as evidence.
  4. **Structure**: Write LONG, DENSE, NARRATIVE paragraphs.
  5. **Psychological Frameworks**: Use terms like *Anxious-Avoidant*, *Reciprocity*, *Validation Seeking*.

  **OUTPUT STRUCTURE (JSON ONLY)**:
  {
    "compatibilityScore": 0, // Integer 0-100. Be realistic.
    "statusAssessment": "String (One sentence summary: e.g., 'Friendzone with potential' or 'High-tension flirtation')",
    "partnerPersonalityAnalysis": "String (Profile their Archetype: e.g., 'The Distant Avoidant' or 'The Validation Seeker'. Explain their fears and desires.)",

    "greenFlags": ["String (Quote specific text)", "String"],
    "redFlags": ["String (Quote specific text - look for inconsistencies)", "String"],

    "communicationDos": ["String (High-value behaviors)", "String"],
    "communicationDonts": ["String (Low-value/Needy behaviors)", "String"],
    "magicTopics": ["String (Topics that trigger their 'Flow State')", "String"],

    "strategy": "
      ### ${headers.h1}
      [DIAGNOSIS: Write a dense paragraph (150 words). Define the **Current Emotional Distance**. Is the target leaning in or pulling away? Use **bold** to highlight the 'Clinical Diagnosis' of the relationship health.]

      ### ${headers.h2}
      [DECODING THE PSYCHE: Write a deep dive (200 words). Analyze their **Defense Mechanisms**. Are they acting cool to hide insecurity? Analyze their **Core Ego Need** (Validation? Safety? Thrill?). Reveal what they are *thinking* but not *saying*.]

      ### ${headers.h3}
      [POWER DYNAMICS: Write a strategic assessment (150 words). Who is the 'Prize'? Analyze the **Investment Ratio** (who is texting more?). Identify if the user is Over-pursuing or too cold. Pinpoint the exact moment power shifted.]

      ### ${headers.h4}
      [RISK ANALYSIS: Write a warning paragraph (150 words). What is the **#1 Mistake** the user is committing? (e.g., Being too available, boring interrogations). Explain the psychological consequence if they don't stop.]

      ### ${headers.h5}
      [TACTICAL PLAN: Write a concrete action plan (200 words). Provide **Specific 'Copy-Paste' Scripts**. Draft a text that uses *Push-Pull* psychology to re-engage them. Explain the *Why* behind the script.]

      ### ${headers.h6}
      [FINAL VERDICT: One decisive sentence. Is this worth pursuing?]
    ",

    "dateIdeas": [
      { "title": "String", "description": "String (Must match their personality. e.g., 'High-Adrenaline' for thrill seekers, 'Cozy-Intimate' for avoidants)" },
      { "title": "String", "description": "String" }
    ],

    "tags": ["#AttachmentStyle", "#PowerDynamic", "#PsychProfile"]
  }
`

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
  - **SYNTHESIZE**: Use the "INTELLIGENCE SOURCES". Do not ignore them.
  - **THE "PAIN GAP"**: If the Social Analysis says they seek attention, and the Consult Report says they are avoidant, do not just note it. **Analyze the psychological cost** of this mask. (e.g., "They perform confidence to hide a fear of abandonment").
  - **CONSISTENCY**: Ensure your JSON numerical scores (Big Five) strictly align with your narrative analysis.

  **REQUIRED OUTPUT STRUCTURE**:

  1. **'summary' Field** MUST contain these 3 SPECIFIC HEADERS (starts with ###). 

     ### ${headers.archetype}
     [Name their specific psychological archetype (e.g., "The Anxious-Preoccupied High Achiever"). Write a powerful, narrative summary of who they are behind the mask. Connect their public persona (Social Analysis) with their private reality (Post/Consult Analysis).]

     ### ${headers.bigFive}
     [Analyze their Big Five traits based on the evidence. Do not just list scores. Explain HOW their specific combination (e.g., High Neuroticism + High Openness) manifests in their life and relationships.]

      ### ${headers.decoding}
      [**CRITICAL INSTRUCTION**: This section must be **SIGNIFICANTLY EXPANDED (increase length by 55%)**. 
      Write a deep psychological narrative (approx 300-400 words). 
      **Do NOT use rigid sub-headers**. instead, create a **Narrative Arc**:
      1. Start with their **Cognitive Engine** (How they process reality).
      2. Move to their **Emotional Core/Void** (What they lack).
      3. End with their **Attachment Triggers** (What makes them run vs. stay).
      Weave these into a profound essay that feels like a biography of their soul.]

  2. **'datingAdvice' Field**:
      [Provide actionable strategy. 
      **FORMATTING RULE**: Do NOT use Markdown Headers (###). Instead, use **Bold Labels** (e.g., **Communication Strategy:**, **The Red Flag:**) to organize the text into clean, readable blocks.]

  **RESPONSE FORMAT (JSON ONLY)**:
  {
    "bigFive": { "openness": 0-100, "conscientiousness": 0-100, "extraversion": 0-100, "agreeableness": 0-100, "neuroticism": 0-100 },
    "mbti": "string",
    "emotionalStability": 0-100,
    "coreInterests": ["string", "string"],
    "communicationStyle": "string",
    "summary": "string (Contains headers ### 1, ### 2, ### 3)",
    "datingAdvice": "string (Content ONLY, NO headers)",
    "avatarAnalysis": "string",
    "dataSufficiency": 0-100,
    "tags": ["#Tag1", "#Tag2"]
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
  model: string = 'gemini-3-flash-preview'
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

// Persona Reply for Chat Simulation
export const generatePersonaReply = async (
  target: any,
  messages: any[],
  language: string = 'en',
  model: string = 'gemini-3-flash-preview'
) => {
  const isCn = language === 'cn';
  const langInstruction = isCn
    ? 'Respond in Simplified Chinese.'
    : 'Respond in English.';

  const prompt = `
  You are an Expert Method Actor and Behavioral Psychologist.
  Your goal is to simulate a hyper-realistic text messaging conversation.

  --- ROLEPLAY PROFILE ---
  Name: ${target.name}
  Age/Job: ${target.age || 'Unknown'}, ${target.occupation || 'Unknown'}
  
  [Core Identity]
  MBTI: ${target.mbti || 'Unknown'}
  Personality: "${target.personalitySummary || 'Not analyzed'}"

  [Texting DNA - CRITICAL]
  Style: "${target.communicationStyle || 'Average'}"
  Social Vibe: "${target.socialVibe || 'Neutral'}"
  
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
    "insight": "One punchy sentence analyzing the power dynamic (e.g., 'She is testing your confidence' or 'She is bored by the topic'). MUST BE IN ${language}."
  }
`;

  const response = await callAI({
    model,
    prompt,
    responseFormat: 'json'
  });

  return parseJSON(response.text);
};
