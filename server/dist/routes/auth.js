import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
const router = express.Router();
// Register
router.post('/register', body('username').isLength({ min: 3 }).trim(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 }), async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        const { username, email, password, guestId } = req.body;
        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            throw new AppError('User already exists', 409);
        }
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Create user
            const userResult = await client.query('INSERT INTO users (username, email, password_hash, is_guest) VALUES ($1, $2, $3, $4) RETURNING id', [username, email, passwordHash, false]);
            const userId = userResult.rows[0].id;
            // If migrating from guest, transfer data
            if (guestId) {
                await client.query('UPDATE target_profiles SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
                await client.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
                // Delete guest user
                await client.query('DELETE FROM users WHERE id = $1', [guestId]);
            }
            // Create default user profile
            await client.query('INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)', [userId, username]);
            await client.query('COMMIT');
            // Generate token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET is not set');
            }
            const token = jwt.sign({ userId }, secret, {
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            });
            res.status(201).json({
                token,
                user: {
                    id: userId,
                    username,
                    email,
                    isGuest: false
                }
            });
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post('/login', body('email').isEmail().normalizeEmail(), body('password').notEmpty(), async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        const { email, password } = req.body;
        // Find user
        const result = await pool.query('SELECT id, username, email, password_hash, is_guest FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new AppError('Invalid credentials', 401);
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }
        // Generate token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not set');
        }
        const token = jwt.sign({ userId: user.id }, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isGuest: user.is_guest
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Guest login
router.post('/guest', async (req, res, next) => {
    try {
        const guestId = `guest_${Date.now()}`;
        const guestEmail = `${guestId}@guest.local`;
        const result = await pool.query('INSERT INTO users (username, email, password_hash, is_guest) VALUES ($1, $2, $3, $4) RETURNING id', [guestId, guestEmail, '', true]);
        const userId = result.rows[0].id;
        // Create default profile
        await pool.query('INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)', [userId, 'Guest User']);
        // Generate token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not set');
        }
        const token = jwt.sign({ userId }, secret, {
            expiresIn: '24h'
        });
        res.json({
            token,
            user: {
                id: userId,
                username: guestId,
                email: guestEmail,
                isGuest: true
            }
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=auth.js.map