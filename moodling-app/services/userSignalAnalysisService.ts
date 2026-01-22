/**
 * User Signal Analysis Service
 *
 * Analyzes USER OUTPUT to detect emotional/cognitive states.
 * This is the INPUT side of the system - understanding what the user
 * is communicating through their behavior, not just their words.
 *
 * Signals analyzed:
 * - Text patterns (typing speed, message length, vocabulary)
 * - Speech patterns (speed, pitch, pauses - from audio input)
 * - Visual signals (facial expressions, body language - from camera)
 * - Temporal patterns (time of day, response latency)
 *
 * This complements the MoodPrint system:
 * - MoodPrint = HOW to talk TO them (output adaptation)
 * - UserSignals = WHAT they're telling us (input analysis)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Text-based signals from typed messages
 */
export interface TextSignals {
  // Message characteristics
  messageLength: number;
  wordCount: number;
  avgWordLength: number;
  sentenceCount: number;

  // Emotional indicators
  punctuationDensity: number;      // !!! or ???
  capsPercentage: number;          // SHOUTING
  ellipsisDensity: number;         // ... trailing off
  emojiCount: number;

  // Vocabulary signals
  negativeWordCount: number;
  positiveWordCount: number;
  uncertaintyWordCount: number;    // "maybe", "I don't know", "not sure"
  intensifierCount: number;        // "very", "so", "really", "extremely"

  // Structural signals
  questionCount: number;
  firstPersonCount: number;        // "I", "me", "my"
  hedgingPhrases: number;          // "I think", "I feel like", "kind of"
}

/**
 * Typing behavior signals (if we can measure them)
 */
export interface TypingSignals {
  typingSpeed: 'slow' | 'normal' | 'fast' | 'erratic';
  pauseFrequency: 'none' | 'few' | 'many';
  deletionRate: 'low' | 'normal' | 'high';  // Lots of backspacing
  messageCompletionTime: number;  // ms
}

/**
 * Speech signals (from audio input if available)
 */
export interface SpeechSignals {
  // Speed
  wordsPerMinute: number;
  speedChange: 'slowing' | 'stable' | 'speeding';  // Compared to baseline
  speedVariability: 'steady' | 'variable' | 'erratic';

  // Pauses
  pauseFrequency: 'none' | 'some' | 'many';
  avgPauseDuration: number;  // ms
  hesitationCount: number;   // "um", "uh", "like"

  // Pitch (if detectable)
  pitchTrend: 'lowering' | 'stable' | 'rising';
  pitchVariability: 'monotone' | 'normal' | 'variable';

  // Volume
  volumeTrend: 'quieting' | 'stable' | 'louder';

  // Breath
  breathingPattern: 'normal' | 'shallow' | 'sighing';
}

/**
 * Visual signals (from camera if available)
 */
export interface VisualSignals {
  // Eye contact (with camera)
  gazeDirection: 'at_camera' | 'away' | 'darting';
  blinkRate: 'normal' | 'frequent' | 'infrequent';

  // Facial expression (simplified)
  primaryExpression: 'neutral' | 'happy' | 'sad' | 'anxious' | 'angry' | 'confused';
  expressionIntensity: 'subtle' | 'moderate' | 'strong';
  expressionStability: 'stable' | 'changing';

  // Body language (if visible)
  postureOpenness: 'open' | 'neutral' | 'closed';
  movementLevel: 'still' | 'normal' | 'fidgety' | 'restless';
  selfTouchingBehavior: boolean;  // Touching face, hair, etc.
}

/**
 * Temporal/contextual signals
 */
export interface TemporalSignals {
  timeOfDay: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  dayOfWeek: string;
  responseLatency: number;  // ms since last message
  sessionDuration: number;  // minutes
  messagesSinceSessionStart: number;
}

/**
 * Combined signal analysis result
 */
export interface UserSignalAnalysis {
  timestamp: string;

  // Raw signals (what we detected)
  textSignals?: TextSignals;
  typingSignals?: TypingSignals;
  speechSignals?: SpeechSignals;
  visualSignals?: VisualSignals;
  temporalSignals?: TemporalSignals;

  // Interpreted states (what the signals mean)
  inferredState: InferredEmotionalState;

  // Confidence in our analysis
  confidence: number;  // 0-100

  // Alerts (things to pay attention to)
  alerts: SignalAlert[];

