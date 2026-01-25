/**
 * Emotion Detection Service
 *
 * Uses the front-facing camera to detect emotional cues during chat.
 * Provides real-time feedback to the coach about the user's emotional state.
 *
 * Platform Support:
 * - iOS: Uses Vision framework via expo-camera
 * - Android: Uses ML Kit via expo-camera
 * - Web: Uses face-api.js (browser-based)
 *
 * Privacy First (Mood Leaf Ethics):
 * - All processing is local, on-device
 * - No images or emotion data leave the device
 * - User must explicitly enable this feature
 * - Can be turned off at any time
 *
 * Unit: Emotion Detection System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { log, info, warn, error as logError, startTimer, endTimer, logFacialAnalysis } from './loggingService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  EMOTION_SETTINGS: 'moodleaf_emotion_settings',
  EMOTION_HISTORY: 'moodleaf_emotion_history',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised'
  | 'neutral'
  | 'anxious'
  | 'stressed';

export interface EmotionReading {
  timestamp: string;
  primaryEmotion: EmotionType;
  confidence: number; // 0-1
  allEmotions: Record<EmotionType, number>; // Probability for each
  facialCues: FacialCues;
}

export interface FacialCues {
  browFurrow: number; // 0-1, higher = more furrowed (stress)
  eyeOpenness: number; // 0-1, higher = more open (surprise, alertness)
  mouthTension: number; // 0-1, higher = more tense (stress, anger)
  smileIntensity: number; // 0-1, higher = bigger smile
  jawClench: number; // 0-1, higher = more clenched (anxiety, stress)
}

export interface EmotionSettings {
  enabled: boolean;
  showFeedback: boolean; // Show emoji indicator
  notifyOnStress: boolean; // Alert coach when stress detected
  sensitivityLevel: 'low' | 'medium' | 'high';
  privacyMode: boolean; // Extra privacy (shorter history, no visuals)
}

export interface EmotionSummary {
  averageEmotion: EmotionType;
  emotionShifts: number; // How many times emotion changed
  stressIndicators: number; // Count of stress-related detections
  positiveRatio: number; // 0-1, ratio of positive emotions
  duration: number; // Analysis duration in seconds
}

export interface EmotionAnalysisResult {
  currentEmotion: EmotionReading | null;
  summary: EmotionSummary | null;
  coachHints: string[]; // Suggestions for the coach
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: EmotionSettings = {
  enabled: false, // Off by default - user must opt in
  showFeedback: true,
  notifyOnStress: true,
  sensitivityLevel: 'medium',
  privacyMode: false,
};

// Emotion to emoji mapping
export const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '😣',
  surprised: '😲',
  neutral: '😐',
  anxious: '😰',
  stressed: '😓',
};

// Emotions considered positive
const POSITIVE_EMOTIONS: EmotionType[] = ['happy', 'surprised'];

// Emotions indicating stress
const STRESS_EMOTIONS: EmotionType[] = ['anxious', 'stressed', 'fearful', 'angry'];

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get emotion detection settings
 */
export async function getEmotionSettings(): Promise<EmotionSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get emotion settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save emotion detection settings
 */
export async function saveEmotionSettings(
  settings: Partial<EmotionSettings>
): Promise<EmotionSettings> {
  try {
    const current = await getEmotionSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save emotion settings:', error);
    throw error;
  }
}

/**
 * Check if emotion detection is available on this platform
 */
export function isEmotionDetectionAvailable(): boolean {
  // Available on all platforms, but camera-based features work better on mobile
  return true;
}

/**
 * Check if emotion detection is enabled
 */
export async function isEmotionDetectionEnabled(): Promise<boolean> {
  const settings = await getEmotionSettings();
  return settings.enabled;
}

// ============================================
// EMOTION ANALYSIS (MOCK FOR NOW)
// ============================================

// In-memory session readings
let sessionReadings: EmotionReading[] = [];
let isAnalyzing = false;

/**
 * Start emotion detection session
 */
export async function startEmotionDetection(): Promise<boolean> {
  const settings = await getEmotionSettings();
  if (!settings.enabled) {
    console.log('Emotion detection is disabled');
    return false;
  }

  sessionReadings = [];
  isAnalyzing = true;

  console.log('Emotion detection started');
  return true;
}

