import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
const router = express.Router();
// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`SELECT u.id, u.username, u.email, u.is_guest,
              p.name, p.occupation, p.bio, p.age, p.avatar_b64,
              p.additional_images, p.social_links,
              p.ai_model_preference, p.analysis_model_preference, p.api_endpoint
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`, [req.userId]);
        if (result.rows.length === 0) {
            throw new AppError('User not found', 404);
        }
        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            isGuest: user.is_guest,
            profile: {
                name: user.name || user.username,
                occupation: user.occupation || '',
                bio: user.bio || '',
                age: user.age || '',
                avatarB64: user.avatar_b64 || '',
                additionalImages: user.additional_images || [],
                socialLinks: user.social_links || '',
                aiModelPreference: user.ai_model_preference,
                analysisModelPreference: user.analysis_model_preference,
                apiEndpoint: user.api_endpoint
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const { name, occupation, bio, age, avatarB64, additionalImages, socialLinks, aiModelPreference, analysisModelPreference, apiEndpoint } = req.body;
        await pool.query(`UPDATE user_profiles SET
        name = COALESCE($1, name),
        occupation = COALESCE($2, occupation),
        bio = COALESCE($3, bio),
        age = COALESCE($4, age),
        avatar_b64 = COALESCE($5, avatar_b64),
        additional_images = COALESCE($6, additional_images),
        social_links = COALESCE($7, social_links),
        ai_model_preference = COALESCE($8, ai_model_preference),
        analysis_model_preference = COALESCE($9, analysis_model_preference),
        api_endpoint = COALESCE($10, api_endpoint),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $11`, [
            name, occupation, bio, age, avatarB64,
            additionalImages, socialLinks, aiModelPreference,
            analysisModelPreference, apiEndpoint, req.userId
        ]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// Get payment history
router.get('/payments', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM payment_transactions WHERE user_id = $1 ORDER BY timestamp DESC', [req.userId]);
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=user.js.map