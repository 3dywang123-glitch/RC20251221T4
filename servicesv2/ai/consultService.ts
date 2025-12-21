import { callAI, getPreferredModel, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, isRateLimitError, parseJSON, getLanguageInstruction, getFallbackText } from "./core";
import { TargetProfile, UserProfile, RelationshipReport } from "../../types";

export const generateRelationshipReport = async (
  target: TargetProfile, 
  user: UserProfile, 
  context: { stage: string, goal: string, duration: string, chatLogs: string, chatImages: string[] }
): Promise<RelationshipReport> => {
  
  console.log('[consultService] generateRelationshipReport called');
  console.log('[consultService] target:', target.name);
  console.log('[consultService] user:', user.name);
  console.log('[consultService] context:', context);
  
  // Limit images - 优化：更激进的压缩以加速处理 (768px, 0.5质量, 500KB限制)
  const validChatImages = context.chatImages.slice(0, 3).filter(isValidGeminiImage);
  const compressedChatImages = await Promise.all(validChatImages.map(img => compressImage(img, 768, 0.5, 500000)));
  const imageParts = compressedChatImages.map(img => fileToGenerativePart(img));

  const prompt = `
    You are an Elite Clinical Relationship Psychologist & Behavioral Analyst.
    
    ${getLanguageInstruction()}

    ANALYZE:
    ${target.name ? `- Target: ${target.name}.` : ''}
    ${target.age ? `- Target Age: ${target.age}.` : ''}
    ${target.gender ? `- Target Gender: ${target.gender}.` : ''}
    ${target.occupation ? `- Target Occupation: ${target.occupation}.` : ''}
    ${user.name ? `- User: ${user.name}.` : ''}
    ${user.age ? `- User Age: ${user.age}.` : ''}
    ${user.occupation ? `- User Occupation: ${user.occupation}.` : ''}
    - Consultation Goal: ${context.goal || 'Not specified'}.
    - Relationship Duration: ${context.duration || 'Not specified'}.
    - Chat Logs: "${context.chatLogs}"

    **CRITICAL INSTRUCTION**:
    1. If screenshots are provided, analyze timestamps to order them chronologically. 
    2. Identify the platform. 
    3. Decode MICRO-EXPRESSIONS.

    **OUTPUT STRUCTURE**:
    Generate a JSON response. 
    The 'strategy' field MUST be a Markdown string structured exactly like this:
    
    ### 1. Signals from Partner
    ...
    ### 2. Psychological & Personality Analysis
    ...
    ### 3. Operational Highlights
    ...
    ### 4. Optimization
    ...
    ### 5. Next Steps
    ...
    ### 6. Summary
    ...

    **DO NOT** use single '#' on a line by itself.
    **DO NOT** add a main title (like # Report) at the top. Start directly with the first section.

    JSON Schema:
    {
      "compatibilityScore": 0,
      "statusAssessment": "string",
      "partnerPersonalityAnalysis": "string",
      "greenFlags": ["string"],
      "redFlags": ["string"],
      "communicationDos": ["string"],
      "communicationDonts": ["string"],
      "magicTopics": ["string"],
      "strategy": "string",
      "dateIdeas": [{ "title": "string", "description": "string" }],
      "tags": ["string"]
    }
  `;

  try {
      // Use specific ANALYSIS model preference
      const model = getAnalysisModel();
      console.log('[consultService] Using model:', model);
      console.log('[consultService] Calling callAI...');
      
      const response = await callAI({
        model: model,
        prompt: prompt,
        images: compressedChatImages,
        responseFormat: 'json'
      });

      console.log('[consultService] callAI response received:', response.text?.substring(0, 200));
      const jsonText = response.text || "{}";
      const data = parseJSON(jsonText);

      return {
        compatibilityScore: data.compatibilityScore || 0,
        statusAssessment: data.statusAssessment || getFallbackText('analysisComplete'),
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
      if (isRateLimitError(e)) {
          // Fallback/Retry with Flash
          console.warn("Consultation quota exceeded, retrying with Gemini 2.0 Flash Exp.");
          const fallbackResponse = await callAI({
            model: 'gemini-2.0-flash-exp',
            prompt: prompt,
            images: compressedChatImages,
            responseFormat: 'json'
          });
          const data = parseJSON(fallbackResponse.text || "{}");
          return {
            compatibilityScore: data.compatibilityScore || 0,
            statusAssessment: data.statusAssessment || getFallbackText('analysisComplete'),
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