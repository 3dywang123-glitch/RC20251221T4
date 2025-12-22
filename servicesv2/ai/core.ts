
import { GoogleGenAI } from "@google/genai";

// Lazy initialization of the AI client
let aiInstance: GoogleGenAI | null = null;

export const resetAi = () => {
  aiInstance = null;
};

export const getPreferredEndpoint = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('soulsync_api_endpoint') || 'https://hnd1.aihub.zeabur.ai/';
  }
  return 'https://hnd1.aihub.zeabur.ai/';
};

export const getAi = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key is missing. AI features will fail.");
      // Throwing here will be caught by the calling function's try-catch block
      throw new Error("API Key is missing. Please check your configuration.");
    }
    
    // baseUrl is not supported in the current GoogleGenAI types options
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Get user preference from storage, default to Gemini 3 Flash Preview
export const getPreferredModel = (): string => {
  if (typeof window !== 'undefined') {
    const pref = localStorage.getItem('soulsync_model_preference');
    if (pref && pref.startsWith('gemini')) return pref;
  }
  return 'gemini-3-flash-preview';
};

// Get user preference for HEAVY analysis (Social, Consult, Personality)
// Note: Currently always returns default model as placeholders don't affect actual functionality
export const getAnalysisModel = (): string => {
  return 'gemini-3-flash-preview';
};

export const fileToGenerativePart = (input: string, defaultMimeType = 'image/jpeg') => {
  let data = input;
  let mimeType = defaultMimeType;

  // Check if input is a Data URI (e.g. data:image/svg+xml;base64,...)
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    data = match[2];
  }
  return { inlineData: { mimeType, data } };
};

export const isValidGeminiImage = (input: string | undefined): boolean => {
  if (!input) return false;
  if (!input.startsWith('data:')) return false;
  // Gemini supports PNG, JPEG, WEBP, HEIC, HEIF. It does NOT support SVG.
  const supportedFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  const match = input.match(/^data:([^;]+);base64,/);
  if (match && match[1]) {
    return supportedFormats.includes(match[1]);
  }
  return false;
};

// Helper to compress images to reduce payload size and prevent XHR errors
// Now supports strict size limits in KB
export const compressImage = async (base64Str: string, maxWidth = 1024, quality = 0.8, maxSizeKB?: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Initial Resize logic
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
      
      // Determine format from string or default to jpeg
      const match = base64Str.match(/^data:([^;]+);base64,/);
      const mimeType = match ? match[1] : 'image/jpeg';
      
      let currentQuality = quality;
      let result = canvas.toDataURL(mimeType, currentQuality);

      // Recursive compression if maxSizeKB is provided
      if (maxSizeKB) {
         // Base64 string length ~ 1.33 * size in bytes. 
         // Header overhead is negligible for large files but let's be safe.
         // A safe approximation for bytes is (length * 0.75).
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

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isRateLimitError = (e: any): boolean => {
  return e.toString().includes('429') || e.message?.includes('429') || e.status === 429 || e.code === 429;
};

// Robust JSON Parsing Helper
export const parseJSON = (text: string) => {
  if (!text) return {};
  
  // Handle AI Refusals gracefully to avoid UI crash
  if (text.trim().startsWith("I am unable") || text.includes("unable to fulfill") || text.includes("I cannot")) {
     console.warn("AI Refusal detected:", text);
     return {}; // Return empty object which consumes will treat as empty analysis
  }

  const attemptParse = (str: string) => {
    try {
      // 1. Remove Markdown code blocks (```json ... ```)
      let clean = str.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // 2. Trim whitespace
      clean = clean.trim();
      
      // 3. Attempt direct parse
      return JSON.parse(clean);
    } catch (e) {
      throw e;
    }
  };

  try {
    return attemptParse(text);
  } catch (e) {
    // 4. Fallback: Try to find the first { and last } to extract JSON object
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
