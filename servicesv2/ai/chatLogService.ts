
import { getAi, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, isRateLimitError, parseJSON } from "./core";
import { TargetProfile, UserProfile, RelationshipReport } from "../../types";

export const analyzeChatLog = async (
  target: TargetProfile, 
  user: UserProfile, 
  context: { stage: string, goal: string, duration: string, chatLogs: string, chatImages: string[] },
  language: string = 'en'
): Promise<RelationshipReport> => {
  
  // Limit images to 3
  const validChatImages = context.chatImages.slice(0, 3).filter(isValidGeminiImage);
  // Compress: 800px, 0.6q, max 300KB
  const compressedChatImages = await Promise.all(validChatImages.map(img => compressImage(img, 800, 0.6, 300)));
  const imageParts = compressedChatImages.map(img => fileToGenerativePart(img));

  const isCn = language === 'cn';
  
  // Dynamic Instructions based on Language
  const langInstruction = isCn 
    ? 'Respond in STRICT Simplified Chinese (简体中文). DO NOT use English in the output.' 
    : 'Respond in English.';

  // Dynamic Headers based on Language - Removed Sub-headers
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


  try {
      const model = getAnalysisModel();
      const config = { 
        responseMimeType: "application/json",
        thinkingConfig: model.includes('gemini') ? { thinkingBudget: 2048 } : undefined
      };

      const response = await getAi().models.generateContent({
        model: model,
        contents: { parts: [...imageParts, { text: prompt }] },
        config: config
      });

      const data = parseJSON(response.text || "{}");

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
  } catch (e) {
      // Fallback with Gemini 3 Flash Preview only if strict rate limit error
      if (isRateLimitError(e)) {
          const fallbackResponse = await getAi().models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: { parts: [...imageParts, { text: prompt }] },
              config: { responseMimeType: "application/json" }
          });
          const data = parseJSON(fallbackResponse.text || "{}");
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
      }
      throw e;
  }
};
