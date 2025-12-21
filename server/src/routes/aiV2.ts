import express, { Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import * as aiServiceV2 from '../services/aiServiceV2.js';

const router = express.Router();

// Smart Classification & Extraction (No auth required for guest users)
router.post('/smart-classify', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { images, model } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const result = await aiServiceV2.classifyAndExtract(images, model);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Profile Overview Analysis (Social Media Profile)
router.post('/analyze-overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { url, screenshots, language, model } = req.body;
    
    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      return res.status(400).json({ error: 'Screenshots array is required' });
    }

    const result = await aiServiceV2.analyzeProfileOverview(
      url || '', 
      screenshots, 
      language || 'en',
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Post Analysis
router.post('/analyze-post', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, images, language, model } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const result = await aiServiceV2.analyzePost(
      content || '', 
      images, 
      language || 'en',
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Chat Log Analysis
router.post('/analyze-chat-log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { target, user, context, language, model } = req.body;
    
    if (!context || !context.chatLogs) {
      return res.status(400).json({ error: 'Chat logs are required' });
    }

    const result = await aiServiceV2.analyzeChatLog(
      target || {},
      user || {},
      context,
      language || 'en',
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Personality Analysis V2
router.post('/analyze-personality-v2', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      profile, 
      avatarB64, 
      additionalImages, 
      socialAnalysisHistory,
      postAnalysisHistory,
      consultationHistory,
      avatarAnalysis,
      supplementaryInfo,
      language, 
      model 
    } = req.body;
    
    if (!profile || !profile.name) {
      return res.status(400).json({ error: 'Profile with name is required' });
    }

    const result = await aiServiceV2.analyzePersonalityV2(
      profile,
      avatarB64,
      additionalImages || [],
      socialAnalysisHistory || [],
      postAnalysisHistory || [],
      consultationHistory || [],
      avatarAnalysis,
      supplementaryInfo,
      language || 'en',
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Avatar Analysis
router.post('/analyze-avatar', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, imageB64, model } = req.body;

    if (!imageB64) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await aiServiceV2.analyzeAvatar(
      name || 'Unknown',
      imageB64,
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Persona Reply for Chat Simulation
router.post('/persona-reply', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { target, messages, model } = req.body;

    if (!target || !messages) {
      return res.status(400).json({ error: 'Target and messages are required' });
    }

    const result = await aiServiceV2.generatePersonaReply(
      target,
      messages,
      model
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
