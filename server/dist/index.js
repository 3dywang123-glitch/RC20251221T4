import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import targetRoutes from './routes/target.js';
import aiRoutes from './routes/ai.js';
import aiRoutesV2 from './routes/aiV2.js';
import chatRoutes from './routes/chat.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/v2', aiRoutesV2);
app.use('/api/chat', chatRoutes);
// Error handling
app.use(errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
export default app;
//# sourceMappingURL=index.js.map