  // Comparison to baseline
  deviationFromBaseline: 'significant' | 'moderate' | 'normal';
}

/**
 * What we infer from the signals
 */
export interface InferredEmotionalState {
  // Primary detected state
  primaryState: EmotionalState;
  secondaryState?: EmotionalState;

  // Intensity
  intensity: 'low' | 'moderate' | 'high';

  // Trends
  trend: 'improving' | 'stable' | 'declining';

  // Energy level
  energy: 'depleted' | 'low' | 'moderate' | 'high' | 'agitated';

  // Cognitive load
  cognitiveLoad: 'low' | 'normal' | 'high' | 'overwhelmed';

  // Engagement
  engagement: 'disengaged' | 'passive' | 'engaged' | 'highly_engaged';
}

export type EmotionalState =
  | 'calm'
  | 'content'
  | 'anxious'
  | 'stressed'
  | 'sad'
  | 'frustrated'
  | 'angry'
  | 'confused'
  | 'overwhelmed'
  | 'hopeful'
  | 'excited'
  | 'neutral';

/**
 * Alerts that should affect how we respond
 */
export interface SignalAlert {
  type: AlertType;
  severity: 'info' | 'warning' | 'urgent';
  description: string;
  suggestedResponse: string;
}

export type AlertType =
  | 'speech_speeding_up'      // Anxiety indicator
  | 'speech_slowing_down'     // Possible depression or dissociation
  | 'long_pauses'             // Processing difficulty
  | 'erratic_typing'          // Emotional distress
  | 'negative_vocabulary_spike'
  | 'uncertainty_increase'
  | 'disengagement'
  | 'high_cognitive_load'
  | 'energy_drop'
  | 'late_night_session'      // Possible crisis time
  | 'response_latency_change';

// ============================================================================
// Baseline Storage
// ============================================================================

const STORAGE_KEYS = {
  BASELINE: '@moodleaf_signal_baseline',
  RECENT_ANALYSES: '@moodleaf_recent_signal_analyses',
};

export interface UserBaseline {
  // Text baselines
  avgMessageLength: number;
  avgWordCount: number;
  avgSentenceCount: number;
  typicalNegativeWords: number;
  typicalUncertaintyWords: number;

  // Speech baselines (if available)
  avgWordsPerMinute?: number;
  avgPauseDuration?: number;
  avgHesitationRate?: number;

  // Temporal baselines
  typicalSessionTimes: string[];
  avgResponseLatency: number;

  // Metadata
  sampleCount: number;
  lastUpdated: string;
}

