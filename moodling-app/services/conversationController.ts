/**
 * Conversation Controller
 *
 * The "soul" layer that sits ABOVE the LLM (Claude or local).
 * This is what makes conversation feel human, not robotic.
 *
 * Rules-based system that:
 * - Controls timing (when to pause, when to respond fast)
 * - Manages energy matching (don't be peppy when user is exhausted)
 * - Prevents AI ticks (generic empathy, over-validation)
 * - Handles memory callbacks without creepiness
 * - Maintains personality consistency
 *
 * This layer is LLM-agnostic. Works with Claude now, local LLM later.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log, info, warn, error as logError } from './loggingService';
import { getCoachAdaptations, CoachAdaptations } from './cognitiveProfileService';

// ============================================
// TYPES
// ============================================

export type UserEnergy = 'low' | 'medium' | 'high';
export type UserMood = 'distressed' | 'anxious' | 'neutral' | 'calm' | 'positive';
export type ResponseLength = 'brief' | 'moderate' | 'detailed';
export type ResponseTone = 'gentle' | 'warm' | 'energetic' | 'direct' | 'playful';

export interface ConversationContext {
  // Session state
  sessionId: string;
  messageCount: number;
  sessionStartTime: Date;

  // User state (detected from messages)
  userEnergy: UserEnergy;
  userMood: UserMood;
  lastUserMessage: string;
  recentTopics: string[];

  // Temporal
  timeSinceLastSession: number; // hours
  lastSessionMood: UserMood | null;
  dayOfWeek: number;
  hourOfDay: number;

  // Memory flags
  recentMemoryCallbacks: number; // how many times we referenced past in this session
  lastMemoryCallbackTurn: number; // which turn we last did a callback
}

export interface ResponseDirectives {
  // Timing
  artificialDelay: number; // ms to wait before showing response

  // Content shaping
  maxLength: ResponseLength;
  tone: ResponseTone;
  allowQuestions: boolean; // can we ask user questions?
  maxQuestions: number; // if allowed, how many

  // Memory
  allowMemoryCallback: boolean; // can we reference past sessions?
  memoryCallbackStyle: 'subtle' | 'explicit' | 'none';

  // Special behaviors
  insertAntiDependencyNudge: boolean;
  insertBreathingPrompt: boolean;
  suggestBreak: boolean;

  // What to avoid
  avoidPhrases: string[];

  // Opening style
  openingStyle: 'continue' | 'gentle_checkin' | 'energy_match' | 'grounding';

  // Cognitive profile adaptations (from cognitiveProfileService)
  cognitiveAdaptations: {
    useMetaphors: boolean;
    useExamples: boolean;
    useStepByStep: boolean;
    showBigPicture: boolean;
    validateFirst: boolean;
    allowWandering: boolean;
    provideStructure: boolean;
    giveTimeToThink: boolean;
    questionType: 'open' | 'specific' | 'reflective';
  };
}

export interface HeavyTopicIndicators {
  keywords: string[];
  patterns: RegExp[];
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = {
  LAST_SESSION: 'moodleaf_last_session',
  CONVERSATION_HISTORY: 'moodleaf_conversation_history',
};

// Words/phrases that indicate heavy emotional content
const HEAVY_TOPIC_INDICATORS: HeavyTopicIndicators = {
  keywords: [
    'suicide', 'kill myself', 'end it', 'don\'t want to live',
    'hopeless', 'worthless', 'nobody cares', 'better off without me',
    'panic', 'can\'t breathe', 'heart racing', 'going to die',
    'abuse', 'assault', 'trauma', 'nightmare',
    'breakup', 'divorce', 'cheated', 'left me',
    'fired', 'lost my job', 'failed', 'ruined',
    'died', 'death', 'funeral', 'cancer', 'diagnosis',
  ],
  patterns: [
    /i (want to|wanna) (die|disappear|give up)/i,
    /no (point|reason) (to|in) (living|life|anything)/i,
    /can't (take|handle|do) (it|this) anymore/i,
    /everything is (falling apart|ruined|over)/i,
  ],
};

// Phrases that make AI sound robotic - NEVER use these
const AI_TICK_PHRASES = [
  'I understand',
  'I hear you',
  'That\'s completely valid',
  'That\'s totally understandable',
  'It\'s okay to feel',
  'Thank you for sharing',
  'I appreciate you opening up',
  'That must be really hard',
  'I\'m here for you',
  'You\'re not alone',
  'Take all the time you need',
  'There\'s no right or wrong way to feel',
  'Your feelings are valid',
  'I want you to know',
  'First of all',
  'Let me just say',
];

// Low energy indicators
const LOW_ENERGY_INDICATORS = [
  'tired', 'exhausted', 'drained', 'no energy', 'can\'t think',
  'just want to sleep', 'so done', 'over it', 'whatever',
  'ugh', 'meh', 'idk', 'don\'t care', 'nothing matters',
  '...', 'nm', 'fine', 'ok', 'k',
];

// High energy indicators
const HIGH_ENERGY_INDICATORS = [
  'excited', 'amazing', 'incredible', 'can\'t wait', 'so happy',
  'finally', 'yes!', 'omg', 'awesome', 'let\'s go',
  '!', 'haha', 'lol', 'love', 'best',
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Detect if message contains heavy/sensitive topics
 */
