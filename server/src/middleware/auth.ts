import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
  body: any;
  params: any;
  query: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 检查 Token 格式
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 这里对应您看到的 "No token provided"
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // ⚠️⚠️ 关键修复：使用和生成 Token 时完全一致的备用密钥！
    const secret = process.env.JWT_SECRET || 'my_fallback_secret_key_123456';

    // 验证 Token
    const decoded = jwt.verify(token, secret) as { userId: string };
    
    // 验证成功，提取 userId
    req.userId = decoded.userId;
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // 这里的错误信息可能会更详细一点，方便调试
      console.error('JWT Verification Error:', error.message);
      return next(new AppError('Invalid token', 401));
    }
    // 处理 Token 过期等其他情况
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};
