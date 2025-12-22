// API Configuration for V2

// 注意：这里指的是后端的地址。即使您的前端是 lianaiguwen.top，后端依然是 bbv2.zeabur.app
// 除非您把后端也绑定到了新域名（比如 api.lianaiguwen.top），否则保持这个不变。
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bbv2.zeabur.app/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  // ✅ 关键修复：优先读取 'token' (这是之前 storageService 保存的 Key)，
  // 如果没有，再尝试读取 'soulsync_auth_token' (旧 Key)
  return localStorage.getItem('token') || localStorage.getItem('soulsync_auth_token');
};

// Set auth token
export const setAuthToken = (token: string) => {
  // ✅ 双重保存，确保兼容性
  localStorage.setItem('token', token);
  localStorage.setItem('soulsync_auth_token', token);
};

// Clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('soulsync_auth_token');
  localStorage.removeItem('soulsync_session');
};

// API request helper with timeout and retry
const apiRequest = async (endpoint: string, options: RequestInit = {}, retries = 2) => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI calls

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      
      // Retry on 5xx errors
      if (response.status >= 500 && retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return apiRequest(endpoint, options, retries - 1);
      }
      
      // Handle 401 Unauthorized (Auto-logout logic could go here)
      if (response.status === 401) {
          console.warn('Unauthorized access. Token may be invalid.');
      }

      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - AI analysis may take too long');
    }
    
    throw error;
  }
};

// ==================== Auth API ====================
export const authAPI = {
  register: async (username: string, email: string, password: string, guestId?: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, guestId }),
    });
  },
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  guestLogin: async () => {
    return apiRequest('/auth/guest', {
      method: 'POST',
    });
  },
};

// ==================== User API ====================
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/user/profile');
  },
  updateProfile: async (profile: any) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
  getPayments: async () => {
    return apiRequest('/user/payments');
  },
};

// ==================== Target API ====================
export const targetAPI = {
  list: async () => {
    return apiRequest('/targets');
  },
  get: async (id: string) => {
    return apiRequest(`/targets/${id}`);
  },
  create: async (target: any) => {
    return apiRequest('/targets', {
      method: 'POST',
      body: JSON.stringify(target),
    });
  },
  update: async (id: string, target: any) => {
    return apiRequest(`/targets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(target),
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/targets/${id}`, {
      method: 'DELETE',
    });
  },
  savePersonalityReport: async (id: string, report: any) => {
    return apiRequest(`/targets/${id}/personality`, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },
  saveSocialAnalysis: async (id: string, analysis: any) => {
    return apiRequest(`/targets/${id}/social-analysis`, {
      method: 'POST',
      body: JSON.stringify(analysis),
    });
  },
  savePostAnalysis: async (id: string, analysis: any) => {
    return apiRequest(`/targets/${id}/post-analysis`, {
      method: 'POST',
      body: JSON.stringify(analysis),
    });
  },
  saveRelationshipReport: async (id: string, report: any) => {
    return apiRequest(`/targets/${id}/relationship-report`, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },
};

// ==================== Chat API ====================
export const chatAPI = {
  getMessages: async (targetId: string) => {
    return apiRequest(`/chat/${targetId}`);
  },
  saveMessage: async (targetId: string, message: any) => {
    return apiRequest(`/chat/${targetId}`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },
  clearHistory: async (targetId: string) => {
    return apiRequest(`/chat/${targetId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== AI API V2 ====================
export const aiAPI = {
  // Smart Classification & Extraction
  smartClassify: async (images: string[], model?: string) => {
    return apiRequest('/ai/v2/smart-classify', {
      method: 'POST',
      body: JSON.stringify({ images, model }),
    });
  },

  // Profile Overview Analysis (Social Media Profile)
  analyzeOverview: async (url: string, screenshots: string[], language: string = 'en', model?: string) => {
    return apiRequest('/ai/v2/analyze-overview', {
      method: 'POST',
      body: JSON.stringify({ url, screenshots, language, model }),
    });
  },

  // Post Analysis
  analyzePost: async (content: string, images: string[], language: string = 'en', model?: string) => {
    return apiRequest('/ai/v2/analyze-post', {
      method: 'POST',
      body: JSON.stringify({ content, images, language, model }),
    });
  },

  // Chat Log Analysis
  analyzeChatLog: async (
    target: any, 
    user: any, 
    context: { stage?: string; goal?: string; duration?: string; chatLogs: string; chatImages: string[] },
    language: string = 'en',
    model?: string
  ) => {
    return apiRequest('/ai/v2/analyze-chat-log', {
      method: 'POST',
      body: JSON.stringify({ target, user, context, language, model }),
    });
  },

  // Personality Analysis V2
  analyzePersonality: async (
    profile: { name: string; occupation: string; bio: string; age: string; socialLinks?: string },
    avatarB64: string | undefined,
    additionalImages: string[],
    socialAnalysisHistory: any[],
    postAnalysisHistory: any[],
    consultationHistory: any[],
    avatarAnalysis?: string,
    supplementaryInfo?: string,
    language: string = 'en',
    model?: string
  ) => {
    return apiRequest('/ai/v2/analyze-personality-v2', {
      method: 'POST',
      body: JSON.stringify({ 
        profile, 
        avatarB64, 
        additionalImages, 
        socialAnalysisHistory,
        postAnalysisHistory,
        consultationHistory,
        avatarAnalysis,
        supplementaryInfo,
        language, 
        model 
      }),
    });
  },

  // Avatar Analysis
  analyzeAvatar: async (name: string, imageB64: string, model?: string) => {
    return apiRequest('/ai/v2/analyze-avatar', {
      method: 'POST',
      body: JSON.stringify({ name, imageB64, model }),
    });
  },

  // Persona Reply for Chat Simulation
  // ✅ 关键修改：添加了 language 参数，确保能传递 'cn' 给后端
  generatePersonaReply: async (target: any, messages: any[], language: string = 'en', model?: string) => {
    return apiRequest('/ai/v2/persona-reply', {
      method: 'POST',
      body: JSON.stringify({ target, messages, language, model }),
    });
  },
};

// ==================== Helper: Get Preferred Model ====================
export const getPreferredModel = (): string => {
  return localStorage.getItem('soulsync_model_preference') || 'gemini-3-flash-preview';
};

export const getAnalysisModel = (): string => {
  return localStorage.getItem('soulsync_analysis_model_preference') || 'gemini-3-flash-preview';
};