export function detectHeavyTopic(message: string): boolean {
  const lower = message.toLowerCase();

  // Check keywords
  for (const keyword of HEAVY_TOPIC_INDICATORS.keywords) {
    if (lower.includes(keyword)) return true;
  }

  // Check patterns
  for (const pattern of HEAVY_TOPIC_INDICATORS.patterns) {
    if (pattern.test(message)) return true;
  }

  return false;
}

/**
 * Detect user's energy level from message
 */
export function detectUserEnergy(message: string): UserEnergy {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/);

  // Short messages often indicate low energy
  if (words.length <= 3 && !message.includes('!')) {
    return 'low';
  }

  // Check for low energy indicators
  let lowScore = 0;
  for (const indicator of LOW_ENERGY_INDICATORS) {
    if (lower.includes(indicator)) lowScore++;
  }

  // Check for high energy indicators
  let highScore = 0;
  for (const indicator of HIGH_ENERGY_INDICATORS) {
    if (lower.includes(indicator)) highScore++;
  }

  // Count exclamation marks
  const exclamations = (message.match(/!/g) || []).length;
  highScore += exclamations;

  // Count ellipsis (low energy)
  const ellipsis = (message.match(/\.\.\./g) || []).length;
  lowScore += ellipsis;

  if (lowScore > highScore + 1) return 'low';
  if (highScore > lowScore + 1) return 'high';
  return 'medium';
}

/**
 * Detect user's mood from message
 */
export function detectUserMood(message: string): UserMood {
  const lower = message.toLowerCase();

  // Crisis/distress
  if (detectHeavyTopic(message)) return 'distressed';

  // Anxiety indicators
  const anxietyWords = ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'panic', 'stress', 'overwhelm'];
  for (const word of anxietyWords) {
    if (lower.includes(word)) return 'anxious';
  }

  // Positive indicators
  const positiveWords = ['happy', 'excited', 'great', 'good', 'better', 'amazing', 'wonderful', 'love'];
  for (const word of positiveWords) {
    if (lower.includes(word)) return 'positive';
  }

  // Calm indicators
  const calmWords = ['peaceful', 'calm', 'relaxed', 'okay', 'fine', 'alright', 'settled'];
  for (const word of calmWords) {
    if (lower.includes(word)) return 'calm';
  }

  return 'neutral';
}

/**
 * Extract topics from message (simple keyword extraction)
 */
