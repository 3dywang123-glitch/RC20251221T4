import { callAI, getPreferredModel, getAnalysisModel, fileToGenerativePart, isValidGeminiImage, compressImage, wait, isRateLimitError, parseJSON, getLanguageInstruction, getFallbackText } from "./core";
import { SocialAnalysisResult } from "../../types";

export const analyzeSocialProfile = async (url: string, screenshots: string[], note?: string): Promise<SocialAnalysisResult> => {
  // Enhanced Retry logic for robustness and rate limits
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Limit to max 3 images to prevent payload issues
      const validImages = screenshots.slice(0, 3).filter(isValidGeminiImage);
      
      // 优化：更激进的压缩以加速上传和AI处理 (768px, 0.5质量, 500KB限制)
      const compressedImages = await Promise.all(validImages.map(img => compressImage(img, 768, 0.5, 500000)));
      const imageParts = compressedImages.map(img => fileToGenerativePart(img));

      let prompt = `
        You are an elite Digital Forensic Psychologist, Evolutionary Psychologist, and Profiler.
        
        ${getLanguageInstruction()}
        
        Analyze the provided social media profile screenshots and/or URL context: ${url}.

        **Objective**: Decode the "Impression Management" strategy of this individual.
        
        Structure your analysis into the following parts. **Strictly adhere to the length requirements**.

        --- EXECUTIVE SUMMARY ---
        0. **Executive Summary**: A sophisticated, 200-word high-level psychological summary of the subject. Focus on their core archetype, social strategy, and hidden drivers.

        --- PART 1: SUMMARY & MINING (Fact-based & Inference) ---
        1. **Basic Profile**: (150-250 words) Foundation of their image. Demographics, Aesthetic Vibe, Self-Perception.
        2. **Work & Lifestyle**: (200-300 words) Career status, financial signaling, leisure habits.
        3. **Key Focus Elements**: (300-500 words) Identify unique hooks, specific hobbies, conversation starters, or details worth focusing on. What makes them unique?
        4. **Love & Emotional Clues**: (200-300 words) **CRITICAL**. Mine for signs of being single, taken, or "complicated". Look for "thirst traps", soft launches, or loneliness signals.
        5. **Personality Analysis**: (150-250 words) Big Five traits, core values, communication style.

        --- PART 2: DEEP ANALYSIS (Psychological Subtext) ---
        6. **Persona Analysis**: (300-500 words) What character are they playing? (e.g., "The Intellectual", "The Chill Girl", "The Hustler"). Analyze the mask.
        7. **Performance Component Analysis**: (300-500 words) **CRITICAL**. Analyze the gap between their "Stage Self" and likely "Real Self". How much is staged? What insecurities are they covering up with this performance? 
        8. **Deep Psychological Profile (Recap)**: (300-500 words) A comprehensive deep dive into their psychological drivers, fears, and attachment style.
        9. **Suggested Approach**: (300-500 words) If someone wanted to date them, what is the best entry point? Detailed tactical advice.
        
        10. **Report Tags**: 3 distinct, punchy tags summarizing the essence (e.g. "Old Money Aesthetic", "Validation Seeking", "Guarded").

        OUTPUT STRICTLY JSON:
        {
          "platform": "string",
          "handle": "string",
          "timeframe": "string",
          "executiveSummary": "string (200 words)",
          "reportTags": ["string", "string", "string"],
          
          "basicProfile": "string (150-250 words)",
          "workLifestyle": "string (200-300 words)",
          "keyFocusElements": "string (300-500 words)",
          "loveIntentions": "string (200-300 words)",
          "personalityAnalysis": "string (150-250 words)",
          "personalityKeywords": ["string", "string", "string"],
          
          "personaAnalysis": "string (300-500 words)",
          "performanceAnalysis": "string (300-500 words)",
          "psychologicalProfile": "string (300-500 words)",
          "approachStrategy": "string (300-500 words)",
          
          "metrics": {
            "followers": "string",
            "frequency": "string",
            "engagement": "string"
          }
        }
      `;
      // If user provided supplemental note, prepend it to the prompt to give AI extra context
      if (note && note.trim()) {
        prompt = `用户补充输入了以下信息：\n${note.trim()}\n\n` + prompt;
      }

      // Use specific ANALYSIS model preference
      const modelToUse = getAnalysisModel();
      
      const response = await callAI({
          model: modelToUse,
          prompt: prompt,
          images: compressedImages,
          responseFormat: 'json'
      });

      const jsonText = response.text || "{}";
      const data = parseJSON(jsonText);
      
      return {
          id: Date.now().toString(),
          url,
          platform: data.platform || getFallbackText('unknownType'),
          handle: data.handle || getFallbackText('unknownType'),
          timeframe: data.timeframe || getFallbackText('unknownType'),
          executiveSummary: data.executiveSummary || getFallbackText('analysisPending'),
          reportTags: data.reportTags || [],
          
          // Part 1
          basicProfile: data.basicProfile || getFallbackText('analysisPending'),
          workLifestyle: data.workLifestyle || getFallbackText('analysisPending'),
          keyFocusElements: data.keyFocusElements || getFallbackText('noElements'),
          loveIntentions: data.loveIntentions || getFallbackText('analysisPending'),
          personalityAnalysis: data.personalityAnalysis || getFallbackText('analysisPending'),
          personalityKeywords: data.personalityKeywords || [],

          // Part 2
          personaAnalysis: data.personaAnalysis || getFallbackText('analysisPending'),
          performanceAnalysis: data.performanceAnalysis || getFallbackText('analysisPending'),
          psychologicalProfile: data.psychologicalProfile || getFallbackText('analysisPending'),
          approachStrategy: data.approachStrategy || getFallbackText('analysisPending'),

          metrics: data.metrics || { followers: "?", frequency: "?", engagement: "?" },
          report: JSON.stringify(data, null, 2), // Backup
          timestamp: Date.now()
      };
    } catch (e: any) {
      console.error(`Attempt ${attempt+1} failed:`, e);
      
      const isRateLimit = isRateLimitError(e);
      
      if (attempt === maxRetries) {
         if (isRateLimit) {
            throw new Error(getFallbackText('quotaExceeded'));
         }
         throw new Error(getFallbackText('imageTooLarge'));
      }
      
      attempt++;
      // Exponential Backoff: 2s, 4s, 8s, 16s...
      await wait(2000 * Math.pow(2, attempt)); 
    }
  }
  throw new Error("Unexpected error in analyzeSocialProfile");
};

