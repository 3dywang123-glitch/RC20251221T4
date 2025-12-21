// V2 Gemini Service - Now uses backend API instead of direct Google AI calls
// This file maintains the same export interface for backwards compatibility with frontend pages

import { aiAPI, getPreferredModel, getAnalysisModel } from './apiClient';
import { SocialAnalysisResult, RelationshipReport, PersonalityReport, TargetProfile, UserProfile, SocialPostAnalysis } from '../types';

// Re-export helper functions for frontend use
export { getPreferredModel, getAnalysisModel };

// Image compression helper (keep on frontend for reducing upload size)
export const compressImage = async (base64Str: string, maxWidth = 1024, quality = 0.8, maxSizeKB?: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      const match = base64Str.match(/^data:([^;]+);base64,/);
      const mimeType = match ? match[1] : 'image/jpeg';
      
      let currentQuality = quality;
      let result = canvas.toDataURL(mimeType, currentQuality);

      if (maxSizeKB) {
        while (Math.round(result.length * 0.75) > (maxSizeKB * 1024) && currentQuality > 0.1) {
          currentQuality -= 0.1;
          result = canvas.toDataURL(mimeType, currentQuality);
        }
      }

      resolve(result);
    };
    img.onerror = () => {
      console.warn("Image compression failed, using original.");
      resolve(base64Str);
    };
  });
};

// Validate image format for Gemini
export const isValidGeminiImage = (input: string | undefined): boolean => {
  if (!input) return false;
  if (!input.startsWith('data:')) return false;
  const supportedFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  const match = input.match(/^data:([^;]+);base64,/);
  if (match && match[1]) {
    return supportedFormats.includes(match[1]);
  }
  return false;
};

// ==================== Smart Analysis ====================
export interface SmartAnalysisResult {
  type: 'PROFILE' | 'POST' | 'CHAT' | 'FEED' | 'UNKNOWN';
  confidence: number;
  extractedProfile: {
    name: string;
    gender: string;
    age: string;
    occupation: string;
    bio: string;
    socialHandle?: string;
  };
  avatarBox?: [number, number, number, number];
  avatarSourceIndex?: number;
  analysisSummary: string;
}

export const classifyAndExtract = async (inputB64s: string[]): Promise<SmartAnalysisResult> => {
  const validInputs = inputB64s.filter(isValidGeminiImage);
  if (validInputs.length === 0) {
    throw new Error("Invalid image format");
  }

  // Compress images before sending to backend
  const compressedInputs = await Promise.all(
    validInputs.map(img => compressImage(img, 1024, 0.8, 500))
  );

  const result = await aiAPI.smartClassify(compressedInputs);
  
  return {
    type: result.type || 'UNKNOWN',
    confidence: result.confidence || 0.9,
    extractedProfile: {
      name: result.extractedProfile?.name || '',
      gender: result.extractedProfile?.gender || 'Female',
      age: result.extractedProfile?.age || '',
      occupation: result.extractedProfile?.occupation || '',
      bio: result.extractedProfile?.bio || '',
      socialHandle: ''
    },
    avatarBox: result.avatarBox || null,
    avatarSourceIndex: result.avatarSourceIndex ?? 0,
    analysisSummary: result.analysisSummary || `Detected ${result.type || 'Content'}`
  };
};

// ==================== Profile Overview Analysis ====================
export const analyzeProfileOverview = async (
  url: string, 
  screenshots: string[], 
  language: string = 'en'
): Promise<SocialAnalysisResult> => {
  const validImages = screenshots.slice(0, 3).filter(isValidGeminiImage);
  
  // Compress images before sending
  const compressedImages = await Promise.all(
    validImages.map(img => compressImage(img, 800, 0.6, 300))
  );

  const result = await aiAPI.analyzeOverview(url, compressedImages, language, getAnalysisModel());
  
  return {
    id: result.id || Date.now().toString(),
    url,
    platform: result.platform || "Unknown",
    handle: result.handle || "Unknown",
    timeframe: result.timeframe || "Unknown",
    reportTags: result.reportTags || [],
    surfaceSubtext: result.surfaceSubtext || "Analysis pending...",
    targetAudience: result.targetAudience || "Analysis pending...",
    personaImpression: result.personaImpression || "Analysis pending...",
    performancePurpose: result.performancePurpose || "Analysis pending...",
    suggestedReplies: result.suggestedReplies || [],
    report: result.report || JSON.stringify(result, null, 2),
    timestamp: result.timestamp || Date.now(),
    inputImages: screenshots
  };
};

// ==================== Post Analysis ====================
export const analyzePost = async (
  content: string, 
  images: string[], 
  language: string = 'en'
): Promise<{analysis: string, suggestedReplies: string[], tags: string[]}> => {
  const validImages = images.slice(0, 2).filter(isValidGeminiImage);
  
  // Compress images before sending
  const compressedImages = await Promise.all(
    validImages.map(img => compressImage(img, 800, 0.6, 300))
  );

  const result = await aiAPI.analyzePost(content, compressedImages, language, getAnalysisModel());
  
  return {
    analysis: result.analysis || "Analysis failed.",
    suggestedReplies: result.suggestedReplies || [],
    tags: result.tags || []
  };
};

