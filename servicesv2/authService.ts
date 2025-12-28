import { User, SubscriptionTier } from '../types';
import { wait } from './ai/core';
import * as Storage from './storageService';
import { authAPI, setAuthToken, clearAuthToken } from './apiClient';

const KEYS = {
  SESSION: 'soulsync_session'
};

// --- Service Methods ---

export const loginAsGuest = async (): Promise<User> => {
  // 直接调用 API，如果失败直接抛出错误，交给 UI 处理（显示网络错误），
  // 绝不生成本地的“假游客”，防止功能瘫痪。
  const result = await authAPI.guestLogin();
  
  // Store token
  setAuthToken(result.token);

  // Store user session
  const user: User = {
    id: result.user.id,
    name: 'Visitor',
    email: result.user.email,
    subscriptionTier: SubscriptionTier.FREE,
    isVip: false,
    isGuest: result.user.isGuest,
    joinedAt: Date.now(),
    avatarB64: undefined
  };

  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};

export const register = async (username: string, email: string, password: string, migrateFromGuestId?: string): Promise<User> => {
  // 移除本地 Mock 注册逻辑，确保数据一定写入数据库
  const result = await authAPI.register(username, email, password, migrateFromGuestId);
  
  // Store token
  setAuthToken(result.token);

  // Store user session
  const user: User = {
    id: result.user.id,
    name: result.user.username,
    email: result.user.email,
    subscriptionTier: SubscriptionTier.FREE,
    isVip: false,
    isGuest: result.user.isGuest,
    joinedAt: Date.now(),
    avatarB64: undefined
  };

  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};

export const login = async (identifier: string, password: string): Promise<User> => {
  // --- ROOT ADMIN BACKDOOR (保留用于本地调试，生产环境建议移除) ---
  if (identifier === '1234' && password === '1234') {
    const adminUser: User = {
      id: 'root-admin',
      name: 'Administrator',
      email: 'admin@soulsync.internal',
      subscriptionTier: SubscriptionTier.LIFETIME,
      isVip: true,
      joinedAt: Date.now(),
      avatarB64: undefined
    };
    
    localStorage.setItem(KEYS.SESSION, JSON.stringify(adminUser));
    
    const adminToken = 'admin-token-' + Date.now();
    setAuthToken(adminToken);

    return adminUser;
  }
  // ---------------------------

  // 移除本地 Mock 登录逻辑
  const result = await authAPI.login(identifier, password);
  
  setAuthToken(result.token);

  const user: User = {
    id: result.user.id,
    name: result.user.username,
    email: result.user.email,
    subscriptionTier: SubscriptionTier.FREE,
    isVip: false,
    isGuest: result.user.isGuest,
    joinedAt: Date.now(),
    avatarB64: undefined
  };

  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};

export const logout = async (): Promise<void> => {
  await wait(500);
  localStorage.removeItem(KEYS.SESSION);
  clearAuthToken();
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const updateUser = async (updates: Partial<User>): Promise<User> => {
  await wait(800);
  
  const session = getSession();
  if (!session) throw new Error("No active session");

  // 更新本地会话显示
  const updatedSession = { ...session, ...updates };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(updatedSession));
  
  // 注意：此处未来应该添加 await userAPI.updateProfile(updates) 来同步到服务器
  
  return updatedSession;
};