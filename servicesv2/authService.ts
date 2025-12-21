
import { User, SubscriptionTier } from '../types';
import { wait } from './ai/core';
import * as Storage from './storageService';
import { authAPI, setAuthToken, clearAuthToken } from './apiClient';

const KEYS = {
  USERS: 'soulsync_users_db',
  SESSION: 'soulsync_session'
};

// --- Mock Database (LocalStorage) ---

interface DBUser extends User {
  passwordHash?: string; // Guest users might not have a password
}

const getDB = (): DBUser[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  return stored ? JSON.parse(stored) : [];
};

const saveDB = (users: DBUser[]) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

// --- Service Methods ---

export const loginAsGuest = async (): Promise<User> => {
  try {
    // Call server API
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
  } catch (error: any) {
    // Fallback to local mock if server fails
    console.warn('Server guest login failed, falling back to local mock:', error.message);

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const guestUser: User = {
      id: guestId,
      name: 'Visitor',
      email: 'guest@soulsync.app',
      subscriptionTier: SubscriptionTier.FREE,
      isVip: false,
      isGuest: true,
      joinedAt: Date.now(),
      avatarB64: undefined
    };

    localStorage.setItem(KEYS.SESSION, JSON.stringify(guestUser));
    return guestUser;
  }
};

export const register = async (username: string, email: string, password: string, migrateFromGuestId?: string): Promise<User> => {
  try {
    // Call server API
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
  } catch (error: any) {
    // Fallback to local mock if server fails
    console.warn('Server register failed, falling back to local mock:', error.message);

    const db = getDB();

    if (db.find(u => u.email === email)) {
      throw new Error("Email already registered");
    }

    if (db.find(u => u.name === username)) {
      throw new Error("Username already taken");
    }

    const newId = `user_${Date.now()}`;
    const newUser: DBUser = {
      id: newId,
      name: username,
      email,
      passwordHash: password,
      subscriptionTier: SubscriptionTier.FREE,
      isVip: false,
      isGuest: false,
      joinedAt: Date.now(),
      avatarB64: undefined
    };

    db.push(newUser);
    saveDB(db);

    // If registering from a guest session, migrate data
    if (migrateFromGuestId) {
      Storage.migrateUserData(migrateFromGuestId, newId);
    }

    // Auto-login after register
    const { passwordHash, ...safeUser } = newUser;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(safeUser));

    return safeUser;
  }
};

export const login = async (identifier: string, password: string): Promise<User> => {
  // --- ROOT ADMIN BACKDOOR ---
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
    // For admin, we don't have a real token, but we'll set a dummy one to avoid 401
    setAuthToken('admin-token-' + Date.now());
    return adminUser;
  }
  // ---------------------------

  try {
    // Call server API
    const result = await authAPI.login(identifier, password);

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
  } catch (error: any) {
    // Fallback to local mock if server fails
    console.warn('Server login failed, falling back to local mock:', error.message);

    const db = getDB();
    const user = db.find(u => (u.email === identifier || u.name === identifier) && u.passwordHash === password);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const { passwordHash, ...safeUser } = user;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(safeUser));

    return safeUser;
  }
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

  // If Guest or Admin, just update session locally
  if (session.isGuest || session.id === 'root-admin') {
     const updatedSession = { ...session, ...updates };
     localStorage.setItem(KEYS.SESSION, JSON.stringify(updatedSession));
     return updatedSession;
  }

  const db = getDB();
  const index = db.findIndex(u => u.id === session.id);
  
  if (index === -1) throw new Error("User record not found");

  const updatedUserDB = { ...db[index], ...updates };
  db[index] = updatedUserDB;
  saveDB(db);

  const { passwordHash, ...safeUser } = updatedUserDB;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(safeUser));

  return safeUser;
};