// ==================== Chat Log Analysis ====================
export const analyzeChatLog = async (
  target: TargetProfile, 
  user: UserProfile, 
  context: { stage: string, goal: string, duration: string, chatLogs: string, chatImages: string[] },
  language: string = 'en'
): Promise<RelationshipReport> => {
  const validChatImages = context.chatImages.slice(0, 3).filter(isValidGeminiImage);
  
  // Compress images before sending
  const compressedChatImages = await Promise.all(
    validChatImages.map(img => compressImage(img, 800, 0.6, 300))
  );

  const result = await aiAPI.analyzeChatLog(
    target,
    user,
    { ...context, chatImages: compressedChatImages },
    language,
    getAnalysisModel()
  );
  
  return {
    compatibilityScore: result.compatibilityScore || 0,
    statusAssessment: result.statusAssessment || "Analysis complete.",
    partnerPersonalityAnalysis: result.partnerPersonalityAnalysis,
    greenFlags: result.greenFlags || [],
    redFlags: result.redFlags || [],
    communicationDos: result.communicationDos || [],
    communicationDonts: result.communicationDonts || [],
    magicTopics: result.magicTopics || [],
    strategy: result.strategy || "",
    dateIdeas: result.dateIdeas || [],
    iceBreakers: result.iceBreakers || [],
    tags: result.tags || [],
    generatedAt: result.generatedAt || Date.now(),
    goalContext: context.goal
  };
};

// ==================== Personality Analysis ====================
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
  // Compress avatar
  let compressedAvatar: string | undefined;
  if (avatarB64 && isValidGeminiImage(avatarB64)) {
    compressedAvatar = await compressImage(avatarB64, 800, 0.6, 300);
  }

  // Compress additional images
  const validAdditionalImages = additionalImages.slice(0, 5).filter(isValidGeminiImage);
  const compressedAdditionalImages = await Promise.all(
    validAdditionalImages.map(img => compressImage(img, 800, 0.6, 300))
  );

  const result = await aiAPI.analyzePersonality(
    profile,
    compressedAvatar,
    compressedAdditionalImages,
    socialAnalysisHistory,
    postAnalysisHistory,
    consultationHistory,
    avatarAnalysis,
    supplementaryInfo,
    language,
    getAnalysisModel()
  );

  return {
    bigFive: result.bigFive || { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
    mbti: result.mbti || "Unknown",
    emotionalStability: result.emotionalStability || 50,
    coreInterests: result.coreInterests || [],
    communicationStyle: result.communicationStyle || "Average",
    summary: result.summary || "No summary generated.",
    datingAdvice: result.datingAdvice || "No specific advice generated.",
    avatarAnalysis: result.avatarAnalysis || avatarAnalysis,
    dataSufficiency: result.dataSufficiency || 0,
    generatedAt: result.generatedAt || Date.now()
  };
};

// ==================== Avatar Analysis ====================
export const analyzeAvatar = async (name: string, imageB64: string): Promise<string> => {
  if (!isValidGeminiImage(imageB64)) {
    return "Unable to analyze - invalid image format";
  }

  const compressedImage = await compressImage(imageB64, 800, 0.6, 300);
  const result = await aiAPI.analyzeAvatar(name, compressedImage, getPreferredModel());
  
  return result.analysis || "Unable to analyze avatar";
};

// Generate avatar (placeholder - may need to use different API)
export const generateAvatar = async (name: string, traits: string): Promise<string> => {
  // Avatar generation typically requires different API
  // For now return empty string, can be implemented later
  console.warn("generateAvatar not yet implemented for backend");
  return "";
};

// Analyze image content (generic)
export const analyzeImageContent = async (imageB64: string): Promise<string> => {
  if (!isValidGeminiImage(imageB64)) {
    return "Unable to analyze - invalid image format";
  }

  // Use avatar analysis as a generic image analysis
  const compressedImage = await compressImage(imageB64, 800, 0.6, 300);
  const result = await aiAPI.analyzeAvatar("this image", compressedImage, getPreferredModel());
  
  return result.analysis || "Unable to analyze image";
};

// ==================== Chat Simulation ====================
export const generatePersonaReply = async (
  target: TargetProfile,
  messages: { sender: string; text: string }[]
): Promise<{ reply: string; insight: string }> => {
  const result = await aiAPI.generatePersonaReply(target, messages, getPreferredModel());
  
  return {
    reply: result.reply || "...",
    insight: result.insight || ""
  };
};

// Generate reply options (multiple suggestions)
export const generateReplyOptions = async (
  target: TargetProfile,
  messages: { sender: string; text: string }[]
): Promise<string[]> => {
  // For now, generate single reply and return as array
  // Can be expanded later for multiple options
  const result = await generatePersonaReply(target, messages);
  return [result.reply];
};

// Analyze partner's message
export const analyzePartnerMessage = async (
  target: TargetProfile,
  message: string
): Promise<string> => {
  const result = await aiAPI.generatePersonaReply(
    target,
    [{ sender: 'partner', text: message }],
    getPreferredModel()
  );
  
  return result.insight || "No analysis available";
};

// Analyze user's message
export const analyzeUserMessage = async (
  target: TargetProfile,
  message: string
): Promise<string> => {
  const result = await aiAPI.generatePersonaReply(
    target,
    [{ sender: 'user', text: message }],
    getPreferredModel()
  );
  
  return result.insight || "No analysis available";
};

// Generate conversation starters
export const generateConversationStarters = async (
  target: TargetProfile
): Promise<string[]> => {
  const result = await aiAPI.generatePersonaReply(
    target,
    [{ sender: 'system', text: 'Generate conversation starters' }],
    getPreferredModel()
  );
  
  // Return as array of suggestions
  return result.reply ? [result.reply] : ["Hey, how are you?"];
};
