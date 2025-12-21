import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/connection.js';
const router = express.Router();
// Get chat messages for a target
router.get('/:targetId', authenticate, async (req, res, next) => {
    try {
        const { targetId } = req.params;
        const result = await pool.query(`SELECT * FROM chat_messages 
       WHERE user_id = $1 AND target_id = $2 
       ORDER BY timestamp ASC`, [req.userId, targetId]);
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
// Save chat message
router.post('/:targetId', authenticate, async (req, res, next) => {
    try {
        const { targetId } = req.params;
        const { sender, text, insight, timestamp } = req.body;
        const result = await pool.query(`INSERT INTO chat_messages 
       (user_id, target_id, sender, text, insight, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [req.userId, targetId, sender, text, insight || '', timestamp]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
// Clear chat history
router.delete('/:targetId', authenticate, async (req, res, next) => {
    try {
        const { targetId } = req.params;
        await pool.query('DELETE FROM chat_messages WHERE user_id = $1 AND target_id = $2', [req.userId, targetId]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=chat.js.map