export function extractTopics(message: string): string[] {
  const topics: string[] = [];
  const lower = message.toLowerCase();

  const topicKeywords: Record<string, string> = {
    'work': 'work',
    'job': 'work',
    'boss': 'work',
    'coworker': 'work',
    'office': 'work',
    'relationship': 'relationships',
    'partner': 'relationships',
    'boyfriend': 'relationships',
    'girlfriend': 'relationships',
    'husband': 'relationships',
    'wife': 'relationships',
    'family': 'family',
    'mom': 'family',
    'dad': 'family',
    'parent': 'family',
    'sibling': 'family',
    'brother': 'family',
    'sister': 'family',
    'sleep': 'sleep',
    'insomnia': 'sleep',
    'tired': 'sleep',
    'nightmare': 'sleep',
    'health': 'health',
    'sick': 'health',
    'doctor': 'health',
    'therapy': 'mental_health',
    'therapist': 'mental_health',
    'medication': 'mental_health',
    'anxiety': 'anxiety',
    'depression': 'depression',
    'money': 'finances',
    'bills': 'finances',
    'debt': 'finances',
    'school': 'education',
    'college': 'education',
    'exam': 'education',
    'study': 'education',
  };

  for (const [keyword, topic] of Object.entries(topicKeywords)) {
    if (lower.includes(keyword) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics;
}

// ============================================
// MAIN CONTROLLER LOGIC
// ============================================

/**
 * Build conversation context from current state
 */
export async function buildConversationContext(
  sessionId: string,
  messages: Array<{ text: string; source: string }>,
  lastUserMessage: string
): Promise<ConversationContext> {
  const now = new Date();

  // Load last session info
  let lastSession: { endTime: string; mood: UserMood } | null = null;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION);
    if (stored) {
      lastSession = JSON.parse(stored);
    }
  } catch (e) {
    // Ignore
  }

  // Calculate time since last session
  let timeSinceLastSession = 24; // default to 24 hours if unknown
  if (lastSession?.endTime) {
    const lastEnd = new Date(lastSession.endTime);
    timeSinceLastSession = (now.getTime() - lastEnd.getTime()) / (1000 * 60 * 60);
  }

  // Extract recent topics from last few messages
  const recentUserMessages = messages
    .filter(m => m.source === 'user')
    .slice(-5)
    .map(m => m.text);

  const recentTopics: string[] = [];
  for (const msg of recentUserMessages) {
    const topics = extractTopics(msg);
    for (const topic of topics) {
      if (!recentTopics.includes(topic)) {
        recentTopics.push(topic);
      }
    }
  }

  // Count memory callbacks in this session (look for phrases like "you mentioned", "earlier you said")
  const aiMessages = messages.filter(m => m.source !== 'user').map(m => m.text.toLowerCase());
  let recentMemoryCallbacks = 0;
  let lastMemoryCallbackTurn = -1;

  const memoryPhrases = ['you mentioned', 'earlier you', 'you said', 'remember when', 'last time'];
  aiMessages.forEach((msg, i) => {
    for (const phrase of memoryPhrases) {
      if (msg.includes(phrase)) {
        recentMemoryCallbacks++;
        lastMemoryCallbackTurn = i;
        break;
      }
    }
  });

  return {
    sessionId,
    messageCount: messages.filter(m => m.source === 'user').length,
    sessionStartTime: now, // Would be tracked properly in real impl
    userEnergy: detectUserEnergy(lastUserMessage),
    userMood: detectUserMood(lastUserMessage),
    lastUserMessage,
    recentTopics,
    timeSinceLastSession,
    lastSessionMood: lastSession?.mood || null,
    dayOfWeek: now.getDay(),
    hourOfDay: now.getHours(),
    recentMemoryCallbacks,
    lastMemoryCallbackTurn,
  };
}

/**
 * Generate response directives based on context
 * This is the core "human-ness" logic
 */
