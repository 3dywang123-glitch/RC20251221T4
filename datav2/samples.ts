
import { TargetProfile, ConsultationGoal } from "../types";

export const SAMPLE_TARGET: TargetProfile = {
  id: 'sample_mary',
  isSample: true,
  name: 'Mary',
  age: '26',
  occupation: 'AI Engineer',
  bio: 'INTJ. Coding neural networks by day, reading sci-fi by night.',
  socialMediaData: [],
  // Using DiceBear for frontend-only avatar generation
  avatarB64: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mary&top=bob&accessories=round&hairColor=4a312c&clothing=blazerAndShirt&clothingColor=262e33&skinColor=f5d0b0&eyes=default&eyebrows=default&mouth=smile', 
  personalityReport: {
    bigFive: { openness: 92, conscientiousness: 88, extraversion: 35, agreeableness: 45, neuroticism: 60 },
    mbti: "INTJ",
    emotionalStability: 60,
    coreInterests: ["Artificial Intelligence", "Hard Sci-Fi", "Coffee", "Minimalism"],
    communicationStyle: "Direct, logical, and highly efficient. She dislikes small talk and prefers deep, theoretical discussions.",
    summary: `### 1. The Archetype
**The Rational Romantic (INTJ - The Architect)**
She compiles emotions like code: searching for the optimal solution, but fearing the runtime errors of vulnerability.

### 2. The Big Five Dimensions
**🧠 Openness: 92% [Very High]**
Analysis: High cognitive flexibility. Obsessed with new concepts (AGI, Metaverse). Values "Intellectual Intimacy" over traditional romance.

**📋 Conscientiousness: 88% [High]**
Analysis: Goal-oriented. Treats life like a project. Silence isn't disinterest; it's "Deep Work" flow state.

**🔋 Extraversion: 35% [Low]**
Analysis: Introverted recharger. Socializing is high latency. Needs high-quality "low-noise company".

**🤝 Agreeableness: 45% [Moderate]**
Analysis: Logic first. Won't sacrifice truth for "vibes". Debugging you is her way of caring.

**🌊 Neuroticism: 60% [Mid-High]**
Analysis: Hidden anxiety under pressure. Low tolerance for ambiguity in relationships.

### 3. Deep Psychological Decoding
**A. Cognitive Style: The "Debugging" Mindset**
She treats conflict like troubleshooting. Reaction to fights: Analyze Root Cause, not feel emotions.
*   **Risk:** Ignores emotional value; treats comfort-seeking as a technical issue.
*   **Subtext:** Asking "Why" isn't arguing; it's closing the logical loop.

**B. Attachment Style: Dismissive-Avoidant under Stress**
Secure normally, but triggers a "Firewall" under stress—becoming cold and logical.
*   **Trigger:** Excessive drama overloads her CPU, causing a crash (silence).

**C. Love Language: Acts of Service & Efficiency**
Believes in code reusability, not vague promises.
*   **Expression:** Optimizing your life/tech.
*   **Desire:** Undisturbed presence, silent support (coffee).`,
    datingAdvice: `✅ **How to Connect**
*   **Talk Data, Not Drama:** "I feel ignored because interaction dropped 50%" vs "You don't love me."
*   **Respect Compilation Time:** Allow processing time for silence. Don't interrupt background tasks.
*   **Intellectual Stimulation:** Sci-fi, ethics, tech. Brain resonance is the key.

❌ **Red Flags to Avoid**
*   **Vague Passive-Aggressiveness:** "Whatever" or undefined variables drive her crazy.
*   **Invading Personal Space:** Her desk is her server room. Do not unplug physical access.

💡 **AI Consultant Summary**
Mary is a high-value, high-maintenance system. She doesn't need a savior; she needs a Co-pilot to fly in the intellectual stratosphere.`,
    avatarAnalysis: "The avatar suggests a focus on professional clarity with a touch of approachability, reflecting her organized yet human mind.",
    dataSufficiency: 95,
    generatedAt: Date.now(),
    tags: ["#INTJ", "#Rational", "#Sapiosexual"]
  },
  socialAnalysisHistory: [
    {
      id: 'sample_social_1',
      timestamp: Date.now(),
      platform: 'Twitter/X',
      handle: '@mary_codes',
      url: 'https://x.com/mary_codes',
      reportTags: ["Intellectual Snobbery", "Zero-Drama Zone", "Meme Connoisseur"],
      surfaceSubtext: "**Surface:** Cyberpunk minimalist aesthetic. Code snippets, dark mode screenshots, and obscure sci-fi references. No selfies, no food pics.\n\n**Subtext:** This is a curated exhibition of intellect. By filtering out \"mundane\" life (food, travel), she signals that she lives in the realm of ideas. The lack of selfies isn't low confidence; it's high arrogance—she wants you to admire her brain, not her face. It's a filter to repel \"shallow\" suitors.",
      targetAudience: "The \"Target Audience\" is extremely narrow: Fellow intellectuals, potential co-founders, or someone who can actually understand the physics joke she just retweeted. She is signaling availability ONLY to those who can pass her IQ test.",
      personaImpression: "The 'Intellectual Architect'. She plays the role of the detached observer. The cool, rational entity who finds human drama amusing but inefficient. She likely drafts 5 tweets and deletes 4 because they felt 'too emotional'.",
      performancePurpose: "The core drive is **Competence Signaling**. In a chaotic world, she performs 'Control'. Her feed says 'I have figured it out'. It masks a likely fear of emotional chaos or vulnerability.",
      suggestedReplies: [
        "Your point on AGI alignment is solid, but have you considered the orthogonality thesis? Would love to hear your take.",
        "That sci-fi book on your desk... is that the first edition? Elite taste.",
        "You treat Twitter like a GitHub repo for your thoughts. It's refreshing."
      ],
      report: "{}" 
    }
  ],
  postAnalysisHistory: [
    {
      id: 'sample_post_1',
      timestamp: Date.now(),
      content: "Debugging code at 3AM. The silence is loud. 🌙",
      analysis: `### 1. Basic Content Analysis
**Visual Decoding**: The user mentions "3AM" and "silence," setting a scene of isolation and late-night focus. The crescent moon emoji adds a touch of melancholy or romanticism to the solitude.
**Textual Subtext**: "The silence is loud" is a classic oxymoron indicating internal noise or loneliness. It contrasts the logical task (debugging) with an emotional state (loud silence).

### 2. Target Audience
This post is likely a **Narrowcast** to a specific person or a small group who knows her habits. It's a "Bat Signal" for someone to keep her company or acknowledge her dedication. It filters out casual followers who are asleep.

### 3. Persona & Impression
**Character**: The "Tortured Genius" or "Dedicated Professional."
**Gap**: She presents as a machine (debugging code), but the caption reveals the human need for connection. It's a crack in the armor.

### 4. Performance & Purpose
**Core Drive**: **Emotional Regulation** (Seeking Comfort/Validation). She is tired and wants someone to witness her effort.
**Verdict**: High Value vulnerability. It shows dedication but admits to human limits.`,
      suggestedReplies: [
        "The bug isn't in the code; it's in the empty chair next to you. Close the laptop, Engineer. The world can wait until sunrise.",
        "Send me the error log. I'll stay up and be your rubber duck for 10 minutes while you finish that coffee. You shouldn't debug alone.",
        "Maybe the silence isn't empty; maybe it's just the only time the world stops compiling and finally runs. Breathe it in."
      ],
      tags: ["Midnight Vulnerability", "Burnout Signal", "Passive Call-for-Help"],
      status: 'completed'
    }
  ],
  consultationHistory: [
    {
      id: 'sample_consult_1',
      generatedAt: Date.now(),
      compatibilityScore: 72,
      statusAssessment: `**Verdict:** The "Intellectual Buddy" Trap\n\n**Status Definition:** Current dynamic is High Utility / Low Intimacy. You are her "Wikipedia," not her "Mystery Novel."`,
      partnerPersonalityAnalysis: "INTJ-leaning 'Cerebral Gatekeeper'. Values competence and autonomy. Likely equates vulnerability with weakness. Currently views you as a 'Safe Resource'.",
      greenFlags: [],
      redFlags: [],
      communicationDos: [],
      communicationDonts: [],
      magicTopics: ["The Singularity", "Dystopian Sci-Fi", "Coffee Brewing Science", "System Architecture"],
      strategy: `### 1. Executive Diagnosis
*   **Situation Overview:** The relationship is suffering from "Classic Asymmetry". You are providing 80% of the emotional investment and initiating 90% of the topics. She is comfortable but complacent.
*   **The "Friendzone" Mechanism:** She isn't rejecting you; she has categorized you as a "Safe Resource." She values your intellect but feels zero biological urgency to chase you because you are always available.
*   **The Bottom Line:** You are currently auditioning for the role of "Boyfriend" using the script of a "Consultant." Stop trying to impress her brain and start intriguing her dopamine receptors.

### 2. Deep Behavioral Decoding
**📡 Intent Signals (Signal Intelligence)**
*   **The "Latency Pattern" (Micro-Rejection):**
    *   *Observation:* She replies instantly to tech/logic queries but takes 6+ hours to respond to "How was your day?".
    *   *Decoding:* This is a **Prioritization Filter**. She treats emotional bonding as "low-priority tasks" and information exchange as "high-value work."
*   **Syntax Decoding (The "Period" Girl):**
    *   *Observation:* Total absence of follow-up questions (e.g., "And you?").
    *   *Decoding:* This isn't just efficiency; it's **Narcissistic Supply**. She enjoys your attention but feels no obligation to reciprocate curiosity. You are feeding her ego, not building a bridge.

**🎭 Persona & Vibe Analysis**
*   **Archetype:** The Cerebral Gatekeeper (INTJ-leaning).
*   **Psychological Profile:** She likely equates "Vulnerability" with "Weakness." Her coolness is a defense mechanism. She respects Competence and Autonomy above all else.
*   **Your Current Performance:** You are playing "The Nice Guy Retriever" — eager, responsive, and validating. This kills attraction for her specific personality type, as she craves a challenge.

### 3. Key Dynamics
*   **Turning Point (The Energy Shift):** The Incident last Tuesday, when you apologized for replying late ("Sorry I was busy"). **Fatal Error.** You signaled submission. For a high-status female archetype, an unnecessary apology is a "Beta Signal." Her respect for you dropped visibly after that text.
*   **Energy Flow:** Static & Linear. The conversation is too logical. There is no "Push-Pull," no teasing, no sexual tension. It feels like a corporate Slack thread.

### 4. Strategic Calibration
*   **Risk Assessment:** If you continue this "Safe & Smart" approach, you will be permanently cemented as the "Orbiter" — the guy she texts when she's bored or needs tech support.
*   **Course Correction (The "Friction" Strategy):** Stop agreeing with her. **Friction creates heat.** Start challenging her theories. Goal: Move from "Validation" to "Intellectual Combat."

### 5. Tactical Playbook
*   **Step 1: The "Pattern Break" (Freeze):** Do not reply to her last "Ok" text. Let the silence hang for 24 hours. Reset the rhythm.
*   **Step 2: The Re-Entry (Zero Context):** Send a photo of something intriguing (e.g., a complex cocktail or weird art) with ZERO caption. Force her to initiate the query ("Where is this?").
*   **Step 3: The Date Strategy (The "Nerd Sniper"):** Do not do "Coffee" or "Dinner". Proposal: *"I'm going to that Immersive Sci-Fi Exhibition this Saturday. The reviews say the logic puzzles are hard. Bet you can't solve them faster than me. Come lose?"*`,
      dateIdeas: [
        { title: "The 'Nerd Sniper' Challenge", description: "Immersive Sci-Fi Exhibition. Frame it as a competitive logic puzzle, appealing to her ego." },
        { title: "The Quiet Bar", description: "A speakeasy with no music, allowing for deep conversation." }
      ],
      iceBreakers: [],
      goalContext: ConsultationGoal.HEAT_UP,
      tags: ["#Sapiosexual", "#FriendzoneDanger", "#LogicOverEmotion"],
      status: 'completed',
      archivedInput: {
        chatLogs: "User: Hey, how are you?\nMary: Fine. Working on the neural net.\nUser: That sounds hard! You're so smart.\nMary: It's just math.\nUser: Sorry I replied late, I was busy.\nMary: Ok.\nUser: ... (No reply for 6 hours)",
        images: []
      }
    }
  ]
};