/**
 * Stop emotion detection session
 */
export async function stopEmotionDetection(): Promise<EmotionSummary | null> {
  if (!isAnalyzing) return null;

  isAnalyzing = false;
  const summary = calculateSessionSummary(sessionReadings);

  // Save to history if not in privacy mode
  const settings = await getEmotionSettings();
  if (!settings.privacyMode && summary) {
    await saveSessionToHistory(summary);
  }

  // Clear session data
  sessionReadings = [];

  return summary;
}

/**
 * Process a camera frame and detect emotions
 * In production, this would use ML models
 */
export async function analyzeFrame(frameData: string): Promise<EmotionReading | null> {
  if (!isAnalyzing) return null;

  // This is a MOCK implementation
  // In production, integrate with:
  // - iOS: Vision framework face landmarks
  // - Android: ML Kit face detection
  // - Web: face-api.js or TensorFlow.js

  const reading = generateMockReading();
  sessionReadings.push(reading);

  return reading;
}

/**
 * Get current emotion analysis (for real-time display)
 */
export function getCurrentEmotion(): EmotionReading | null {
  if (!isAnalyzing || sessionReadings.length === 0) return null;
  return sessionReadings[sessionReadings.length - 1];
}

/**
 * Get analysis result for the coach
 */
export async function getEmotionAnalysis(): Promise<EmotionAnalysisResult> {
  const currentEmotion = getCurrentEmotion();
  const summary = calculateSessionSummary(sessionReadings);
  const coachHints = generateCoachHints(sessionReadings);

  return {
    currentEmotion,
    summary,
    coachHints,
  };
}

// ============================================
// MOCK DATA GENERATION (Replace with real ML)
// ============================================

/**
 * Generate a mock emotion reading
 * In production, this would come from ML model inference
 */
function generateMockReading(): EmotionReading {
  // Simulate somewhat realistic emotion detection
  // with bias toward neutral and some variation

  const emotions: EmotionType[] = [
    'happy', 'sad', 'angry', 'fearful',
    'disgusted', 'surprised', 'neutral', 'anxious', 'stressed',
  ];

  // Weight toward neutral, with some variation
  const weights = [0.15, 0.08, 0.05, 0.05, 0.03, 0.07, 0.35, 0.12, 0.10];

  // Generate probabilities
  const allEmotions: Record<EmotionType, number> = {} as any;
  let total = 0;

  emotions.forEach((emotion, i) => {
    const noise = Math.random() * 0.2 - 0.1; // ±10% noise
    const prob = Math.max(0, Math.min(1, weights[i] + noise));
    allEmotions[emotion] = prob;
    total += prob;
  });

  // Normalize
  emotions.forEach((emotion) => {
    allEmotions[emotion] /= total;
  });

  // Find primary emotion
  let primaryEmotion: EmotionType = 'neutral';
  let maxProb = 0;
  emotions.forEach((emotion) => {
    if (allEmotions[emotion] > maxProb) {
      maxProb = allEmotions[emotion];
      primaryEmotion = emotion;
    }
  });

  // Generate facial cues based on emotion
  const facialCues = generateFacialCues(primaryEmotion);

  return {
    timestamp: new Date().toISOString(),
    primaryEmotion,
    confidence: maxProb,
    allEmotions,
    facialCues,
  };
}

/**
 * Generate facial cues based on detected emotion
 */
