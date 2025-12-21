
import { getAi, getPreferredModel, fileToGenerativePart, isValidGeminiImage, compressImage, wait, isRateLimitError } from "./core";

export const generateAvatar = async (name: string, description: string, retries = 2): Promise<string> => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      // Add a delay for retries
      if (i > 0) await wait(1000 * i);

      // Use gemini-2.5-flash-image for general image generation tasks
      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A stylized, artistic avatar profile picture for a person named ${name}. Description: ${description}. Soft lighting, modern aesthetic, high quality.` }]
        }
      });
      
      // Iterate through parts to find the image part (nano banana series models)
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }
      throw new Error("No image data in response");
    } catch (e) {
      console.warn(`Avatar generation attempt ${i+1} failed:`, e);
      lastError = e;
    }
  }
  throw lastError;
};

export const analyzeAvatar = async (name: string, imageB64: string): Promise<string> => {
  if (!isValidGeminiImage(imageB64)) {
      return "Unable to analyze this image format (SVG/Icon). Please upload a real photo.";
  }

  const compressedImage = await compressImage(imageB64, 512);

  const prompt = `
    You are an expert psychologist and vibe reader. 
    Analyze this avatar for ${name}. 
    What does this specific choice of image say about their self-perception, aesthetic, and current mood? 
    Keep it punchy, insightful, and slightly witty. Max 2 sentences.
  `;
  
  try {
    // Dynamic Model
    const model = getPreferredModel();
    const response = await getAi().models.generateContent({
      model: model,
      contents: {
        parts: [
          fileToGenerativePart(compressedImage),
          { text: prompt }
        ]
      }
    });
    return response.text || "No analysis generated.";
  } catch (e) {
    if (isRateLimitError(e)) {
       console.warn("Quota exceeded for analyzeAvatar, retrying with Gemini 3 Flash Preview.");
       try {
         const fallbackResponse = await getAi().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                fileToGenerativePart(compressedImage),
                { text: prompt }
              ]
            }
         });
         return fallbackResponse.text || "Analysis complete.";
       } catch (fallbackError) {
         console.warn("Fallback failed:", fallbackError);
         return "Avatar analysis unavailable due to high traffic.";
       }
    }
    console.error("Avatar analysis failed:", e);
    return "Analysis failed.";
  }
};

// Generic image context analyzer for uploaded screenshots/posts
export const analyzeImageContent = async (imageB64: string): Promise<string> => {
  if (!isValidGeminiImage(imageB64)) return "Invalid Image";
  
  const compressedImage = await compressImage(imageB64, 400);

  const prompt = `
    Identify what this image is in 2-4 words. 
    Examples: "Chat Log Screenshot", "Selfie", "Travel Landscape", "Food Photo", "Meme", "Instagram Grid".
    Return ONLY the label.
  `;

  try {
    // Dynamic Model
    const model = getPreferredModel();
    const response = await getAi().models.generateContent({
      model: model,
      contents: {
        parts: [
          fileToGenerativePart(compressedImage),
          { text: prompt }
        ]
      }
    });
    return response.text?.trim() || "Image";
  } catch (e) {
    if (isRateLimitError(e)) {
      console.warn("Rate limit hit for image content tag, skipping.");
      return "Image";
    }
    console.warn("Image context analysis failed", e);
    return "Image";
  }
};