export async function generateResponseDirectives(ctx: ConversationContext): Promise<ResponseDirectives> {
  // Get cognitive profile adaptations (separate service, granular control)
  let cognitiveAdaptations: CoachAdaptations | null = null;
  try {
    cognitiveAdaptations = await getCoachAdaptations();
  } catch (error) {
    console.log('[Controller] Could not load cognitive adaptations:', error);
  }

  const directives: ResponseDirectives = {
    artificialDelay: 500, // minimum delay to feel natural
    maxLength: 'moderate',
    tone: 'warm',
    allowQuestions: true,
    maxQuestions: 2,
    allowMemoryCallback: true,
    memoryCallbackStyle: 'subtle',
    insertAntiDependencyNudge: false,
    insertBreathingPrompt: false,
    suggestBreak: false,
    avoidPhrases: [...AI_TICK_PHRASES],
    openingStyle: 'continue',
    // Cognitive adaptations from profile
    cognitiveAdaptations: {
      useMetaphors: cognitiveAdaptations?.useMetaphors ?? false,
      useExamples: cognitiveAdaptations?.useExamples ?? true,
      useStepByStep: cognitiveAdaptations?.useStepByStep ?? false,
      showBigPicture: cognitiveAdaptations?.showBigPicture ?? false,
      validateFirst: cognitiveAdaptations?.validateFirst ?? true,
      allowWandering: cognitiveAdaptations?.allowWandering ?? true,
      provideStructure: cognitiveAdaptations?.provideStructure ?? false,
      giveTimeToThink: cognitiveAdaptations?.giveTimeToThink ?? false,
      questionType: cognitiveAdaptations?.questionType ?? 'open',
    },
  };

  // ========== TIMING RULES ==========

  // Heavy topics need pause before responding (feels more thoughtful)
  if (detectHeavyTopic(ctx.lastUserMessage)) {
    directives.artificialDelay = 2000;
    directives.tone = 'gentle';
    directives.maxLength = 'brief'; // Don't lecture during crisis
    directives.allowQuestions = false; // Don't interrogate
  }

  // Short user messages = quick response
  if (ctx.lastUserMessage.split(/\s+/).length <= 5) {
    directives.artificialDelay = 300;
  }

  // ========== ENERGY MATCHING ==========

  if (ctx.userEnergy === 'low') {
    directives.tone = 'gentle';
    directives.maxLength = 'brief';
    directives.allowQuestions = false; // Don't demand effort from tired user
    directives.maxQuestions = 0;
  }

  if (ctx.userEnergy === 'high') {
    directives.tone = 'energetic';
    directives.artificialDelay = 300; // Match their pace
  }

  // ========== MOOD-BASED ADJUSTMENTS ==========

  if (ctx.userMood === 'distressed') {
    directives.tone = 'gentle';
    directives.maxLength = 'brief';
    directives.insertBreathingPrompt = true;
    directives.allowMemoryCallback = false; // Focus on NOW
  }

  if (ctx.userMood === 'anxious') {
    directives.tone = 'gentle';
    directives.maxLength = 'moderate';
    // Avoid rapid-fire questions that increase anxiety
    directives.maxQuestions = 1;
  }

  if (ctx.userMood === 'positive') {
    directives.tone = 'warm';
    // Can be slightly more playful
    if (ctx.userEnergy === 'high') {
      directives.tone = 'playful';
    }
  }

  // ========== TEMPORAL AWARENESS ==========

  // Morning after distressed session = gentle check-in
  if (ctx.timeSinceLastSession > 8 && ctx.timeSinceLastSession < 24 && ctx.lastSessionMood === 'distressed') {
    directives.openingStyle = 'gentle_checkin';
  }

  // Been a while since last chat
  if (ctx.timeSinceLastSession > 48) {
    directives.openingStyle = 'gentle_checkin';
  }

  // Late night conversations (10pm - 4am)
  if (ctx.hourOfDay >= 22 || ctx.hourOfDay <= 4) {
    directives.tone = 'gentle';
    directives.maxLength = 'brief';
  }

  // ========== MEMORY CALLBACK RULES ==========

  // Don't reference memories too often (feels creepy)
  if (ctx.recentMemoryCallbacks >= 2) {
    directives.allowMemoryCallback = false;
  }

  // Don't do memory callbacks in first 3 turns (feels rushed)
  if (ctx.messageCount < 3) {
    directives.allowMemoryCallback = false;
  }

  // Don't do back-to-back memory callbacks
  if (ctx.lastMemoryCallbackTurn >= ctx.messageCount - 2) {
    directives.allowMemoryCallback = false;
  }

  // ========== ANTI-DEPENDENCY ==========

  // After 10 turns, start gentle nudges
  if (ctx.messageCount >= 10 && ctx.messageCount % 5 === 0) {
    directives.insertAntiDependencyNudge = true;
  }

  // After 20 turns, suggest break
  if (ctx.messageCount >= 20) {
    directives.suggestBreak = true;
  }

  // ========== LENGTH CONTROL ==========

  // Short user messages should get shorter responses
  if (ctx.lastUserMessage.split(/\s+/).length <= 10) {
    if (directives.maxLength === 'detailed') {
      directives.maxLength = 'moderate';
    }
  }

  return directives;
}