function generateFacialCues(emotion: EmotionType): FacialCues {
  // Base cues for each emotion
  const cuesByEmotion: Record<EmotionType, FacialCues> = {
    happy: {
      browFurrow: 0.1,
      eyeOpenness: 0.6,
      mouthTension: 0.1,
      smileIntensity: 0.8,
      jawClench: 0.1,
    },
    sad: {
      browFurrow: 0.5,
      eyeOpenness: 0.4,
      mouthTension: 0.3,
      smileIntensity: 0.0,
      jawClench: 0.2,
    },
    angry: {
      browFurrow: 0.9,
      eyeOpenness: 0.7,
      mouthTension: 0.8,
      smileIntensity: 0.0,
      jawClench: 0.8,
    },
    fearful: {
      browFurrow: 0.7,
      eyeOpenness: 0.9,
      mouthTension: 0.6,
      smileIntensity: 0.0,
      jawClench: 0.5,
    },
    disgusted: {
      browFurrow: 0.6,
      eyeOpenness: 0.4,
      mouthTension: 0.7,
      smileIntensity: 0.0,
      jawClench: 0.4,
    },
    surprised: {
      browFurrow: 0.2,
      eyeOpenness: 0.95,
      mouthTension: 0.2,
      smileIntensity: 0.3,
      jawClench: 0.1,
    },
    neutral: {
      browFurrow: 0.2,
      eyeOpenness: 0.5,
      mouthTension: 0.2,
      smileIntensity: 0.1,
      jawClench: 0.2,
    },
    anxious: {
      browFurrow: 0.6,
      eyeOpenness: 0.7,
      mouthTension: 0.5,
      smileIntensity: 0.05,
      jawClench: 0.6,
    },
    stressed: {
      browFurrow: 0.7,
      eyeOpenness: 0.5,
      mouthTension: 0.6,
      smileIntensity: 0.0,
      jawClench: 0.7,
    },
  };

  const baseCues = cuesByEmotion[emotion];

  // Add some noise
  return {
    browFurrow: clamp(baseCues.browFurrow + noise(), 0, 1),
    eyeOpenness: clamp(baseCues.eyeOpenness + noise(), 0, 1),
    mouthTension: clamp(baseCues.mouthTension + noise(), 0, 1),
    smileIntensity: clamp(baseCues.smileIntensity + noise(), 0, 1),
    jawClench: clamp(baseCues.jawClench + noise(), 0, 1),
  };
}

function noise(): number {
  return Math.random() * 0.15 - 0.075;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// SESSION ANALYSIS
// ============================================

/**
 * Calculate summary of the session readings
 */
function calculateSessionSummary(readings: EmotionReading[]): EmotionSummary | null {
  if (readings.length === 0) return null;

  // Count emotions
  const emotionCounts: Record<EmotionType, number> = {} as any;
  let positiveCount = 0;
  let stressCount = 0;
  let shifts = 0;
  let lastEmotion: EmotionType | null = null;

  readings.forEach((reading) => {
    const emotion = reading.primaryEmotion;

    // Count
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

    // Positive check
    if (POSITIVE_EMOTIONS.includes(emotion)) {
      positiveCount++;
    }

    // Stress check
    if (STRESS_EMOTIONS.includes(emotion)) {
      stressCount++;
    }

    // Shift check
    if (lastEmotion && lastEmotion !== emotion) {
      shifts++;
    }
    lastEmotion = emotion;
  });

  // Find most common emotion
  let averageEmotion: EmotionType = 'neutral';
  let maxCount = 0;
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > maxCount) {
      maxCount = count;
      averageEmotion = emotion as EmotionType;
    }
  });

  // Calculate duration (first to last reading)
  let duration = 0;
  if (readings.length >= 2) {
    const first = new Date(readings[0].timestamp).getTime();
    const last = new Date(readings[readings.length - 1].timestamp).getTime();
    duration = (last - first) / 1000; // in seconds
  }

  return {
    averageEmotion,
    emotionShifts: shifts,
    stressIndicators: stressCount,
    positiveRatio: positiveCount / readings.length,
    duration,
  };
}

/**
 * Generate hints for the coach based on emotion readings
 */
