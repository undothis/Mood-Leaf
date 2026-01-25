/**
 * Voice Chat Service
 *
 * Enables hands-free conversation with the coach through voice.
 * Uses speech recognition with pause detection to automatically
 * send messages when the user stops speaking.
 *
 * Platform Support:
 * - iOS: Native Speech Recognition
 * - Android: Google Speech Services
 * - Web: Web Speech API
 *
 * Privacy (Mood Leaf Ethics):
 * - All speech processing is local when possible
 * - No recordings are stored without consent
 * - User has full control over when listening is active
 *
 * Unit: Voice Chat System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { log, info, warn, error as logError, startTimer, endTimer, logVoiceAnalysis } from './loggingService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  VOICE_SETTINGS: 'moodleaf_voice_settings',
  VOICE_HISTORY: 'moodleaf_voice_history',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type VoiceChatMode =
  | 'push_to_talk'      // Hold button to speak
  | 'auto_detect'       // Auto-detect speech pauses
  | 'continuous';       // Always listening (accessibility)

export type VoiceState =
  | 'idle'              // Not listening
  | 'listening'         // Actively listening
  | 'processing'        // Processing speech
  | 'speaking';         // Coach is responding (TTS)

export interface VoiceSettings {
  enabled: boolean;
  mode: VoiceChatMode;
  pauseThreshold: number; // Silence duration to trigger send (ms)
  language: string; // BCP-47 language code
  speakResponses: boolean; // Use TTS for coach responses
  speakingRate: number; // TTS speed (0.5-2.0)
  autoListen: boolean; // Re-enable listening after coach responds
  confirmBeforeSend: boolean; // Show transcript before sending
}

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  alternatives?: string[];
}

export interface VoiceChatState {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  lastSpeechTime: number;
  silenceDuration: number;
  isSupported: boolean;
  error?: string;
}

export interface VoiceChatCallbacks {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onMessageReady?: (message: string) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false, // Off by default
  mode: 'auto_detect',
  pauseThreshold: 1500, // 1.5 seconds of silence
  language: 'en-US',
  speakResponses: true,
  speakingRate: 1.0,
  autoListen: true,
  confirmBeforeSend: false,
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get voice chat settings
 */
export async function getVoiceSettings(): Promise<VoiceSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get voice settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save voice chat settings
 */
export async function saveVoiceSettings(
  settings: Partial<VoiceSettings>
): Promise<VoiceSettings> {
  try {
    const current = await getVoiceSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save voice settings:', error);
    throw error;
  }
}

// ============================================
// PLATFORM SUPPORT CHECK
// ============================================

/**
 * Check if voice chat is supported on this platform
 */
export function isVoiceChatSupported(): boolean {
  if (Platform.OS === 'web') {
    // Check for Web Speech API
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }
  // iOS and Android have native support
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
  return true; // iOS and Android have native TTS
}

// ============================================
// VOICE CHAT CONTROLLER CLASS
// ============================================

/**
 * VoiceChatController manages the voice chat session
 * This is a mock implementation - production would use actual speech recognition
 */
export class VoiceChatController {
  private state: VoiceChatState;
  private settings: VoiceSettings;
  private callbacks: VoiceChatCallbacks;
  private pauseTimer: NodeJS.Timeout | null = null;
  private silenceChecker: NodeJS.Timeout | null = null;

  // Mock speech recognition reference
  private recognition: any = null;

  constructor(callbacks: VoiceChatCallbacks = {}) {
    this.callbacks = callbacks;
    this.settings = DEFAULT_SETTINGS;
    this.state = {
      state: 'idle',
      transcript: '',
      interimTranscript: '',
      lastSpeechTime: 0,
      silenceDuration: 0,
      isSupported: isVoiceChatSupported(),
    };
  }

