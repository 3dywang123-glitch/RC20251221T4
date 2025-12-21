interface AICallOptions {
    model: string;
    prompt: string;
    images?: string[];
    responseFormat?: 'json' | 'text';
    thinkingBudget?: number;
}
interface AIResponse {
    text: string;
}
export declare const callAI: (options: AICallOptions) => Promise<AIResponse>;
export declare const parseJSON: (text: string) => Record<string, any>;
export declare const classifyAndExtract: (images: string[], model?: string) => Promise<{
    type: any;
    confidence: number;
    extractedProfile: {
        name: any;
        gender: any;
        age: any;
        occupation: any;
        bio: any;
    };
    avatarBox: any;
    avatarSourceIndex: number;
    analysisSummary: string;
}>;
export declare const analyzeProfileOverview: (url: string, screenshots: string[], language?: string, model?: string) => Promise<{
    id: string;
    url: string;
    platform: any;
    handle: any;
    timeframe: any;
    reportTags: any;
    surfaceSubtext: any;
    targetAudience: any;
    personaImpression: any;
    performancePurpose: any;
    suggestedReplies: any;
    report: string;
    timestamp: number;
}>;
export declare const analyzePost: (content: string, images: string[], language?: string, model?: string) => Promise<{
    analysis: any;
    suggestedReplies: any;
    tags: any;
}>;
export declare const analyzeChatLog: (target: {
    name?: string;
    age?: string;
    gender?: string;
    occupation?: string;
}, user: {
    name?: string;
    occupation?: string;
}, context: {
    stage?: string;
    goal?: string;
    duration?: string;
    chatLogs: string;
    chatImages: string[];
}, language?: string, model?: string) => Promise<{
    compatibilityScore: any;
    statusAssessment: any;
    partnerPersonalityAnalysis: any;
    greenFlags: any;
    redFlags: any;
    communicationDos: any;
    communicationDonts: any;
    magicTopics: any;
    strategy: any;
    dateIdeas: any;
    iceBreakers: never[];
    tags: any;
    generatedAt: number;
    goalContext: string | undefined;
}>;
export declare const analyzePersonalityV2: (profile: {
    name: string;
    occupation: string;
    bio: string;
    age: string;
    socialLinks?: string;
}, avatarB64: string | undefined, additionalImages: string[], socialAnalysisHistory: any[], postAnalysisHistory: any[], consultationHistory: any[], avatarAnalysis?: string, supplementaryInfo?: string, language?: string, model?: string) => Promise<{
    bigFive: any;
    mbti: any;
    emotionalStability: any;
    coreInterests: any;
    communicationStyle: any;
    summary: any;
    datingAdvice: any;
    avatarAnalysis: any;
    dataSufficiency: any;
    generatedAt: number;
    tags: any;
}>;
export declare const analyzeAvatar: (name: string, imageB64: string, model?: string) => Promise<{
    analysis: string;
}>;
export declare const compressImage: (base64Str: string, maxWidth?: number, quality?: number) => Promise<string>;
export declare const generatePersonaReply: (target: any, messages: any[], model?: string) => Promise<Record<string, any>>;
export {};
//# sourceMappingURL=aiServiceV2.d.ts.map