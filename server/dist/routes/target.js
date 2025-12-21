import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
const router = express.Router();
// Get all targets for a user
router.get('/', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM target_profiles WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
// Get single target
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM target_profiles WHERE id = $1 AND user_id = $2', [id, req.userId]);
        if (result.rows.length === 0) {
            throw new AppError('Target not found', 404);
        }
        // Get related data
        const personalityReport = await pool.query('SELECT * FROM personality_reports WHERE target_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
        const socialAnalysis = await pool.query('SELECT * FROM social_analysis_results WHERE target_id = $1 ORDER BY created_at DESC', [id]);
        const postAnalysis = await pool.query('SELECT * FROM social_post_analysis WHERE target_id = $1 ORDER BY created_at DESC', [id]);
        const relationshipReports = await pool.query('SELECT * FROM relationship_reports WHERE target_id = $1 ORDER BY created_at DESC', [id]);
        res.json({
            ...result.rows[0],
            personalityReport: personalityReport.rows[0] || null,
            socialAnalysisHistory: socialAnalysis.rows,
            postAnalysisHistory: postAnalysis.rows,
            consultationHistory: relationshipReports.rows
        });
    }
    catch (error) {
        next(error);
    }
});
// Create target
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { name, occupation, bio, age, avatarB64, additionalImages, socialLinks, generalSummary } = req.body;
        const result = await pool.query(`INSERT INTO target_profiles 
       (user_id, name, occupation, bio, age, avatar_b64, additional_images, social_links, general_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [req.userId, name, occupation || '', bio || '', age || '', avatarB64 || '', additionalImages || [], socialLinks || '', generalSummary || '']);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
// Update target
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, occupation, bio, age, avatarB64, additionalImages, socialLinks, generalSummary } = req.body;
        const result = await pool.query(`UPDATE target_profiles SET
        name = COALESCE($1, name),
        occupation = COALESCE($2, occupation),
        bio = COALESCE($3, bio),
        age = COALESCE($4, age),
        avatar_b64 = COALESCE($5, avatar_b64),
        additional_images = COALESCE($6, additional_images),
        social_links = COALESCE($7, social_links),
        general_summary = COALESCE($8, general_summary),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`, [name, occupation, bio, age, avatarB64, additionalImages, socialLinks, generalSummary, id, req.userId]);
        if (result.rows.length === 0) {
            throw new AppError('Target not found', 404);
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
// Delete target
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM target_profiles WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
        if (result.rows.length === 0) {
            throw new AppError('Target not found', 404);
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// Save personality report
router.post('/:id/personality', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = req.body;
        await pool.query(`INSERT INTO personality_reports 
       (target_id, big_five, mbti, emotional_stability, core_interests, 
        communication_style, summary, dating_advice, avatar_analysis, data_sufficiency, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            id,
            JSON.stringify(report.bigFive),
            report.mbti,
            report.emotionalStability,
            report.coreInterests,
            report.communicationStyle,
            report.summary,
            report.datingAdvice,
            report.avatarAnalysis,
            report.dataSufficiency,
            report.generatedAt
        ]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// Save social analysis
router.post('/:id/social-analysis', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const analysis = req.body;
        await pool.query(`INSERT INTO social_analysis_results 
       (target_id, url, platform, handle, timeframe, executive_summary, report_tags,
        basic_profile, work_lifestyle, key_focus_elements, love_intentions,
        personality_analysis, personality_keywords, persona_analysis, performance_analysis,
        psychological_profile, approach_strategy, metrics, report, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`, [
            id, analysis.url, analysis.platform, analysis.handle, analysis.timeframe,
            analysis.executiveSummary, analysis.reportTags, analysis.basicProfile,
            analysis.workLifestyle, analysis.keyFocusElements, analysis.loveIntentions,
            analysis.personalityAnalysis, analysis.personalityKeywords, analysis.personaAnalysis,
            analysis.performanceAnalysis, analysis.psychologicalProfile, analysis.approachStrategy,
            JSON.stringify(analysis.metrics), analysis.report, analysis.timestamp
        ]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// Save post analysis
router.post('/:id/post-analysis', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, images, analysis, suggestedReplies, tags, timestamp } = req.body;
        await pool.query(`INSERT INTO social_post_analysis 
       (target_id, content, images, analysis, suggested_replies, tags, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, content, images, analysis, suggestedReplies, tags, timestamp]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// Save relationship report
router.post('/:id/relationship-report', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = req.body;
        await pool.query(`INSERT INTO relationship_reports 
       (user_id, target_id, compatibility_score, status_assessment, partner_personality_analysis,
        green_flags, red_flags, communication_dos, communication_donts, magic_topics,
        strategy, date_ideas, ice_breakers, tags, goal_context, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`, [
            req.userId, id, report.compatibilityScore, report.statusAssessment,
            report.partnerPersonalityAnalysis, report.greenFlags, report.redFlags,
            report.communicationDos, report.communicationDonts, report.magicTopics,
            report.strategy, JSON.stringify(report.dateIdeas), report.iceBreakers,
            report.tags, report.goalContext, report.generatedAt
        ]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=target.js.map