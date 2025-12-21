
import { TargetProfile, UserProfile, ChatSession, SubscriptionTier, PaymentTransaction, ConsultationGoal } from "../types";
import { SAMPLE_TARGET, SAMPLE_TARGET_2 } from "../datav2/samples";

// This service now acts like a Database ORM, managing data isolation per user.
let CURRENT_USER_ID: string | null = null;

// Initialize the storage context with the current user ID
export const setContext = (userId: string) => {
  CURRENT_USER_ID = userId;
};

const getKeys = (userId: string | null) => {
  if (!userId) throw new Error("Database Error: No user context set.");
  return {
    TARGETS: `soulsync_${userId}_targets`,
    USER: `soulsync_${userId}_profile`,
    CHATS: `soulsync_${userId}_chats`,
    PAYMENTS: `soulsync_${userId}_payments`
  };
};

// --- Storage Maintenance (Auto-Pruning) ---
const pruneStorage = (userId: string) => {
  console.log("Storage Quota Exceeded. Attempting to prune old image data...");
  try {
    const keys = getKeys(userId);
    const stored = localStorage.getItem(keys.TARGETS);
    if (!stored) return false;

    let targets: TargetProfile[] = JSON.parse(stored);
    let freedSpace = false;

    targets = targets.map(t => {
      const target = { ...t }; // Shallow copy

      // 1. Prune Social Analysis History (Keep last 2, strip images from older)
      if (target.socialAnalysisHistory && target.socialAnalysisHistory.length > 2) {
        target.socialAnalysisHistory = target.socialAnalysisHistory.map((item, idx) => {
          // Determine if this item is "old" (index < length - 2)
          // Since we push new items to the end, the last ones are the newest.
          const isOld = idx < target.socialAnalysisHistory!.length - 2;
          
          if (isOld && item.inputImages && item.inputImages.length > 0) {
            freedSpace = true;
            return { ...item, inputImages: [] }; // Strip images
          }
          return item;
        });
      }

      // 2. Prune Post Analysis History (Keep last 3)
      if (target.postAnalysisHistory && target.postAnalysisHistory.length > 3) {
        target.postAnalysisHistory = target.postAnalysisHistory.map((item, idx) => {
          const isOld = idx < target.postAnalysisHistory!.length - 3;
          if (isOld) {
             let modified = false;
             const newItem = { ...item };
             if (newItem.images && newItem.images.length > 0) {
                newItem.images = [];
                modified = true;
             }
             if (newItem.imageB64) {
                newItem.imageB64 = undefined;
                modified = true;
             }
             if (modified) {
                freedSpace = true;
                return newItem;
             }
          }
          return item;
        });
      }

      // 3. Prune Consultation History (Keep last 3)
      if (target.consultationHistory && target.consultationHistory.length > 3) {
        target.consultationHistory = target.consultationHistory.map((item, idx) => {
           const isOld = idx < target.consultationHistory!.length - 3;
           if (isOld && item.archivedInput && item.archivedInput.images && item.archivedInput.images.length > 0) {
              freedSpace = true;
              return { ...item, archivedInput: { ...item.archivedInput, images: [] } };
           }
           return item;
        });
      }

      return target;
    });

    if (freedSpace) {
      localStorage.setItem(keys.TARGETS, JSON.stringify(targets));
      console.log("Storage pruned successfully.");
      return true;
    } else {
      console.warn("Storage full but no obvious images to prune.");
      return false;
    }
  } catch (e) {
    console.error("Pruning process failed", e);
    return false;
  }
};

// --- Migration Service (Guest to Registered) ---
export const migrateUserData = (oldUserId: string, newUserId: string) => {
  const oldKeys = getKeys(oldUserId);
  const newKeys = getKeys(newUserId);

  // 1. Move Targets
  const targets = localStorage.getItem(oldKeys.TARGETS);
  if (targets) {
    try {
        localStorage.setItem(newKeys.TARGETS, targets);
        localStorage.removeItem(oldKeys.TARGETS);
    } catch (e) {
        // If quota exceeded during migration, try to prune target destination first (unlikely but possible) or source
        console.error("Migration failed due to storage limits", e);
    }
  }

  // 2. Move Profile (Merge)
  const oldProfile = localStorage.getItem(oldKeys.USER);
  if (oldProfile) {
    localStorage.setItem(newKeys.USER, oldProfile);
    localStorage.removeItem(oldKeys.USER);
  }

  // 3. Move Chats
  const chats = localStorage.getItem(oldKeys.CHATS);
  if (chats) {
    localStorage.setItem(newKeys.CHATS, chats);
    localStorage.removeItem(oldKeys.CHATS);
  }

  // 4. Move Payments
  const payments = localStorage.getItem(oldKeys.PAYMENTS);
  if (payments) {
    localStorage.setItem(newKeys.PAYMENTS, payments);
    localStorage.removeItem(oldKeys.PAYMENTS);
  }
};

// --- Visitor ID Management ---

