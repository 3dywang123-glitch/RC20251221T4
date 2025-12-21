
import { getAi, fileToGenerativePart, isValidGeminiImage, compressImage, parseJSON, wait } from "./core";

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
  avatarBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  avatarSourceIndex?: number; // The index of the image where the avatar was found
  analysisSummary: string;
}

export const classifyAndExtract = async (inputB64s: string[]): Promise<SmartAnalysisResult> => {
  const validInputs = inputB64s.filter(isValidGeminiImage);
  if (validInputs.length === 0) {
    throw new Error("Invalid image format");
  }

  // Switched back to Gemini 2.5 Flash Image for optimized vision tasks
  const model = 'gemini-2.5-flash-image';

const promptText = `
  You are an expert UI/UX Analyst for Asian Social Apps (WeChat, RedNote, Instagram).
  Analyze the **COLLECTION** of screenshots provided as a single dataset.
  
  **MISSION**: 
  1. Determine the **DOMINANT** screen type across all images.
  2. Extract the **TARGET USER'S** profile info by synthesizing text from all images.

  **CLASSIFICATION RULES (Priority Order)**:
  
  *Analyze the set as a whole. If there are mixed types, use this priority:*

  1. **"CHAT" (Conversation Logs)**
     - **Visual Signature**: Speech bubbles, alternating rows, bottom input bar.
     - **Priority**: HIGHEST. If multiple screenshots show a conversation flow, classify as CHAT.
  
  2. **"PROFILE" (User Home / Feed)**
     - **Visual Signature**: Large Avatar + Bio + Stats (Followers) at the top. Vertical list of posts.
     - **Priority**: HIGH. If one image is clearly a Profile Header, classify as PROFILE, even if others are feed items.

  3. **"POST" (Single Content Detail / Moment)**
     - **Visual Signature**: A focused view of ONE main post with comments below it.
     - **SPECIAL RULE**: If only ONE image is provided and it looks like a regular photo, meme, selfie, or lifestyle shot (without strong Chat/Profile UI overlays), classify it as **POST**. This implies the user wants to analyze the content of this specific image.

  4. **"UNKNOWN"**
     - Fallback for unclear images or black screens.

  **EXTRACTION TASK (Synthesize from ALL images)**:
  - **NAME**: Look for the username.
    - *Chat*: Top center header.
    - *Profile*: Prominent text near the main avatar.
    - *Post*: Name above the content.
  - **BIO/INFO**: Scan all images for Age, Occupation, or Bio text tags (e.g. "24", "Designer", "INFP").
  - **AVATAR_BOX & SOURCE**: 
    - Identify the **TARGET USER'S** avatar (NOT the app owner's/self).
    - **Logic**:
        - **CHAT**: Pick the Partner's avatar (usually LEFT side).
        - **PROFILE**: Pick the large Header Avatar.
        - **POST**: Pick the Author's avatar (usually top left of the post card).
    - Return **avatarBox** [ymin, xmin, ymax, xmax] (0-1000).
    - Return **avatarSourceIndex**: The 0-based index of the image containing this best avatar.

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

  const mapResult = (data: any): SmartAnalysisResult => ({
    type: data.type || 'UNKNOWN',
    confidence: 0.9,
    extractedProfile: {
      name: data.extractedProfile?.name || '',
      gender: (['Male', 'Female'].includes(data.extractedProfile?.gender) ? data.extractedProfile?.gender : 'Female'),
      age: data.extractedProfile?.age || '', 
      occupation: data.extractedProfile?.occupation || '',
      bio: data.extractedProfile?.bio || '', 
      socialHandle: ''
    },
    avatarBox: data.avatarBox || null,
    avatarSourceIndex: typeof data.avatarSourceIndex === 'number' ? data.avatarSourceIndex : 0,
    analysisSummary: `Detected ${data.type || 'Content'}`
  });

  try {
    // Process all valid inputs without limit as requested
    const inputsToProcess = validInputs;
    
    // High quality compression for text readability
    const compressedInputs = await Promise.all(
        inputsToProcess.map(img => compressImage(img, 1024, 0.8, 500))
    );
    const imageParts = compressedInputs.map(img => fileToGenerativePart(img));

    const response = await getAi().models.generateContent({
      model: model,
      contents: { parts: [...imageParts, { text: promptText }] },
      config: { 
        // Note: 2.5-flash-image might not strictly adhere to responseMimeType in all regions, but we set it for best effort
        // If it returns raw text, the parseJSON utility handles it.
        // responseMimeType: "application/json" 
      }
    });

    const data = parseJSON(response.text || "{}");
    return mapResult(data);

  } catch (e) {
    console.warn("Smart Analysis attempt failed...", e);
    // Fallback logic: Try singular image if batch fails (often due to size limits)
    try {
        const singleImage = await compressImage(validInputs[0], 800, 0.6, 200);
        const response = await getAi().models.generateContent({
            model: model,
            contents: { parts: [fileToGenerativePart(singleImage), { text: promptText }] }
        });
        return mapResult(parseJSON(response.text || "{}"));
    } catch (e2) {
        throw new Error("Analysis failed. Please ensure the screenshot is clear.");
    }
  }
};
