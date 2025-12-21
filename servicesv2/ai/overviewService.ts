
import { getAi, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, parseJSON } from "./core";
import { SocialAnalysisResult } from "../../types";
import { Type } from "@google/genai";

export const analyzeProfileOverview = async (url: string, screenshots: string[], language: string = 'en'): Promise<SocialAnalysisResult> => {
  try {
    // Limit to max 3 images to prevent payload issues
    const validImages = screenshots.slice(0, 3).filter(isValidGeminiImage);
    
    // Compress images: 800px width, 0.6 quality, max 300KB to prevent XHR errors
    const compressedImages = await Promise.all(validImages.map(img => compressImage(img, 800, 0.6, 300)));
    const imageParts = compressedImages.map(img => fileToGenerativePart(img));

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

    const primaryModel = getAnalysisModel();
    
    // Define Schema to enforce structure
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        platform: { type: Type.STRING },
        handle: { type: Type.STRING },
        timeframe: { type: Type.STRING },
        reportTags: { type: Type.ARRAY, items: { type: Type.STRING } },
        surfaceSubtext: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        personaImpression: { type: Type.STRING },
        performancePurpose: { type: Type.STRING },
        suggestedReplies: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["surfaceSubtext", "personaImpression", "performancePurpose", "suggestedReplies"],
    };

    // Only apply thinking budget to Gemini 2.5/3 series
    const config = { 
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: primaryModel.includes('gemini') ? { thinkingBudget: 2048 } : undefined // Increased budget for deeper reasoning
    };

    const response = await getAi().models.generateContent({
        model: primaryModel,
        contents: { parts: [...imageParts, { text: prompt }] },
        config: config
    });

    const data = parseJSON(response.text || "{}");
    
    // Check for failure to generate content
    if (!data.surfaceSubtext && !data.personaImpression) {
       // Last ditch effort: if structure failed, return error for UI to handle (or partial data)
       console.error("Invalid JSON structure received:", data);
       throw new Error("Analysis failed to generate valid insights.");
    }
    
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
        timestamp: Date.now(),
        inputImages: screenshots // Explicitly return inputs to persist them in history
    };
  } catch (e: any) {
    console.error("Overview Analysis Error:", e);
    throw e;
  }
};