/**
 * Build system prompt modifications based on directives
 * This gets injected into the LLM prompt
 */
export function buildPromptModifiers(directives: ResponseDirectives): string {
  const modifiers: string[] = [];

  // Tone
  const toneInstructions: Record<ResponseTone, string> = {
    gentle: 'Respond gently and softly. Use calming language. No pressure.',
    warm: 'Be warm and supportive. Natural and conversational.',
    energetic: 'Match the user\'s energy. Be upbeat but not fake.',
    direct: 'Be clear and straightforward. No fluff.',
    playful: 'Allow some lightness and humor if appropriate.',
  };
  modifiers.push(toneInstructions[directives.tone]);

  // Length
  const lengthInstructions: Record<ResponseLength, string> = {
    brief: 'Keep your response SHORT. 1-2 sentences max. Less is more.',
    moderate: 'Keep your response concise. 2-4 sentences.',
    detailed: 'You can be more detailed if helpful, but stay focused.',
  };
  modifiers.push(lengthInstructions[directives.maxLength]);

  // Questions
  if (!directives.allowQuestions) {
    modifiers.push('Do NOT ask questions. Just be present and supportive.');
  } else if (directives.maxQuestions === 1) {
    modifiers.push('Ask at most ONE question, and make it easy to answer.');
  }

  // Memory
  if (!directives.allowMemoryCallback) {
    modifiers.push('Do NOT reference past conversations. Focus on the present moment.');
  } else if (directives.memoryCallbackStyle === 'subtle') {
    modifiers.push('If referencing past conversations, do it subtly. Don\'t quote the user directly.');
  }

  // Special behaviors
  if (directives.insertBreathingPrompt) {
    modifiers.push('Gently offer a grounding technique or breathing exercise if appropriate.');
  }

  if (directives.insertAntiDependencyNudge) {
    modifiers.push('Subtly acknowledge this has been a long conversation. Validate any progress made.');
  }

  if (directives.suggestBreak) {
    modifiers.push('Gently suggest taking a break might be helpful. No pressure.');
  }

  // Opening style
  if (directives.openingStyle === 'gentle_checkin') {
    modifiers.push('Start with a gentle check-in. Something like "How are you holding up?" or "Been thinking about you."');
  }

  // Avoid phrases
  if (directives.avoidPhrases.length > 0) {
    modifiers.push(`NEVER use these phrases: ${directives.avoidPhrases.slice(0, 5).join(', ')}, etc.`);
  }

  // Cognitive profile adaptations (how this person thinks/learns)
  const cog = directives.cognitiveAdaptations;
  if (cog) {
    modifiers.push('\nCOGNITIVE STYLE ADAPTATIONS (how this person thinks):');

    if (cog.useMetaphors) {
      modifiers.push('- Use metaphors and analogies - they help this person understand');
    }
    if (cog.useExamples) {
      modifiers.push('- Give concrete examples and stories');
    }
    if (cog.useStepByStep) {
      modifiers.push('- Be step-by-step and logical in explanations');
    }
    if (cog.showBigPicture) {
      modifiers.push('- Connect things to the bigger picture - show how it fits');
    }
    if (cog.validateFirst) {
      modifiers.push('- Always validate emotions FIRST before anything else');
    }
    if (cog.allowWandering) {
      modifiers.push('- Allow conversation to explore and wander - don\'t force structure');
    }
    if (cog.provideStructure) {
      modifiers.push('- Provide clear structure and organization');
    }
    if (cog.giveTimeToThink) {
      modifiers.push('- Don\'t ask rapid questions - give space to think');
    }

    // Question type
    if (cog.questionType === 'reflective') {
      modifiers.push('- Ask reflective questions that invite introspection');
    } else if (cog.questionType === 'specific') {
      modifiers.push('- Ask specific, concrete questions');
    } else {
      modifiers.push('- Ask open-ended questions that allow exploration');
    }
  }

  return modifiers.join('\n');
}

