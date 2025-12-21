import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { callAI } from '../services/aiServiceV2.js';
const router = express.Router();
// Analyze avatar
router.post('/analyze-avatar', authenticate, async (req, res, next) => {
    try {
        const { name, imageB64, model } = req.body;
        const prompt = `
      You are an expert psychologist and vibe reader. 
      Analyze this avatar for ${name}. 
      What does this specific choice of image say about their self-perception, aesthetic, and current mood? 
      Keep it punchy, insightful, and slightly witty. Max 2 sentences.
    `;
        const response = await callAI({
            model: model || 'gemini-2.0-flash-exp',
            prompt,
            images: [imageB64]
        });
        res.json({ analysis: response.text });
    }
    catch (error) {
        next(error);
    }
});
// Analyze personality
router.post('/analyze-personality', authenticate, async (req, res, next) => {
    try {
        const { profile, avatarB64, additionalImages, socialData, model } = req.body;
        const prompt = `
      You are a Master Psychological Profiler. Create a deep personality profile for "${profile.name}".

      INPUT DATA:
      - Bio: ${profile.bio}
      - Age/Occupation: ${profile.age}, ${profile.occupation}
      
      Response JSON:
      {
        "bigFive": { "openness": 0, "conscientiousness": 0, "extraversion": 0, "agreeableness": 0, "neuroticism": 0 },
        "mbti": "string",
        "emotionalStability": 0,
        "coreInterests": ["string", "string"],
        "communicationStyle": "string",
        "summary": "string",
        "datingAdvice": "string",
        "avatarAnalysis": "string",
        "dataSufficiency": 0
      }
    `;
        const images = [];
        if (avatarB64)
            images.push(avatarB64);
        if (additionalImages)
            images.push(...additionalImages.slice(0, 2));
        const response = await callAI({
            model: model || 'gemini-3-pro-preview',
            prompt,
            images,
            responseFormat: 'json'
        });
        res.json(JSON.parse(response.text));
    }
    catch (error) {
        next(error);
    }
});
// Analyze social profile
router.post('/analyze-social', authenticate, async (req, res, next) => {
    try {
        const { url, screenshots, model } = req.body;
        const prompt = `
      You are an elite Digital Forensic Psychologist, Evolutionary Psychologist, and Profiler.
      Analyze the provided social media profile screenshots and/or URL context: ${url}.

      OUTPUT STRICTLY JSON with fields: platform, handle, executiveSummary, basicProfile, 
      workLifestyle, loveIntentions, personaAnalysis, performanceAnalysis, etc.
    `;
        const response = await callAI({
            model: model || 'gemini-3-pro-preview',
            prompt,
            images: screenshots || [],
            responseFormat: 'json'
        });
        res.json(JSON.parse(response.text));
    }
    catch (error) {
        next(error);
    }
});
// Generate persona reply
router.post('/persona-reply', authenticate, async (req, res, next) => {
    try {
        const { target, messages, model } = req.body;
        const prompt = `
      You are an expert method actor and behavioral psychologist. 
      Roleplay as ${target.name} based on their personality and respond to the last message.
      
      OUTPUT FORMAT (JSON):
      {
        "reply": "The character's text message reply",
        "insight": "Psychological subtext analysis"
      }
    `;
        const response = await callAI({
            model: model || 'gemini-2.0-flash-exp',
            prompt,
            responseFormat: 'json'
        });
        res.json(JSON.parse(response.text));
    }
    catch (error) {
        next(error);
    }
});
// Generate relationship report
router.post('/relationship-report', authenticate, async (req, res, next) => {
    try {
        const { target, user, context, model } = req.body;
        const prompt = `
      You are an Elite Clinical Relationship Psychologist & Behavioral Analyst.
      Analyze the relationship between ${user.name} and ${target.name}.
      
      OUTPUT JSON with: compatibilityScore, statusAssessment, greenFlags, redFlags, 
      communicationDos, communicationDonts, strategy, dateIdeas, etc.
    `;
        const response = await callAI({
            model: model || 'gemini-3-pro-preview',
            prompt,
            images: context.chatImages || [],
            responseFormat: 'json'
        });
        res.json(JSON.parse(response.text));
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=ai.js.map