const DEFAULT_BASELINE: UserBaseline = {
  avgMessageLength: 100,
  avgWordCount: 20,
  avgSentenceCount: 3,
  typicalNegativeWords: 1,
  typicalUncertaintyWords: 2,
  avgResponseLatency: 30000,
  typicalSessionTimes: [],
  sampleCount: 0,
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// Text Analysis
// ============================================================================

// Word lists for sentiment detection
const NEGATIVE_WORDS = [
  'sad', 'angry', 'upset', 'frustrated', 'anxious', 'worried', 'scared',
  'hopeless', 'worthless', 'terrible', 'awful', 'horrible', 'hate',
  'can\'t', 'won\'t', 'never', 'nobody', 'nothing', 'alone', 'empty',
  'tired', 'exhausted', 'overwhelmed', 'stressed', 'depressed'
];

const POSITIVE_WORDS = [
  'happy', 'good', 'great', 'wonderful', 'love', 'excited', 'hopeful',
  'grateful', 'thankful', 'calm', 'peaceful', 'better', 'improving',
  'proud', 'confident', 'strong', 'capable', 'okay', 'fine'
];

const UNCERTAINTY_WORDS = [
  'maybe', 'perhaps', 'not sure', 'don\'t know', 'i guess', 'i think',
  'might', 'possibly', 'probably', 'kind of', 'sort of', 'i suppose'
];

const INTENSIFIERS = [
  'very', 'really', 'so', 'extremely', 'incredibly', 'absolutely',
  'completely', 'totally', 'always', 'never'
];

const HEDGING_PHRASES = [
  'i think', 'i feel like', 'i guess', 'kind of', 'sort of',
  'i\'m not sure', 'maybe', 'it seems', 'i suppose'
];

/**
 * Analyze text signals from a message
 */
export function analyzeTextSignals(message: string): TextSignals {
  const lowercaseMessage = message.toLowerCase();
  const words = message.split(/\s+/).filter(w => w.length > 0);
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);

  return {
    messageLength: message.length,
    wordCount: words.length,
    avgWordLength: words.length > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length
      : 0,
    sentenceCount: sentences.length,

    punctuationDensity: (message.match(/[!?]{2,}/g) || []).length,
    capsPercentage: message.length > 0
      ? (message.match(/[A-Z]/g) || []).length / message.length
      : 0,
    ellipsisDensity: (message.match(/\.{3,}/g) || []).length,
    emojiCount: (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,

    negativeWordCount: NEGATIVE_WORDS.filter(w => lowercaseMessage.includes(w)).length,
    positiveWordCount: POSITIVE_WORDS.filter(w => lowercaseMessage.includes(w)).length,
    uncertaintyWordCount: UNCERTAINTY_WORDS.filter(w => lowercaseMessage.includes(w)).length,
    intensifierCount: INTENSIFIERS.filter(w => lowercaseMessage.includes(w)).length,

    questionCount: (message.match(/\?/g) || []).length,
    firstPersonCount: (lowercaseMessage.match(/\b(i|me|my|myself)\b/g) || []).length,
    hedgingPhrases: HEDGING_PHRASES.filter(p => lowercaseMessage.includes(p)).length,
  };
}

/**
 * Analyze temporal signals
 */
export function analyzeTemporalSignals(
  lastMessageTime?: Date,
  sessionStartTime?: Date
): TemporalSignals {
  const now = new Date();
  const hour = now.getHours();

  let timeOfDay: TemporalSignals['timeOfDay'];
  if (hour < 5) timeOfDay = 'late_night';
  else if (hour < 9) timeOfDay = 'early_morning';
  else if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else if (hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    timeOfDay,
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    responseLatency: lastMessageTime
      ? now.getTime() - lastMessageTime.getTime()
      : 0,
    sessionDuration: sessionStartTime
      ? (now.getTime() - sessionStartTime.getTime()) / 60000
      : 0,
    messagesSinceSessionStart: 0,  // Caller should provide this
  };
}

// ============================================================================
// Signal Interpretation
// ============================================================================

/**
 * Interpret text signals to infer emotional state
 */
function interpretTextSignals(
  signals: TextSignals,
  baseline: UserBaseline
): Partial<InferredEmotionalState> {
  const result: Partial<InferredEmotionalState> = {};

  // Determine energy from message length and vocabulary
  const lengthRatio = signals.messageLength / Math.max(baseline.avgMessageLength, 1);
  if (lengthRatio < 0.3) {
    result.energy = 'depleted';
  } else if (lengthRatio < 0.6) {
    result.energy = 'low';
  } else if (lengthRatio > 2) {
    result.energy = 'agitated';
  } else {
    result.energy = 'moderate';
  }

  // Determine primary state from vocabulary
  const negativeRatio = signals.negativeWordCount / Math.max(baseline.typicalNegativeWords, 0.5);
  const uncertaintyRatio = signals.uncertaintyWordCount / Math.max(baseline.typicalUncertaintyWords, 0.5);

  if (signals.negativeWordCount > 3 || negativeRatio > 2) {
    if (signals.intensifierCount > 2) {
      result.primaryState = 'overwhelmed';
      result.intensity = 'high';
    } else {
      result.primaryState = 'stressed';
      result.intensity = 'moderate';
    }
  } else if (signals.uncertaintyWordCount > 3 || uncertaintyRatio > 2) {
    result.primaryState = 'confused';
    result.intensity = 'moderate';
  } else if (signals.positiveWordCount > signals.negativeWordCount) {
    result.primaryState = 'content';
    result.intensity = 'moderate';
  } else {
    result.primaryState = 'neutral';
    result.intensity = 'low';
  }

  // Cognitive load from hedging and uncertainty
  if (signals.hedgingPhrases > 3 || signals.uncertaintyWordCount > 4) {
    result.cognitiveLoad = 'high';
  } else if (signals.hedgingPhrases > 1 || signals.uncertaintyWordCount > 2) {
    result.cognitiveLoad = 'normal';
  } else {
    result.cognitiveLoad = 'low';
  }

  // Engagement from message structure
  if (signals.questionCount > 0 && signals.messageLength > baseline.avgMessageLength * 0.5) {
    result.engagement = 'engaged';
  } else if (signals.messageLength < baseline.avgMessageLength * 0.3) {
    result.engagement = 'disengaged';
  } else {
    result.engagement = 'passive';
  }

  return result;
}

/**
 * Generate alerts based on signals
 */
function generateAlerts(
  signals: {
    text?: TextSignals;
    speech?: SpeechSignals;
    temporal?: TemporalSignals;
  },
  baseline: UserBaseline
): SignalAlert[] {
  const alerts: SignalAlert[] = [];

  // Text-based alerts
  if (signals.text) {
    const negativeRatio = signals.text.negativeWordCount / Math.max(baseline.typicalNegativeWords, 0.5);
    if (negativeRatio > 3) {
      alerts.push({
        type: 'negative_vocabulary_spike',
        severity: 'warning',
        description: 'Significant increase in negative language',
        suggestedResponse: 'Acknowledge their feelings, slow down, validate first'
      });
    }

    if (signals.text.uncertaintyWordCount > 5) {
      alerts.push({
        type: 'uncertainty_increase',
        severity: 'info',
        description: 'High uncertainty in language',
        suggestedResponse: 'Provide grounding, be more concrete, avoid adding complexity'
      });
    }

    if (signals.text.messageLength < baseline.avgMessageLength * 0.2 && baseline.sampleCount > 5) {
      alerts.push({
        type: 'disengagement',
        severity: 'info',
        description: 'Very short responses compared to baseline',
        suggestedResponse: 'Check in gently, don\'t push for more, give space'
      });
    }
  }

  // Speech-based alerts
  if (signals.speech) {
    if (signals.speech.speedChange === 'speeding') {
      alerts.push({
        type: 'speech_speeding_up',
        severity: 'warning',
        description: 'Speech is speeding up - possible anxiety',
        suggestedResponse: 'Slow your own pace, use grounding, avoid adding urgency'
      });
    }

    if (signals.speech.speedChange === 'slowing') {
      alerts.push({
        type: 'speech_slowing_down',
        severity: 'warning',
        description: 'Speech is slowing down - possible depression or dissociation',
        suggestedResponse: 'Be gentle, check in about how they\'re feeling, don\'t rush'
      });
    }

    if (signals.speech.pauseFrequency === 'many' && signals.speech.avgPauseDuration > 3000) {
      alerts.push({
        type: 'long_pauses',
        severity: 'info',
        description: 'Long pauses in speech',
        suggestedResponse: 'Give space, don\'t fill silence, allow processing time'
      });
    }
  }

  // Temporal alerts
  if (signals.temporal) {
    if (signals.temporal.timeOfDay === 'late_night') {
      alerts.push({
        type: 'late_night_session',
        severity: 'info',
        description: 'Session during late night hours',
        suggestedResponse: 'Check if they\'re okay, mention sleep if appropriate'
      });
    }
  }

  return alerts;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Perform complete signal analysis on a user message
 */
export async function analyzeUserSignals(
  message: string,
  options?: {
    lastMessageTime?: Date;
    sessionStartTime?: Date;
    messagesSinceStart?: number;
    speechSignals?: SpeechSignals;
    visualSignals?: VisualSignals;
  }
): Promise<UserSignalAnalysis> {
  const baseline = await getBaseline();

  // Analyze text
  const textSignals = analyzeTextSignals(message);

  // Analyze temporal
  const temporalSignals = analyzeTemporalSignals(
    options?.lastMessageTime,
    options?.sessionStartTime
  );
  temporalSignals.messagesSinceSessionStart = options?.messagesSinceStart || 0;

  // Interpret signals
  const textInterpretation = interpretTextSignals(textSignals, baseline);

  // Combine into inferred state
  const inferredState: InferredEmotionalState = {
    primaryState: textInterpretation.primaryState || 'neutral',
    secondaryState: undefined,
    intensity: textInterpretation.intensity || 'moderate',
    trend: 'stable',  // Would need history to determine
    energy: textInterpretation.energy || 'moderate',
    cognitiveLoad: textInterpretation.cognitiveLoad || 'normal',
    engagement: textInterpretation.engagement || 'passive',
  };

  // Generate alerts
  const alerts = generateAlerts(
    {
      text: textSignals,
      speech: options?.speechSignals,
      temporal: temporalSignals,
    },
    baseline
  );

  // Calculate deviation from baseline
  let deviationFromBaseline: UserSignalAnalysis['deviationFromBaseline'] = 'normal';
  if (alerts.some(a => a.severity === 'urgent')) {
    deviationFromBaseline = 'significant';
  } else if (alerts.some(a => a.severity === 'warning')) {
    deviationFromBaseline = 'moderate';
  }

  // Calculate confidence
  let confidence = 50;
  if (baseline.sampleCount > 10) confidence += 20;
  if (baseline.sampleCount > 50) confidence += 20;
  if (options?.speechSignals) confidence += 10;

  const analysis: UserSignalAnalysis = {
    timestamp: new Date().toISOString(),
    textSignals,
    temporalSignals,
    speechSignals: options?.speechSignals,
    visualSignals: options?.visualSignals,
    inferredState,
    confidence: Math.min(confidence, 100),
    alerts,
    deviationFromBaseline,
  };

  // Update baseline with this sample
  await updateBaseline(textSignals, temporalSignals);

  return analysis;
}

// ============================================================================
// Baseline Management
// ============================================================================

/**
 * Get user's signal baseline
 */
export async function getBaseline(): Promise<UserBaseline> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BASELINE);
    return stored ? { ...DEFAULT_BASELINE, ...JSON.parse(stored) } : DEFAULT_BASELINE;
  } catch (error) {
    console.error('[SignalAnalysis] Failed to get baseline:', error);
    return DEFAULT_BASELINE;
  }
}

