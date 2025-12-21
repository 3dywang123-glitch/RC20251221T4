
import { User, SubscriptionTier } from '../types';
import { wait } from './ai/core';
import * as Storage from './storageService';

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
  await wait(800);
  
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

  // We don't necessarily need to add guests to the main "Users DB" unless we want to track them.
  // But for session management, we treat them as logged in.
  localStorage.setItem(KEYS.SESSION, JSON.stringify(guestUser));
  return guestUser;
};

export const register = async (username: string, email: string, password: string, migrateFromGuestId?: string): Promise<User> => {
  await wait(1500); // Simulate API network latency
  
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
};

export const login = async (identifier: string, password: string): Promise<User> => {
  await wait(1500); // Simulate API network latency

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
    return adminUser;
  }
  // ---------------------------

  const db = getDB();
  const user = db.find(u => (u.email === identifier || u.name === identifier) && u.passwordHash === password);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const { passwordHash, ...safeUser } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(safeUser));
  
  return safeUser;
};

export const logout = async (): Promise<void> => {
  await wait(500);
  localStorage.removeItem(KEYS.SESSION);
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