  /**
   * Initialize the voice chat controller
   */
  async initialize(): Promise<boolean> {
    this.settings = await getVoiceSettings();

    if (!this.state.isSupported) {
      this.state.error = 'Speech recognition not supported on this device';
      return false;
    }

    // Initialize Web Speech API on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.settings.language;

        this.setupWebSpeechHandlers();
      }
    }

    // On mobile, we'd use expo-speech or react-native-voice
    // For now, we'll use mock implementation

    return true;
  }

  /**
   * Set up handlers for Web Speech API
   */
  private setupWebSpeechHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.state.transcript += finalTranscript;
        this.state.lastSpeechTime = Date.now();
        this.callbacks.onTranscriptUpdate?.(this.state.transcript, true);
      }

      this.state.interimTranscript = interimTranscript;
      if (interimTranscript) {
        this.state.lastSpeechTime = Date.now();
        this.callbacks.onTranscriptUpdate?.(
          this.state.transcript + interimTranscript,
          false
        );
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.state.error = event.error;
      this.callbacks.onError?.(event.error);
    };

    this.recognition.onend = () => {
      if (this.state.state === 'listening') {
        // Auto-restart if we're still supposed to be listening
        this.recognition?.start();
      }
    };
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (this.state.state === 'listening') return;

    await logVoiceAnalysis('Voice listening started', { mode: this.settings.mode, language: this.settings.language });

    this.state.state = 'listening';
    this.state.transcript = '';
    this.state.interimTranscript = '';
    this.state.lastSpeechTime = Date.now();
    this.state.error = undefined;

    this.callbacks.onStateChange?.('listening');

    // Start speech recognition
    if (Platform.OS === 'web' && this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Already started
      }
    }

    // Start silence detection for auto-send
    if (this.settings.mode === 'auto_detect') {
      this.startSilenceDetection();
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<string> {
    if (this.state.state !== 'listening') return '';

    this.state.state = 'processing';
    this.callbacks.onStateChange?.('processing');

    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
    }

    // Stop silence detection
    this.stopSilenceDetection();

    const finalTranscript = this.state.transcript + this.state.interimTranscript;
    this.state.interimTranscript = '';

    await logVoiceAnalysis('Voice listening stopped', {
      transcriptLength: finalTranscript.length,
      silenceDuration: this.state.silenceDuration,
    });

    return finalTranscript;
  }

  /**
   * Start silence detection for auto-send
   */
  private startSilenceDetection(): void {
    this.silenceChecker = setInterval(() => {
      if (this.state.state !== 'listening') {
        this.stopSilenceDetection();
        return;
      }

      const silenceDuration = Date.now() - this.state.lastSpeechTime;
      this.state.silenceDuration = silenceDuration;

      // Check if silence threshold reached and we have content
      const hasContent = (this.state.transcript + this.state.interimTranscript).trim().length > 0;

      if (silenceDuration >= this.settings.pauseThreshold && hasContent) {
        this.triggerAutoSend();
      }
    }, 100); // Check every 100ms
  }

  /**
   * Stop silence detection
   */
  private stopSilenceDetection(): void {
    if (this.silenceChecker) {
      clearInterval(this.silenceChecker);
      this.silenceChecker = null;
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  /**
   * Trigger auto-send after silence threshold
   */
  private async triggerAutoSend(): Promise<void> {
    const message = await this.stopListening();

    if (message.trim()) {
      this.callbacks.onMessageReady?.(message.trim());
    }

    this.state.state = 'idle';
    this.callbacks.onStateChange?.('idle');
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string): Promise<void> {
    if (!this.settings.speakResponses) return;
    if (!isTTSSupported()) return;

    this.state.state = 'speaking';
    this.callbacks.onStateChange?.('speaking');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.settings.speakingRate;
        utterance.lang = this.settings.language;

        utterance.onend = () => {
          this.state.state = 'idle';
          this.callbacks.onStateChange?.('idle');

          // Auto-listen after speaking
          if (this.settings.autoListen) {
            setTimeout(() => this.startListening(), 500);
          }

          resolve();
        };

        utterance.onerror = () => {
          this.state.state = 'idle';
          this.callbacks.onStateChange?.('idle');
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    }

    // For mobile, we'd use expo-speech
    // Mock implementation - just wait and complete
    await new Promise((resolve) => setTimeout(resolve, text.length * 50));
    this.state.state = 'idle';
    this.callbacks.onStateChange?.('idle');

    if (this.settings.autoListen) {
      setTimeout(() => this.startListening(), 500);
    }
  }

  /**
   * Stop TTS
   */
  stopSpeaking(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    this.state.state = 'idle';
    this.callbacks.onStateChange?.('idle');
  }

  /**
   * Get current state
   */
  getState(): VoiceChatState {
    return { ...this.state };
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<VoiceSettings>): Promise<void> {
    this.settings = await saveVoiceSettings(settings);

    // Update recognition language if changed
    if (this.recognition && settings.language) {
      this.recognition.lang = settings.language;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.stopSilenceDetection();
    this.recognition = null;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let voiceChatInstance: VoiceChatController | null = null;

/**
 * Get or create voice chat controller instance
 */
export function getVoiceChatController(
  callbacks?: VoiceChatCallbacks
): VoiceChatController {
  if (!voiceChatInstance) {
    voiceChatInstance = new VoiceChatController(callbacks);
  }
  return voiceChatInstance;
}

/**
 * Destroy voice chat controller
 */
export function destroyVoiceChatController(): void {
  if (voiceChatInstance) {
    voiceChatInstance.destroy();
    voiceChatInstance = null;
  }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get icon for voice state
 */
export function getVoiceStateIcon(state: VoiceState): string {
  const icons: Record<VoiceState, string> = {
    idle: '🎤',
    listening: '🔴',
    processing: '⏳',
    speaking: '🔊',
  };
  return icons[state];
}

/**
 * Get label for voice state
 */
export function getVoiceStateLabel(state: VoiceState): string {
  const labels: Record<VoiceState, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
  };
  return labels[state];
}

/**
 * Format silence indicator (for UI)
 */
export function formatSilenceIndicator(
  silenceDuration: number,
  threshold: number
): { percentage: number; label: string } {
  const percentage = Math.min(100, (silenceDuration / threshold) * 100);
  const remaining = Math.max(0, threshold - silenceDuration);

  let label = '';
  if (remaining > 0) {
    label = `${(remaining / 1000).toFixed(1)}s`;
  } else {
    label = 'Sending...';
  }

  return { percentage, label };
}

// ============================================
// LANGUAGE SUPPORT
// ============================================

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', native: 'English' },
  { code: 'en-GB', name: 'English (UK)', native: 'English' },
  { code: 'es-ES', name: 'Spanish', native: 'Español' },
  { code: 'fr-FR', name: 'French', native: 'Français' },
  { code: 'de-DE', name: 'German', native: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語' },
  { code: 'ko-KR', name: 'Korean', native: '한국어' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية' },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}