/**
 * Update baseline with new sample
 */
async function updateBaseline(
  textSignals: TextSignals,
  temporalSignals: TemporalSignals
): Promise<void> {
  try {
    const baseline = await getBaseline();

    // Rolling average update
    const n = baseline.sampleCount + 1;
    baseline.avgMessageLength = ((baseline.avgMessageLength * baseline.sampleCount) + textSignals.messageLength) / n;
    baseline.avgWordCount = ((baseline.avgWordCount * baseline.sampleCount) + textSignals.wordCount) / n;
    baseline.avgSentenceCount = ((baseline.avgSentenceCount * baseline.sampleCount) + textSignals.sentenceCount) / n;
    baseline.typicalNegativeWords = ((baseline.typicalNegativeWords * baseline.sampleCount) + textSignals.negativeWordCount) / n;
    baseline.typicalUncertaintyWords = ((baseline.typicalUncertaintyWords * baseline.sampleCount) + textSignals.uncertaintyWordCount) / n;

    baseline.sampleCount = n;
    baseline.lastUpdated = new Date().toISOString();

    await AsyncStorage.setItem(STORAGE_KEYS.BASELINE, JSON.stringify(baseline));
  } catch (error) {
    console.error('[SignalAnalysis] Failed to update baseline:', error);
  }
}