export const getVisitorId = (): string => {
  const VISITOR_ID_KEY = 'soulsync_visitor_id';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    // Generate a random 5-digit number
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    visitorId = `游客${randomNum}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

// --- CRUD Operations ---

export const getTargets = (): TargetProfile[] => {
  if (!CURRENT_USER_ID) return [];
  const keys = getKeys(CURRENT_USER_ID);
  const stored = localStorage.getItem(keys.TARGETS);

  // Inject samples if empty
  if (!stored || JSON.parse(stored).length === 0) {
     return [SAMPLE_TARGET, SAMPLE_TARGET_2];
  }

  let targets = JSON.parse(stored);
  let hasChanges = false;

  // Ensure samples are always present and up to date
  const samples = [SAMPLE_TARGET, SAMPLE_TARGET_2];
  const existingSampleIds = targets.filter((t: TargetProfile) => t.isSample).map((t: TargetProfile) => t.id);
  const missingSamples = samples.filter(sample => !existingSampleIds.includes(sample.id));

  // Add missing samples
  if (missingSamples.length > 0) {
    targets = [...targets, ...missingSamples];
    hasChanges = true;
  }

  // Auto-repair samples: Ensure avatar URLs are up to date with code constants
  // This fixes the issue where old broken avatars persist in LocalStorage
  samples.forEach(sample => {
    const index = targets.findIndex((t: TargetProfile) => t.id === sample.id);
    if (index !== -1) {
       // Check for ANY mismatch in key visual properties and force update
       if (targets[index].avatarB64 !== sample.avatarB64 ||
           targets[index].name !== sample.name ||
           targets[index].bio !== sample.bio) {

          // Merge the stored history/chats with the fresh Sample definition
          targets[index] = {
              ...targets[index], // Keep user-generated history if any
              ...sample,         // Overwrite static fields (avatar, name, bio, core reports)
              // Specific overwrites to ensure visual assets are fixed
              avatarB64: sample.avatarB64,
              personalityReport: sample.personalityReport
          };
          hasChanges = true;
       }
    }
  });

  if (hasChanges) {
     localStorage.setItem(keys.TARGETS, JSON.stringify(targets));
  }

  return targets;
};

export const saveTarget = (target: TargetProfile) => {
  if (!CURRENT_USER_ID) return;
  
  const attemptSave = () => {
    const targets = getTargets();
    const index = targets.findIndex(t => t.id === target.id);
    if (index >= 0) {
      targets[index] = target;
    } else {
      targets.push(target);
    }
    localStorage.setItem(getKeys(CURRENT_USER_ID).TARGETS, JSON.stringify(targets));
  };

  try {
    attemptSave();
  } catch (e: any) {
    // Check for QuotaExceededError (name varies by browser)
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
       const pruned = pruneStorage(CURRENT_USER_ID);
       if (pruned) {
          try {
             attemptSave(); // Retry once
          } catch (retryError) {
             throw new Error("STORAGE_FULL");
          }
       } else {
          throw new Error("STORAGE_LIMIT_REACHED");
       }
    } else {
       console.error("Storage Save Error:", e);
       throw e;
    }
  }
};

export const deleteTarget = (id: string) => {
  const targets = getTargets().filter(t => t.id !== id);
  localStorage.setItem(getKeys(CURRENT_USER_ID).TARGETS, JSON.stringify(targets));
};

export const getUserProfile = (): UserProfile => {
  if (!CURRENT_USER_ID) return { 
    name: '', 
    occupation: '', 
    hobbies: '', 
    personalityDescription: '',
    subscriptionTier: SubscriptionTier.FREE,
    isVip: false
  };

  const keys = getKeys(CURRENT_USER_ID);
  const stored = localStorage.getItem(keys.USER);
  return stored ? JSON.parse(stored) : { 
    name: '', 
    occupation: '', 
    hobbies: '', 
    personalityDescription: '',
    subscriptionTier: SubscriptionTier.FREE,
    isVip: false
  };
};

export const saveUserProfile = (profile: UserProfile) => {
  if (!CURRENT_USER_ID) return;
  localStorage.setItem(getKeys(CURRENT_USER_ID).USER, JSON.stringify(profile));
};

export const getChatSession = (targetId: string): ChatSession => {
  if (!CURRENT_USER_ID) return { targetId, messages: [] };
  const keys = getKeys(CURRENT_USER_ID);
  const allChats: Record<string, ChatSession> = JSON.parse(localStorage.getItem(keys.CHATS) || '{}');
  return allChats[targetId] || { targetId, messages: [] };
};

export const saveChatSession = (session: ChatSession) => {
  if (!CURRENT_USER_ID) return;
  try {
    const keys = getKeys(CURRENT_USER_ID);
    const allChats: Record<string, ChatSession> = JSON.parse(localStorage.getItem(keys.CHATS) || '{}');
    allChats[session.targetId] = session;
    localStorage.setItem(keys.CHATS, JSON.stringify(allChats));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
       throw new Error("CHAT_HISTORY_FULL");
    }
    throw e;
  }
};

export const getPaymentHistory = (): PaymentTransaction[] => {
  if (!CURRENT_USER_ID) return [];
  const keys = getKeys(CURRENT_USER_ID);
  const stored = localStorage.getItem(keys.PAYMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const savePaymentTransaction = (tx: PaymentTransaction) => {
  if (!CURRENT_USER_ID) return;
  const history = getPaymentHistory();
  history.unshift(tx); // Add new to top
  localStorage.setItem(getKeys(CURRENT_USER_ID).PAYMENTS, JSON.stringify(history));
};