export const analyzeSinglePost = async (content: string, images: string[], supplement?: string): Promise<{analysis: string, suggestedReplies: string[], tags: string[]}> => {
  // Limit to max 2 images for post analysis
  const validImages = images.slice(0, 2).filter(isValidGeminiImage);
  // 优化：更激进的压缩以加速处理 (768px, 0.5质量, 500KB限制)
  const compressedImages = await Promise.all(validImages.map(img => compressImage(img, 768, 0.5, 500000)));
  const imageParts = compressedImages.map(img => fileToGenerativePart(img));

  const prompt = `
    Analyze this specific social media post (text + images).
    Act as a Relationship Coach and Evolutionary Psychologist.
    
    ${getLanguageInstruction()}
    
    Structure the 'analysis' string using specific Markdown headers: '### Title'.
    
    Sections Required:
    
    ### 1. Basic Content Analysis
    (150-250 words) Deconstruct the visual elements, caption semantics, and context. What exactly is happening here?
    
    ### 2. Target Audience
    (100-150 words) Who is this post really for? (Exes, potential dates, friends, rivals). Analyze the signaling target.
    
    ### 3. Persona & Impression
    (100-200 words) What specific impression is the user trying to engineer? (e.g. "Effortlessly rich", "Intellectually deep", "Single and ready").
    
    ### 4. Performance & Purpose
    (100-200 words) Analyze the 'Functionality' of this post. Is it a thirst trap? A status signal? A cry for attention? Analyze the gap between the 'Stage Self' and potential reality.

    Also generate 3 distinct suggested replies.

    OUTPUT JSON:
    {
      "analysis": "string (Markdown formatted with ### headers as requested above)",
      "suggestedReplies": ["string (Style 1)", "string (Style 2)", "string (Style 3)"],
      "tags": ["string", "string", "string"]
    }
  `;

  let fullPrompt = content ? `Caption: "${content}"\n\n${prompt}` : prompt;
  if (supplement && supplement.trim()) {
    fullPrompt = `用户补充输入了以下信息：\n${supplement.trim()}\n\n` + fullPrompt;
  }

  try {
     // Use specific ANALYSIS model preference
     const model = getAnalysisModel();
     const response = await callAI({
       model: model,
       prompt: fullPrompt,
       images: compressedImages,
       responseFormat: 'json'
     });
     const jsonText = response.text || "{}";
     const data = parseJSON(jsonText);
     return {
         analysis: data.analysis || getFallbackText('analysisFailed'),
         suggestedReplies: data.suggestedReplies || [],
         tags: data.tags || []
     };
  } catch (e) {
      if (isRateLimitError(e)) {
         console.warn("Rate limit hit for single post analysis, retrying with Gemini 2.0 Flash Exp.");
         try {
            const fallbackResponse = await callAI({
              model: 'gemini-3-flash-preview',
              prompt: fullPrompt,
              images: compressedImages,
              responseFormat: 'json'
            });
            const jsonText = fallbackResponse.text || "{}";
            const data = parseJSON(jsonText);
            return {
                analysis: data.analysis || getFallbackText('analysisFailed'),
                suggestedReplies: data.suggestedReplies || [],
                tags: data.tags || []
            };
         } catch(fallbackE) {
            console.error("Retry failed:", fallbackE);
         }
      }
      
      return {
          analysis: getFallbackText('highTraffic'),
          suggestedReplies: [],
          tags: []
      };
  }
};
