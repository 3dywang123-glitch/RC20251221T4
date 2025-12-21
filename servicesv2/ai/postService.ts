
import { getAi, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, isRateLimitError, parseJSON } from "./core";

export const analyzePost = async (content: string, images: string[], language: string = 'en'): Promise<{analysis: string, suggestedReplies: string[], tags: string[]}> => {
  // Limit to max 2 images
  const validImages = images.slice(0, 2).filter(isValidGeminiImage);
  
  // Compress: 800px, 0.6q, max 300KB
  const compressedImages = await Promise.all(validImages.map(img => compressImage(img, 800, 0.6, 300)));
  const imageParts = compressedImages.map(img => fileToGenerativePart(img));

  const isCn = language === 'cn';
  const langInstruction = isCn 
    ? 'Respond in STRICT Simplified Chinese (简体中文). DO NOT use English in the output.' 
    : 'Respond in English.';

  // Dynamic Headers based on Language - STRICT 5 HEADERS
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

  const executeCall = async (model: string) => {
    return await getAi().models.generateContent({
      model: model,
      contents: {
        parts: [ ...imageParts, { text: content ? `Caption: "${content}"\n\n${prompt}` : prompt } ]
      },
      config: { responseMimeType: "application/json" }
    });
  };

  try {
     const response = await executeCall(getAnalysisModel());
     const data = parseJSON(response.text || "{}");
     return {
         analysis: data.analysis || "Analysis failed.",
         suggestedReplies: data.suggestedReplies || [],
         tags: data.tags || []
     };
  } catch (e) {
      if (isRateLimitError(e)) {
         try {
            // Fallback to Gemini 3 Flash Preview
            const fallbackResponse = await executeCall('gemini-3-flash-preview');
            const data = parseJSON(fallbackResponse.text || "{}");
            return {
                analysis: data.analysis || "Analysis failed.",
                suggestedReplies: data.suggestedReplies || [],
                tags: data.tags || []
            };
         } catch(fallbackE) {
            console.error("Retry failed:", fallbackE);
         }
      }
      return { analysis: "Unable to analyze post. The content may be unclear or flagged by safety filters.", suggestedReplies: [], tags: [] };
  }
};