// ============================================================================
// Context for LLM
// ============================================================================

/**
 * Get signal analysis context for LLM prompt
 */
export function getSignalAnalysisContextForLLM(analysis: UserSignalAnalysis): string {
  const parts: string[] = ['USER SIGNAL ANALYSIS (current emotional state indicators):'];

  // Inferred state
  parts.push(`- Primary state: ${analysis.inferredState.primaryState} (${analysis.inferredState.intensity} intensity)`);
  parts.push(`- Energy level: ${analysis.inferredState.energy}`);
  parts.push(`- Cognitive load: ${analysis.inferredState.cognitiveLoad}`);
  parts.push(`- Engagement: ${analysis.inferredState.engagement}`);

  // Deviation
  if (analysis.deviationFromBaseline !== 'normal') {
    parts.push(`- Deviation from baseline: ${analysis.deviationFromBaseline}`);
  }

  // Alerts
  if (analysis.alerts.length > 0) {
    parts.push('\nALERTS:');
    for (const alert of analysis.alerts) {
      parts.push(`- [${alert.severity.toUpperCase()}] ${alert.description}`);
      parts.push(`  → ${alert.suggestedResponse}`);
    }
  }

  return parts.join('\n');
}

// ============================================================================
// Export for Training
// ============================================================================

/**
 * Export signal analyses for training local models
 */
export async function exportSignalHistory(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_ANALYSES);
    return stored || '[]';
  } catch (error) {
    return '[]';
  }
}