export const SAMPLE_TARGET_2: TargetProfile = {
  id: 'sample_vivi',
  isSample: true,
  name: '林晚晚 (Vivi)',
  age: '21',
  occupation: '古典舞专业 / 兼职模特',
  bio: 'INFP. 舞台上是主角，台下是透明人。日常社恐，内心弹幕刷屏。喜欢雨天和古诗词。',
  socialMediaData: [],
  // Using DiceBear for frontend-only avatar generation
  avatarB64: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Vivi&top=longHairStraight&hairColor=2c1b18&clothing=collarAndSweater&clothingColor=ffdfbf&skinColor=f5d0b0&accessories=none',
  personalityReport: {
    bigFive: { openness: 88, conscientiousness: 60, extraversion: 10, agreeableness: 90, neuroticism: 95 },
    mbti: "INFP",
    emotionalStability: 5,
    coreInterests: ["古典舞", "汉服", "古诗词", "猫"],
    communicationStyle: "温婉、被动、像受惊的小鹿。回复慢是因为在纠结措辞。习惯用表情包掩饰尴尬。",
    summary: `### 1. 核心原型
**易碎的完美主义者**
"她就像一个玻璃做的洋娃娃，外表精致无暇，内里却充满了细小的裂纹。她高冷，是因为她怕一开口就打破了那个完美的幻象。"

她给人的第一印象是**“距离感”。在学校里，她是那个走路带风、独来独往的女神；在社交软件上，她是那个只发艺术展和高深电影截图的文艺女青年。
但 AI 大数据告诉我们一个截然相反的真相：她不是不想理人，她是不敢理人**。她活在别人的期待里太久了，以至于她忘了怎么做真实的自己。

### 2. 五维雷达图
*   **🎨 开放性: 88%**
    AI 解读: 她的灵魂极其有趣。她能盯着一片落叶看 10 分钟，也能因为一句歌词哭红眼。如果你能接住她那些天马行空的梗，你在她心里的地位会瞬间超越 99% 的有钱人。
*   **🛡️ 敏感度: 95% [极高]**
    AI 解读: 这就是她“难搞”的根源。你随口一句“你今天化妆好像有点浓”，她可能会记一个星期，并且下次见你时刻意素颜。和她相处，像是在捧着一颗心，轻拿轻放是最高原则。
*   **🔋 社交电量: 10% [极低]**
    AI 解读: 别约她去蹦迪，别约她去多人剧本杀。对她来说，那不是娱乐，是加班。约她去人少的江边散步，或者安静的书店，你会发现她话突然变多了。
*   **🤝 顺从度: 表面 90% / 实际 20%**
    AI 解读: 她表面上会对每个人的请求说“好的”，因为她怕得罪人。但其实她内心极其有主见（甚至有点倔）。不要逼她做决定，但要尊重她的拒绝。

### 3. 深度心理侧写
**A. 为什么她回消息总是那么慢？**
(真相：决策困难症 + 完美主义包袱)
你以为她在跟别的男生聊骚？或者在故意吊你胃口？
错！大错特错！
真相是：看到你的消息时，她第一反应是“哎呀，该回什么才显得我不无聊/不蠢/不掉价？”
她删删改改打了五行字，觉得不完美全删了，最后发了个表情包，或者干脆把手机扔一边逃避问题。
*机会点：这时候如果你发一句：“不着急回，先忙你的，我也刚好在开会。” —— 这一句话，能让她感动到想哭。*

**B. 为什么她总是忽冷忽热？**
(真相：安全感测试机制)
她像一只在洞口探头探脑的小兔子。
如果你冲过来，她马上缩回去（冷）；如果你站在原地不动，拿出一根胡萝卜，她又会好奇地凑过来（热）。
这种拉扯不是她的手段，是她的本能。她在测试：“这个男人是不是只有三分钟热度？他能忍受我的冷漠吗？”
*机会点：在她“冷”的时候，保持稳定的输出（比如每天分享一首好歌，不求回复）。当你通过了这个“耐性测试”，她会对你死心塌地。*

**C. 她到底喜欢什么样的男生？**
(真相：温和的引导者)
她这辈子最缺两样东西：被坚定的选择 和 被温柔的带领。
她不需要一个问她“想吃什么”的绅士（这会增加她的焦虑），她需要一个说“走，带你去吃那家新开的日料，我都安排好了”的霸总（温和版）。
她有选择恐惧症，而你就是她的答案。`,
    datingAdvice: `### 4. 保姆级攻略
✅ **阶段一: 建立“无害感” (安全区建立)**
不要查户口：别问“多大了？”“住哪？”“谈过几个？”。

分享式聊天：“刚路过花店看到这束花，感觉颜色很像你今天的裙子。” —— 只分享，不提问。 给她回复的自由，她反而会忍不住回复你。

✅ **阶段二: 制造“共谋感” (秘密同盟)**
吐槽是捷径：如果她发了一条抱怨天气的动态，不要讲大道理。跟她一起吐槽：“这鬼天气确实适合在被窝里躺平，谁出门谁是勇士。”

建立只属于你们的梗：一旦你们有了共同的秘密或者笑点，你就从“追求者”变成了“自己人”。

❌ **红色警报 (千万别做的事)**
不要表白！不要表白！不要表白！
对于 Vivi 这种女生，表白就是吹响冲锋号，会逼她立刻做决定。而在压力下，她唯一的决定就是：拒绝你，然后逃跑。
要像温水煮青蛙一样，让她在不知不觉中离不开你。

💡 **顾问结语**
"She is waiting to be found."
兄弟，别被她的高冷吓退了。那层冰冷的外壳下，藏着一颗可能是全校最柔软、最渴望爱的心。

那些只会送包、开跑车的富二代追不到她，因为他们给的是“价格”，而她要的是“价值”——情绪价值。

你现在手里拿的这份报告，就是通往她内心的地图。 只要你忍住不犯错，保持耐心，按照 AI 的指引一步步走，你会发现，那个高不可攀的女神，其实早在等你牵她的手了。`,
    avatarAnalysis: "柔和的五官，避免直视镜头的眼神，暗示着她希望被视为温柔、平易近人，但又不想展现出攻击性或过强的存在感。",
    dataSufficiency: 90,
    generatedAt: Date.now(),
    tags: ["#清冷白月光", "#恐男社恐", "#内心戏丰富"]
  },
  socialAnalysisHistory: [
    {
      id: 'sample_social_vivi',
      timestamp: Date.now(),
      platform: '小红书',
      handle: '林晚晚 (Vivi)',
      url: 'https://xhs.com/vivi',
      reportTags: ["#清冷破碎感", "#防御性展示", "#高阶筛选"],
      surfaceSubtext: "**基调:** 全屏的冷色调（蓝/灰/黑）是一种防御机制，用视觉语言设置“准入门槛”，过滤低能量追求者。信号是：“我很贵，且很难搞”，但潜台词是渴望一个能打破这层冰的高能量男性。\n\n**留白策略:** 从不展示具体社交圈（无朋友合照、无饭局），维持“白月光”的稀缺性与神秘感。",
      targetAudience: "高能量、能读懂她内心并能打破她防御机制的男性。她通过清冷的画风筛选掉只想找乐子的低能量人群。",
      personaImpression: "**“午夜发帖”模式:** 82% 的动态集中在深夜，暴露了她“白天极其紧绷，深夜缺爱”的心理代偿机制。深夜是她防御力归零的脆弱时刻。\n\n**“谜语人”文案模式:** 极简文案+晦涩 Emoji 是一种“服从性测试”，筛选谁会为她不明确的表达投入情绪价值。",
      performancePurpose: "**核心动机: 对苦难的确认**\n\n她频繁展示伤痕、汗水，核心诉求只有一个：寻求“心疼”，但拒绝“同情”。她需要的是有人能肯定她的付出，赋予她苦难的意义。\n\n**💡 AI 破局切入点**\n**策略一: 建立“能量高差”**\n她现在的状态是“耗能”（练舞、情绪内耗）。你要做那个**“供能者”，但必须是定点投喂**。不要每天早安晚安（那是舔狗），要在她最累的周五晚上，直接发：“这周练得够狠的，明晚带你去个安静的地方放松下，什么都不用想，跟我就行。” —— 剥夺她的决策权，直接给结果。她这种选择困难症患者，最吃这一套。\n\n**策略二: 戳破“仙女泡沫”**\n所有人都把她捧在神坛上，不敢碰她。你要做那个敢把她拉下神坛的人。在评论区偶尔调侃她一下：“这张照片构图满分，就是黑眼圈出卖了你。” —— 这种适度的“打压”和真实感，反而会让她觉得你是唯一一个把她当普通人看的男人，从而对你卸下心防。",
      suggestedReplies: [
        "对于深夜emo动态: 第二天早上回：“昨晚又失眠？看来是练得太狠了。” (展示关注，但不被情绪同步)",
        "对于谜语人文案: 忽略文案，只评论图片细节。例如：“图3那个光影抓得不错。” (跳过测试，展示高框架)",
        "对于展示努力/伤痕: “这双脚受的罪，配得上你在台上的光。值得。” (肯定价值，而非给予同情)"
      ],
      report: "{}" 
    }
  ],
  postAnalysisHistory: [
    {
      id: 'sample_post_vivi',
      timestamp: Date.now(),
      content: "凌晨一点的排练室，只有影子陪我。累到不想说话，但还是想跳完这最后一支曲。🌙💃",
      analysis: `### 1. 基础内容分析 (她想表达什么？)
**表象层面**:
乍一看，这是一条很正能量的动态。她在展示自己的敬业和执着，似乎在说：“看我多努力，我是个追求完美的舞者。”

**深层心理层面**:
这其实是一种**“防御性勤奋”。当一个人在深夜本该休息的时候，强迫自己继续高强度工作，通常是因为一旦停下来，就会被某种巨大的空虚感吞噬**。
那个“累到不想说话”，是她身体发出的真实信号；而“想跳完”，是她大脑发出的强制指令。她在用身体的透支，来逃避内心的孤独。

### 2. 目标受众 (她在给谁看？)
这条动态不是发给普通朋友看的，也不是发给那些只会点赞的泛泛之交看的。
**她在筛选一个“懂她痛苦”的人。**
她在潜意识里期待有个人能看穿她的逞强，不仅仅是夸她“你好棒”，而是能看懂她文字背后的那声叹息。她在等一个能穿过屏幕给她心理支撑的人。

### 3. 人设与印象 (人设解析)
**“悲剧女主角”叙事**
她正在构建一个**“孤独又坚韧”**的形象。这种人设对男性有着致命的吸引力，因为它同时激发了两种本能：
1. **欣赏**：对她专业和坚持的认可。
2. **怜惜**：对她独自承担重压的不忍。

**反差感**：她在白天是光芒万丈的女神，在深夜是独自舔舐伤口的小女孩。这种反差感，是拉近关系的绝佳催化剂。

### 4. 表演与动机
**核心驱动力：寻求“对苦难的确认”**
她不需要你确认她的“美貌”（这太肤浅了），她需要你确认她的**“不易”**。
她是一个习惯了独自扛事的人（回避型特质），无法直接开口说“我需要陪伴”。所以她把这种需求包装成了“工作打卡”。

**结论: 这是一个黄金窗口期**。此时她的心理防线最薄弱，如果你能在这个时候提供高质量的情绪价值，你在她心里的地位会直线上升。`,
      suggestedReplies: [
        "比起这支舞跳得完不完美，我更在意那个在影子里咬牙坚持的女孩累不累。有时候，允许自己停下来，也是一种勇敢。",
        "影子虽然不会说话，但它证明了光一直都在。这么晚还在和自己较劲，辛苦了。愿这最后一支曲子，能带走你一天的疲惫。",
        "不管是凌晨一点还是正午十二点，你的努力都会被看见。但别忘了，身体是舞蹈的容器，好好爱护它，它才能陪你跳更久。早点睡，晚安。"
      ],
      tags: ["#情绪代偿性努力", "#隐性依恋需求", "#深夜防御机制失效"],
      status: 'completed'
    }
  ],
  consultationHistory: [
    {
      id: 'sample_consult_vivi',
      generatedAt: Date.now(),
      compatibilityScore: 65,
      statusAssessment: `**诊断结论:** 好人陷阱\n\n**状态定义:** 你们的关系卡在了最尴尬的**“友达以上，恋人未满”区间。虽然 65% 看起来及格，但在亲密关系动力学中，这是一个危险信号**。如果不改变策略，随着时间推移，你的性吸引力会迅速衰减，最终沦为彻底的“情绪垃圾桶”或“朋友圈点赞之交”。`,
      partnerPersonalityAnalysis: "对于 Vivi 这种 INFP / 焦虑-回避型依恋人格，她的沉默不是拒绝，而是社交瘫痪。她内心其实在等你打破僵局，但因为你表现得过于谨慎、甚至有些唯唯诺诺，反而让她感到压力——她害怕辜负你的小心翼翼，又不知道如何回应你的期待，所以干脆选择“逃避式不回复”。",
      greenFlags: ["回复虽然慢，但会解释原因", "会发表情包（这是她示好的最高级别）", "没有直接拒绝你的模糊邀约"],
      redFlags: ["从不主动开启话题", "回复字数很少", "回避任何关于感情的直接提问"],
      communicationDos: ["多分享生活趣事（提供话题）", "用陈述句代替疑问句", "赞美要具体且真诚"],
      communicationDonts: ["连续追问“在吗”", "强行升温（叫宝贝/亲爱的）", "发长篇大论的小作文"],
      magicTopics: ["猫咪的迷惑行为", "最近看的展/电影", "某家好吃的甜品店（由于她想去但不敢一个人去）"],
      strategy: `### 1. 核心诊断
*   **你的误区:** 你严重误判了她的“冷淡”。你以为她回消息慢、字数少是因为对你不感兴趣，或者觉得你烦。因此，你采取了**“防御性撤退”（不敢找她）或者“卑微式讨好”**（小心翼翼地说话）。
*   **AI 看到的真相:** 大错特错！对于 Vivi 这种 INFP / 焦虑-回避型依恋人格，她的沉默不是拒绝，而是社交瘫痪。她内心其实在等你打破僵局。但因为你表现得过于谨慎、甚至有些唯唯诺诺，反而让她感到压力——她害怕辜负你的小心翼翼，又不知道如何回应你的期待，所以干脆选择**“逃避式不回复”**。
*   **结论:** 她需要的不是一个等着被她选择的追求者，而是一个能温和掌控局面、带领她走出社恐的引导者。

### 2. 行为深度解码
**🎬 场景复盘**
*   **事件:** 上次你说“今天天气不错”，她回了一个“小猫点头”的表情包，然后对话戛然而止。
*   **心理分析:** 很多男生会觉得这是敷衍。但 AI 分析显示，表情包是社恐患者的救命稻草。她当时想理你，但“天气不错”这个话题太泛、接话成本太高（认知负荷高）。她在屏幕前纠结了 2 分钟，删了三版回复，最后无奈选了表情包来维持礼貌。
*   **结论:** 不是她不想聊，是你没给她“递梯子”。 你让她不知所措了。

**🎭 人设洞察**
把她想象成一只受惊的小鹿。
*   你追太紧（动作大、频率高）-> 她感到危险 -> 逃跑（不回消息）。
*   你站在原地不动（冷战、比谁更酷）-> 她感到被遗弃 -> 躲得更远。
*   **正确姿势:** 站在安全距离，手里拿着食物（有趣的话题/美图），安静地展示，等她因为好奇而自己凑过来。

### 3. 关键动力学
*   **能量失衡:** 目前互动比例：你 80% 主动 vs 她 20% 被动。
*   **AI 警告:** 别焦虑！这对她来说是常态。她是低能量人格（易耗竭），你是高能量供给者。在关系初期，不要试图要求她“公平回报”，这会逼疯她。你要习惯**“我在闹，她在笑”**的模式。只要她不反感、不拉黑，你的主动就是有效的。

### 4. 战略纠偏
*   **即刻风险:** 你现在的挫败感正在累积。如果你没忍住，发了一句“你是不是很忙？”或者“为什么不理我？”，这段关系就彻底结束了。这在心理学上叫**“情绪勒索”**。一旦她感觉到你在索取情绪价值，她的防御机制会瞬间启动，把你从“潜在对象”划入“麻烦制造者”。
*   **心态重构:** 把她当成一只猫来养。你见过谁追着猫跑能追到的？你要做的是：投喂（发一条高质量消息），然后转身去做自己的事（展示高价值生活）。当她发现你不再围着她转，而是过得很精彩、很有趣时，她饿了（好奇了/想你了），自然会过来蹭你。

### 5. 绝地反击战术
*   **招式一: 无压投喂法**
    *   **行动:** 停止一切疑问句（“在干嘛？”“吃了吗？”）。这些问题需要她思考答案，是负担。
    *   **模板:** 发一张你正在做的事情的照片（比如你在看书/撸猫/喝咖啡），配文：“刚才看到这个，觉得你可能会喜欢。” 或者 “这家店的背景音乐竟然是你要的那首。”
    *   **关键:** 发完就放下手机，不要等回复！这种“我只是分享，不需要你回应”的态度，会让她感到前所未有的轻松。轻松，是她爱上你的第一步。
*   **招式二: 模糊邀约法**
    *   **行动:** 既然她社恐且有选择困难症，就不要给她具体的压力。
    *   **错误示范:** “周六晚上7点吃饭好吗？”（压力极大）。
    *   **正确示范:** “最近发现一家很安静的茶室，光影特别美，很适合发呆。下次带你去。”（低压、描绘场景、不定时间）。
    *   **结果:** 这不是一个需要立马执行的“任务”，而是一个美好的“愿景”。她会把这当作一个期待，等她哪天心情好，她甚至会主动提起这个茶室。`,
      dateIdeas: [
        { title: "静谧茶室/书店", description: "环境安静，不用必须一直说话，适合社恐。" },
        { title: "艺术展", description: "有视觉焦点，避免眼神对视的尴尬，且符合她的兴趣。" }
      ],
      iceBreakers: [],
      goalContext: ConsultationGoal.GET_DATE,
      tags: ["#破冰", "#社恐攻略", "#温柔的力量"],
      status: 'completed',
      archivedInput: {
        chatLogs: "User: 周末有空吗？\nVivi: (4小时后) 这周可能要去排练...\nUser: 啊，那好吧。注意休息。\nVivi: 嗯嗯 [猫咪表情]",
        images: []
      }
    }
  ]
};
