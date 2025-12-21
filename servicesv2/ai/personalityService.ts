
import { getAi, getPreferredModel, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, isRateLimitError, parseJSON } from "./core";
import { PersonalityReport, SocialAnalysisResult, SocialPostAnalysis, RelationshipReport } from "../../types";

export const analyzePersonality = async (
  profile: { name: string, occupation: string, bio: string, age: string, socialLinks?: string }, 
  avatarB64: string | undefined,
  additionalImages: string[],
  socialData: { texts: string[], images: string[] },
  socialAnalysisHistory: SocialAnalysisResult[],
  postAnalysisHistory: SocialPostAnalysis[],
  avatarAnalysis?: string,
  consultationHistory: RelationshipReport[] = [],
  supplementaryInfo?: string,
  language: string = 'en'
): Promise<PersonalityReport> => {
  
  // 1. Image Processing
  // Allow up to 5 additional user uploaded context images
  const validAdditionalImages = additionalImages.slice(0, 5).filter(isValidGeminiImage);
  const compressedAdditionalImages = await Promise.all(validAdditionalImages.map(img => compressImage(img, 800, 0.6, 300)));
  const additionalImageParts = compressedAdditionalImages.map(img => fileToGenerativePart(img));

  // 2. Context Construction - Inject LATEST FULL Reports
  let deepContext = "";

  // A. Social Media Context (Latest)
  if (socialAnalysisHistory.length > 0) {
      const latestSocial = socialAnalysisHistory[socialAnalysisHistory.length - 1];
      deepContext += `\n[[INTELLIGENCE SOURCE 1: LATEST SOCIAL PROFILE ANALYSIS]]\nPlatform: ${latestSocial.platform}\nHandle: ${latestSocial.handle}\nCore Impression: ${latestSocial.personaImpression}\nHidden Subtext: ${latestSocial.surfaceSubtext}\nUnderlying Motivation: ${latestSocial.performancePurpose}\n`;
  }

  // B. Post/Moment Context (Latest 2)
  if (postAnalysisHistory.length > 0) {
      const recentPosts = postAnalysisHistory.slice(-2);
      deepContext += `\n[[INTELLIGENCE SOURCE 2: RECENT MICRO-BEHAVIORS (POSTS)]]\n${recentPosts.map(p => `Content: "${p.content}"\nPsychological Decode: ${p.analysis}`).join('\n---\n')}\n`;
  }

  // C. Consultation History (Latest)
  if (consultationHistory.length > 0) {
      const latestConsult = consultationHistory[consultationHistory.length - 1];
      deepContext += `\n[[INTELLIGENCE SOURCE 3: PREVIOUS RELATIONSHIP DIAGNOSIS]]\nStatus: ${latestConsult.statusAssessment}\nObserved Traits: ${latestConsult.partnerPersonalityAnalysis}\nRecommended Strategy: ${latestConsult.strategy}\n`;
  }

  const isCn = language === 'cn';
  const langInstruction = isCn ? 'Respond in STRICT Simplified Chinese (简体中文).' : 'Respond in English.';

  // Dynamic Headers based on Language
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

  // 3. The Prompt
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

  const validAvatar = isValidGeminiImage(avatarB64);
  const parts = [];
  if (validAvatar && avatarB64) {
      // Compress avatar aggressively as well
      const compressedAvatar = await compressImage(avatarB64, 800, 0.6, 300);
      parts.push(fileToGenerativePart(compressedAvatar));
  }
  // Add all user uploaded context images
  parts.push(...additionalImageParts);
  parts.push({ text: prompt });

  try {
      const model = getAnalysisModel();
      const config = { 
        responseMimeType: "application/json",
        thinkingConfig: model.includes('gemini') ? { thinkingBudget: 2048 } : undefined
      };

      const response = await getAi().models.generateContent({
        model: model,
        contents: { parts },
        config: config
      });

      const jsonText = response.text || "{}";
      const data = parseJSON(jsonText);

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
  } catch (e) {
      if (isRateLimitError(e)) {
         console.warn("Personality analysis quota exceeded, retrying with Gemini 3 Flash Preview.");
         try {
             const fallbackResponse = await getAi().models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts },
                config: { responseMimeType: "application/json" }
             });
             const data = parseJSON(fallbackResponse.text || "{}");
             return {
                bigFive: data.bigFive || { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
                mbti: data.mbti || "Unknown",
                emotionalStability: data.emotionalStability || 50,
                coreInterests: data.coreInterests || [],
                communicationStyle: data.communicationStyle || "Average",
                summary: data.summary || "Summary generated via backup model.",
                datingAdvice: data.datingAdvice || "No specific advice generated.",
                avatarAnalysis: data.avatarAnalysis || avatarAnalysis,
                dataSufficiency: data.dataSufficiency || 0,
                generatedAt: Date.now(),
                tags: data.tags || []
             };
         } catch (fError) {
             throw fError; 
         }
      }
      throw e;
  }
};
