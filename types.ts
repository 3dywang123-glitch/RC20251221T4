
export enum RelationshipStage {
  CRUSH = 'Crush / Secret Admirer',
  TALKING = 'Talking / Getting to know',
  DATING = 'Dating Casually',
  EXCLUSIVE = 'Exclusive Relationship',
  COHABITATION = 'Living Together',
  ENGAGED = 'Engaged',
  MARRIED = 'Married',
  COMPLICATED = 'It\'s Complicated',
  BREAKUP = 'Trying to Recover'
}

export enum ConsultationGoal {
  GET_DATE = 'Get a Date',
  HEAT_UP = 'Heat Up / Intimacy',
  MAINTAIN = 'Long-term Maintenance',
  RECOVERY = 'Recovery / Get Back'
}

export enum SubscriptionTier {
  FREE = 'Free',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  LIFETIME = 'Lifetime'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarB64?: string;
  subscriptionTier: SubscriptionTier;
  isVip: boolean;
  isGuest?: boolean; // New flag for guest mode
  joinedAt: number;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface PersonalityReport {
  bigFive: BigFive;
  mbti: string;
  emotionalStability: number;
  coreInterests: string[];
  communicationStyle: string;
  summary: string;
  datingAdvice?: string;
  avatarAnalysis?: string;
  dataSufficiency?: number;
  generatedAt: number;
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RelationshipReport {
  id?: string;
  status?: AnalysisStatus; // New status field
  compatibilityScore: number;
  statusAssessment: string; // Executive Summary of relationship status
  partnerPersonalityAnalysis?: string; // Personality traits shown in this specific consult
  greenFlags: string[];
  redFlags: string[];
  communicationDos: string[];
  communicationDonts: string[];
  magicTopics?: string[]; // Good topics to discuss
  strategy: string; // Markdown detailed analysis
  dateIdeas: { title: string, description: string }[];
  iceBreakers: string[]; // Deprecated
  tags?: string[]; // Key descriptors of the situation
  generatedAt: number;
  goalContext?: string;
  archivedInput?: { // Record of what the user sent
    chatLogs: string;
    images: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'persona' | 'system';
  text: string;
  timestamp: number;
  coachInsight?: string; // The "Subtext" analysis from AI
}

export interface ChatSession {
  targetId: string;
  messages: ChatMessage[];
}

export interface SocialMediaData {
  platform: string;
  texts: string[];
  imageB64s: string[];
}

export interface SocialHandles {
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  other?: string;
}

export interface SocialAnalysisResult {
  id: string;
  status?: AnalysisStatus; // New status field
  url: string;
  platform: string;
  handle: string;
  timeframe?: string;
  executiveSummary?: string; // New 200-word summary
  reportTags?: string[]; // New: 3 distinct tags for the report header
  
  // V2 Analysis Fields
  surfaceSubtext?: string; // Surface vs Subtext analysis
  targetAudience?: string; // Target audience analysis
  personaImpression?: string; // Persona & Impression analysis
  performancePurpose?: string; // Performance & Purpose analysis
  suggestedReplies?: string[]; // Suggested DM opening lines
  
  // Mining (Part 1) - Legacy fields
  basicProfile?: string;
  workLifestyle?: string;
  keyFocusElements?: string;
  loveIntentions?: string;
  personalityAnalysis?: string;
  personalityKeywords?: string[];

  // Deep Analysis (Part 2) - Legacy fields
  personaAnalysis?: string;
  performanceAnalysis?: string;
  psychologicalProfile?: string; // Summary of deep profile
  approachStrategy?: string;
  
  metrics?: {
    followers: string;
    frequency: string;
    engagement: string;
  };
  report: string; // JSON String backup
  timestamp: number;
  inputImages?: string[]; // Archive screenshots used
  inputNote?: string; // 用户补充说明（可选）
}

export interface SocialPostAnalysis {
  id: string;
  status?: AnalysisStatus; // New status field
  content: string;
  imageB64?: string; // Deprecated, use images array
  images?: string[]; // Support multiple images
  analysis: string;
  suggestedReplies?: string[];
  tags?: string[];
  timestamp: number;
  inputNote?: string; // 用户补充说明（可选）
}

export interface TargetProfile {
  id: string;
  name: string;
  gender?: string;
  age: string;
  occupation: string;
  bio: string;
  socialLinks?: string; // Raw text of links
  avatarB64?: string;
  additionalImages?: string[]; // Array of reference photos
  avatarAnalysis?: string; // The "Vibe Check" result
  
  personalityReport?: PersonalityReport;
  generalSummary?: string; // Derived from personality report
  
  socialMediaData: SocialMediaData[];
  socialAnalysisHistory?: SocialAnalysisResult[];
  postAnalysisHistory?: SocialPostAnalysis[];
  
  consultationHistory: RelationshipReport[];
}

export interface UserProfile {
  name: string;
  age?: string;
  occupation: string;
  hobbies: string;
  personalityDescription: string;
  avatarB64?: string;
  subscriptionTier: SubscriptionTier;
  isVip: boolean;
}

export interface PaymentTransaction {
  id: string;
  amount: string;
  currency: string;
  planName: string;
  method: 'WeChat' | 'Alipay' | 'Apple' | 'Card';
  status: 'success' | 'pending' | 'failed';
  timestamp: number;
}