function generateCoachHints(readings: EmotionReading[]): string[] {
  if (readings.length < 3) return [];

  const hints: string[] = [];
  const recentReadings = readings.slice(-10); // Last 10 readings

  // Check for sustained stress
  const recentStress = recentReadings.filter((r) =>
    STRESS_EMOTIONS.includes(r.primaryEmotion)
  ).length;

  if (recentStress >= 5) {
    hints.push('User appears stressed. Consider suggesting a breathing exercise.');
  }

  // Check for high jaw tension (anxiety indicator)
  const avgJawClench = recentReadings.reduce((sum, r) =>
    sum + r.facialCues.jawClench, 0
  ) / recentReadings.length;

  if (avgJawClench > 0.6) {
    hints.push('Physical tension detected. A body scan might help.');
  }

  // Check for brow furrow (cognitive stress)
  const avgBrowFurrow = recentReadings.reduce((sum, r) =>
    sum + r.facialCues.browFurrow, 0
  ) / recentReadings.length;

  if (avgBrowFurrow > 0.6) {
    hints.push('User may be overthinking. Grounding exercise could help.');
  }

  // Check for positive shift
  const firstHalf = readings.slice(0, Math.floor(readings.length / 2));
  const secondHalf = readings.slice(Math.floor(readings.length / 2));

  const firstPositive = firstHalf.filter((r) =>
    POSITIVE_EMOTIONS.includes(r.primaryEmotion)
  ).length / firstHalf.length;
  const secondPositive = secondHalf.filter((r) =>
    POSITIVE_EMOTIONS.includes(r.primaryEmotion)
  ).length / secondHalf.length;

  if (secondPositive > firstPositive + 0.2) {
    hints.push('Mood is improving! The conversation is helping.');
  }

  return hints;
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

interface EmotionHistoryEntry {
  date: string;
  summary: EmotionSummary;
}

/**
 * Save session summary to history
 */
async function saveSessionToHistory(summary: EmotionSummary): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_HISTORY);
    const history: EmotionHistoryEntry[] = historyJson ? JSON.parse(historyJson) : [];

    history.unshift({
      date: new Date().toISOString(),
      summary,
    });

    // Keep only last 30 entries
    const trimmed = history.slice(0, 30);

    await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save emotion history:', error);
  }
}

/**
 * Get emotion history
 */
export async function getEmotionHistory(): Promise<EmotionHistoryEntry[]> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to get emotion history:', error);
    return [];
  }
}

/**
 * Clear all emotion data (privacy feature)
 */
export async function clearEmotionData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.EMOTION_SETTINGS,
      STORAGE_KEYS.EMOTION_HISTORY,
    ]);
    sessionReadings = [];
    isAnalyzing = false;
  } catch (error) {
    console.error('Failed to clear emotion data:', error);
    throw error;
  }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get emoji for current emotional state
 */
export function getEmotionEmoji(emotion: EmotionType): string {
  return EMOTION_EMOJIS[emotion] || '😐';
}

/**
 * Get description of emotional state
 */
export function getEmotionDescription(emotion: EmotionType): string {
  const descriptions: Record<EmotionType, string> = {
    happy: "You seem to be in a good mood",
    sad: "You seem a bit down",
    angry: "You seem frustrated",
    fearful: "You seem worried or afraid",
    disgusted: "Something seems off",
    surprised: "You seem surprised",
    neutral: "You seem calm and neutral",
    anxious: "You seem a bit anxious",
    stressed: "You seem stressed",
  };
  return descriptions[emotion] || "I'm sensing your emotion";
}

/**
 * Get supportive message based on emotion
 */
export function getSupportiveMessage(emotion: EmotionType): string {
  const messages: Record<EmotionType, string[]> = {
    happy: [
      "It's good to see you well!",
      "That positive energy is wonderful.",
    ],
    sad: [
      "It's okay to feel this way.",
      "I'm here if you want to talk about it.",
    ],
    angry: [
      "Your feelings are valid.",
      "Want to talk through what's bothering you?",
    ],
    fearful: [
      "You're safe here.",
      "We can work through this together.",
    ],
    disgusted: [
      "That's an understandable reaction.",
      "Want to process what's bothering you?",
    ],
    surprised: [
      "Something unexpected?",
      "I'm curious what caught you off guard.",
    ],
    neutral: [
      "I'm here when you're ready to share.",
      "Take your time.",
    ],
    anxious: [
      "Would a breathing exercise help?",
      "Let's take this one step at a time.",
    ],
    stressed: [
      "Let's slow down if you need to.",
      "Would you like to try a calming exercise?",
    ],
  };

  const emotionMessages = messages[emotion] || messages.neutral;
  return emotionMessages[Math.floor(Math.random() * emotionMessages.length)];
}