/**
 * Save session info for next time
 */
export async function saveSessionEnd(mood: UserMood): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify({
      endTime: new Date().toISOString(),
      mood,
    }));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

// ============================================
// POST-PROCESSING (clean up AI response)
// ============================================

/**
 * Check if response contains AI ticks that should be removed
 */
export function detectAITicks(response: string): string[] {
  const found: string[] = [];
  const lower = response.toLowerCase();

  for (const tick of AI_TICK_PHRASES) {
    if (lower.includes(tick.toLowerCase())) {
      found.push(tick);
    }
  }

  return found;
}

/**
 * Score a response for human-ness (used by test mode)
 * Returns 0-100
 */
export function quickHumannessScore(
  userMessage: string,
  aiResponse: string,
  ctx: ConversationContext
): { score: number; issues: string[] } {
  let score = 100;
  const issues: string[] = [];

  // Check for AI ticks
  const ticks = detectAITicks(aiResponse);
  if (ticks.length > 0) {
    score -= ticks.length * 10;
    issues.push(`AI tick phrases: ${ticks.join(', ')}`);
  }

  // Check if response starts with "I"
  if (aiResponse.trim().startsWith('I ')) {
    score -= 5;
    issues.push('Starts with "I"');
  }

  // Check response length vs user energy
  const responseWords = aiResponse.split(/\s+/).length;
  if (ctx.userEnergy === 'low' && responseWords > 50) {
    score -= 15;
    issues.push('Too verbose for low-energy user');
  }

  // Check if asking questions when shouldn't
  const questionCount = (aiResponse.match(/\?/g) || []).length;
  if (ctx.userEnergy === 'low' && questionCount > 0) {
    score -= 10;
    issues.push('Asked questions when user is low energy');
  }

  // Check for over-validation (multiple validating statements)
  const validationPhrases = ['valid', 'understandable', 'makes sense', 'natural to feel'];
  let validationCount = 0;
  for (const phrase of validationPhrases) {
    if (aiResponse.toLowerCase().includes(phrase)) validationCount++;
  }
  if (validationCount > 1) {
    score -= 10;
    issues.push('Over-validation');
  }

  // Check energy mismatch
  const responseEnergy = detectUserEnergy(aiResponse);
  if (ctx.userEnergy === 'low' && responseEnergy === 'high') {
    score -= 15;
    issues.push('Energy mismatch: user low, response high');
  }

  return { score: Math.max(0, score), issues };
}
