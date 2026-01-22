/**
 * Biometric Security Service
 *
 * Protects user's private journal through voice and facial recognition.
 *
 * Features:
 * 1. Voice Print Authentication - Is this the actual user?
 * 2. Facial Recognition - Verify the right person is using the app
 * 3. Anomaly Detection - Slurring, distress, unusual patterns
 * 4. Authorized Users - Allow trusted people if user wants
 * 5. Intruder Detection - Block access if someone else tries to use
 *
 * Privacy-first approach:
 * - All biometric data stored locally
 * - Hashed/encoded, not raw biometrics
 * - User controls who has access
 * - Can be disabled if user prefers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Voice print characteristics (stored as hashed features)
 */
export interface VoicePrint {
  id: string;
  label: string;  // "Owner", "Partner", etc.

  // Enrolled voice characteristics (hashed/encoded)
  enrolledFeatures: string;  // Encoded voice features
  enrollmentDate: string;
  sampleCount: number;

  // Baseline metrics
  baselinePitch: { low: number; high: number; average: number };
  baselineTempo: number;  // Words per minute
  baselineTimbre: string;  // Encoded timbre signature

  // Access level
  accessLevel: 'owner' | 'authorized' | 'blocked';

  // For authorized users
  permissions?: AuthorizedUserPermissions;
}

/**
 * Facial recognition profile
 */
export interface FaceProfile {
  id: string;
  label: string;

  // Enrolled facial features (encoded)
  enrolledFeatures: string;
  enrollmentDate: string;
  sampleCount: number;

  // Access level
  accessLevel: 'owner' | 'authorized' | 'blocked';

  // Permissions for non-owners
  permissions?: AuthorizedUserPermissions;
}

/**
 * What authorized users can do
 */
export interface AuthorizedUserPermissions {
  canReadJournal: boolean;
  canWriteJournal: boolean;
  canChat: boolean;
  canViewMoodHistory: boolean;
  canAccessSettings: boolean;
  expiresAt?: string;  // Optional expiration
  reason?: string;     // Why they have access
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  authenticated: boolean;
  method: 'voice' | 'face' | 'both' | 'fallback';
  confidence: number;  // 0-100

  // Who was recognized
  recognizedAs?: string;  // Voice/face profile ID
  userLabel?: string;     // "Owner", "Partner", etc.
  accessLevel?: 'owner' | 'authorized' | 'blocked';

  // Anomalies detected
  anomalies: AuthenticationAnomaly[];

  // If blocked, why
  blockReason?: string;
}

/**
 * Anomalies that might be detected
 */
export interface AuthenticationAnomaly {
  type: AnomalyType;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  suggestedAction: string;
}

export type AnomalyType =
  | 'voice_not_recognized'     // Unknown voice
  | 'face_not_recognized'      // Unknown face
  | 'voice_slurring'           // Possible intoxication or distress
  | 'voice_pitch_change'       // Significant pitch change (stress?)
  | 'voice_tempo_fast'         // Speaking much faster (anxiety?)
  | 'voice_tempo_slow'         // Speaking much slower (depression?)
  | 'voice_tremor'             // Shakiness in voice
  | 'face_distress'            // Facial expression of distress
  | 'face_crying'              // Signs of crying
  | 'face_injury'              // Possible injury detected
  | 'multiple_faces'           // More than one person visible
  | 'coercion_suspected'       // Signs someone may be being forced
  | 'time_anomaly'             // Unusual access time
  | 'location_anomaly';        // Unusual access location

/**
 * Security settings
 */
export interface SecuritySettings {
  // What's enabled
  voiceAuthEnabled: boolean;
  faceAuthEnabled: boolean;
  requireBothForSensitive: boolean;  // Require both voice + face for sensitive actions

  // Sensitivity
  voiceMatchThreshold: number;   // 0-100, higher = more strict
  faceMatchThreshold: number;

  // Anomaly detection
  detectSlurring: boolean;
  detectDistress: boolean;
  detectCoercion: boolean;

  // What happens on failed auth
  onFailedAuth: 'block' | 'limited_access' | 'warn_only';
  maxAttempts: number;
  lockoutDuration: number;  // minutes

  // Emergency features
  emergencyContactEnabled: boolean;
  panicPhraseEnabled: boolean;
  panicPhrase?: string;  // "I'm just checking my calendar" → alert trusted contact

  // Notifications
  notifyOnUnknownAccess: boolean;
  notifyOnAnomalies: boolean;
}

/**
 * Security state
 */
export interface SecurityState {
  isLocked: boolean;
  lockoutUntil?: string;
  failedAttempts: number;
  lastSuccessfulAuth?: string;
  lastAuthMethod?: 'voice' | 'face' | 'both';
  currentSession?: {
    authenticatedAs: string;
    accessLevel: 'owner' | 'authorized';
    startedAt: string;
  };
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  VOICE_PRINTS: '@moodleaf_voice_prints',
  FACE_PROFILES: '@moodleaf_face_profiles',
  SECURITY_SETTINGS: '@moodleaf_security_settings',
  SECURITY_STATE: '@moodleaf_security_state',
  AUTH_LOG: '@moodleaf_auth_log',
};

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: SecuritySettings = {
  voiceAuthEnabled: false,
  faceAuthEnabled: false,
  requireBothForSensitive: false,

  voiceMatchThreshold: 70,
  faceMatchThreshold: 70,

  detectSlurring: true,
  detectDistress: true,
  detectCoercion: true,

  onFailedAuth: 'limited_access',
  maxAttempts: 3,
  lockoutDuration: 15,

  emergencyContactEnabled: false,
  panicPhraseEnabled: false,

  notifyOnUnknownAccess: true,
  notifyOnAnomalies: true,
};

const DEFAULT_STATE: SecurityState = {
  isLocked: false,
  failedAttempts: 0,
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get security settings
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[Security] Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save security settings
 */
export async function saveSecuritySettings(
  settings: Partial<SecuritySettings>
): Promise<void> {
  try {
    const current = await getSecuritySettings();
    await AsyncStorage.setItem(
      STORAGE_KEYS.SECURITY_SETTINGS,
      JSON.stringify({ ...current, ...settings })
    );
  } catch (error) {
    console.error('[Security] Failed to save settings:', error);
  }
}

/**
 * Get security state
 */
export async function getSecurityState(): Promise<SecurityState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_STATE);
    return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
  } catch (error) {
    return DEFAULT_STATE;
  }
}

/**
 * Save security state
 */
async function saveSecurityState(state: SecurityState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('[Security] Failed to save state:', error);
  }
}

// ============================================================================
// Voice Print Management
// ============================================================================

/**
 * Get all voice prints
 */
export async function getVoicePrints(): Promise<VoicePrint[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_PRINTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get owner's voice print
 */
export async function getOwnerVoicePrint(): Promise<VoicePrint | null> {
  const prints = await getVoicePrints();
  return prints.find(p => p.accessLevel === 'owner') || null;
}

/**
 * Enroll a new voice print
 *
 * In real implementation, this would:
 * 1. Record multiple voice samples
 * 2. Extract voice features (pitch, timbre, tempo, etc.)
 * 3. Create a voice embedding/hash
 * 4. Store securely
 */
export async function enrollVoicePrint(
  label: string,
  accessLevel: 'owner' | 'authorized',
  permissions?: AuthorizedUserPermissions
): Promise<VoicePrint> {
  // Placeholder - real implementation would process audio
  const voicePrint: VoicePrint = {
    id: `voice_${Date.now()}`,
    label,
    enrolledFeatures: '', // Would be populated by audio processing
    enrollmentDate: new Date().toISOString(),
    sampleCount: 0,
    baselinePitch: { low: 0, high: 0, average: 0 },
    baselineTempo: 0,
    baselineTimbre: '',
    accessLevel,
    permissions: accessLevel === 'authorized' ? permissions : undefined,
  };

  const prints = await getVoicePrints();
  prints.push(voicePrint);
  await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINTS, JSON.stringify(prints));

  return voicePrint;
}

/**
 * Add a voice sample to an existing print
 */
export async function addVoiceSample(
  printId: string,
  _audioData: any  // Would be actual audio data
): Promise<boolean> {
  const prints = await getVoicePrints();
  const print = prints.find(p => p.id === printId);

  if (!print) return false;

  // Real implementation would:
  // 1. Extract features from audio
  // 2. Update the enrolled features (rolling average)
  // 3. Update baseline metrics

  print.sampleCount += 1;
  await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINTS, JSON.stringify(prints));

  return true;
}

/**
 * Remove a voice print
 */
export async function removeVoicePrint(printId: string): Promise<boolean> {
  const prints = await getVoicePrints();
  const filtered = prints.filter(p => p.id !== printId);

  if (filtered.length === prints.length) return false;

  await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINTS, JSON.stringify(filtered));
  return true;
}

/**
 * Block a voice print (for intruders)
 */
export async function blockVoicePrint(printId: string): Promise<void> {
  const prints = await getVoicePrints();
  const print = prints.find(p => p.id === printId);

  if (print) {
    print.accessLevel = 'blocked';
    await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINTS, JSON.stringify(prints));
  }
}

// ============================================================================
// Face Profile Management
// ============================================================================

/**
 * Get all face profiles
 */
export async function getFaceProfiles(): Promise<FaceProfile[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_PROFILES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Enroll a new face profile
 */
export async function enrollFaceProfile(
  label: string,
  accessLevel: 'owner' | 'authorized',
  permissions?: AuthorizedUserPermissions
): Promise<FaceProfile> {
  const faceProfile: FaceProfile = {
    id: `face_${Date.now()}`,
    label,
    enrolledFeatures: '', // Would be populated by face detection
    enrollmentDate: new Date().toISOString(),
    sampleCount: 0,
    accessLevel,
    permissions: accessLevel === 'authorized' ? permissions : undefined,
  };

  const profiles = await getFaceProfiles();
  profiles.push(faceProfile);
  await AsyncStorage.setItem(STORAGE_KEYS.FACE_PROFILES, JSON.stringify(profiles));

  return faceProfile;
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Authenticate user via voice
 *
 * This would:
 * 1. Capture voice input
 * 2. Extract features
 * 3. Compare against enrolled voice prints
 * 4. Detect anomalies (slurring, stress, etc.)
 * 5. Return authentication result
 */
export async function authenticateByVoice(
  _audioData: any
): Promise<AuthenticationResult> {
  const settings = await getSecuritySettings();
  const state = await getSecurityState();
  const prints = await getVoicePrints();

  // Check if locked out
  if (state.isLocked && state.lockoutUntil) {
    if (new Date() < new Date(state.lockoutUntil)) {
      return {
        authenticated: false,
        method: 'voice',
        confidence: 0,
        anomalies: [],
        blockReason: `Locked out until ${state.lockoutUntil}`,
      };
    }
  }

  // Placeholder - real implementation would do voice matching
  // For now, return a mock result

  const anomalies: AuthenticationAnomaly[] = [];

  // Check for anomalies (placeholder logic)
  // Real implementation would analyze audio for:
  // - Slurring
  // - Pitch changes
  // - Tempo changes
  // - Tremor

  const result: AuthenticationResult = {
    authenticated: prints.length > 0, // Mock: succeed if any prints enrolled
    method: 'voice',
    confidence: prints.length > 0 ? 85 : 0,
    recognizedAs: prints[0]?.id,
    userLabel: prints[0]?.label,
    accessLevel: prints[0]?.accessLevel,
    anomalies,
  };

  // Log the attempt
  await logAuthAttempt(result);

  // Update state
  if (result.authenticated) {
    state.failedAttempts = 0;
    state.lastSuccessfulAuth = new Date().toISOString();
    state.lastAuthMethod = 'voice';
    state.currentSession = {
      authenticatedAs: result.recognizedAs!,
      accessLevel: result.accessLevel as 'owner' | 'authorized',
      startedAt: new Date().toISOString(),
    };
  } else {
    state.failedAttempts += 1;
    if (state.failedAttempts >= settings.maxAttempts) {
      state.isLocked = true;
      state.lockoutUntil = new Date(
        Date.now() + settings.lockoutDuration * 60000
      ).toISOString();
    }
  }

  await saveSecurityState(state);

  return result;
}

/**
 * Authenticate user via face
 */
export async function authenticateByFace(
  _imageData: any
): Promise<AuthenticationResult> {
  const profiles = await getFaceProfiles();

  // Placeholder - real implementation would do face matching

  const anomalies: AuthenticationAnomaly[] = [];

  const result: AuthenticationResult = {
    authenticated: profiles.length > 0,
    method: 'face',
    confidence: profiles.length > 0 ? 85 : 0,
    recognizedAs: profiles[0]?.id,
    userLabel: profiles[0]?.label,
    accessLevel: profiles[0]?.accessLevel,
    anomalies,
  };

  await logAuthAttempt(result);

  return result;
}

/**
 * Authenticate with both voice and face
 */
export async function authenticateBoth(
  audioData: any,
  imageData: any
): Promise<AuthenticationResult> {
  const [voiceResult, faceResult] = await Promise.all([
    authenticateByVoice(audioData),
    authenticateByFace(imageData),
  ]);

  // Combine anomalies
  const anomalies = [
    ...voiceResult.anomalies,
    ...faceResult.anomalies,
  ];

  // Check if they match the same person
  const voiceUser = voiceResult.recognizedAs;
  const faceUser = faceResult.recognizedAs;

  let authenticated = voiceResult.authenticated && faceResult.authenticated;
  let confidence = (voiceResult.confidence + faceResult.confidence) / 2;

  // If voice and face don't match, that's suspicious
  if (voiceUser && faceUser && voiceUser !== faceUser) {
    authenticated = false;
    anomalies.push({
      type: 'coercion_suspected',
      severity: 'critical',
      description: 'Voice and face belong to different people',
      suggestedAction: 'This may indicate coercion. Consider alerting emergency contact.',
    });
  }

  return {
    authenticated,
    method: 'both',
    confidence,
    recognizedAs: voiceUser || faceUser,
    userLabel: voiceResult.userLabel || faceResult.userLabel,
    accessLevel: voiceResult.accessLevel || faceResult.accessLevel,
    anomalies,
  };
}

// ============================================================================
// Anomaly Detection
// ============================================================================

/**
 * Analyze voice for anomalies
 *
 * This would detect:
 * - Slurring (possible intoxication)
 * - Pitch changes (stress, fear)
 * - Tempo changes (anxiety, depression)
 * - Tremor (fear, cold, illness)
 */
export function analyzeVoiceForAnomalies(
  currentVoice: any,
  baseline: VoicePrint
): AuthenticationAnomaly[] {
  const anomalies: AuthenticationAnomaly[] = [];

  // Placeholder - real implementation would analyze audio features

  // Example: if tempo is significantly faster than baseline
  // if (currentTempo > baseline.baselineTempo * 1.3) {
  //   anomalies.push({
  //     type: 'voice_tempo_fast',
  //     severity: 'warning',
  //     description: 'Speaking significantly faster than usual',
  //     suggestedAction: 'Check in about anxiety or stress',
  //   });
  // }

  return anomalies;
}

/**
 * Analyze face for anomalies
 */
export function analyzeFaceForAnomalies(
  _imageData: any
): AuthenticationAnomaly[] {
  const anomalies: AuthenticationAnomaly[] = [];

  // Placeholder - real implementation would analyze:
  // - Signs of crying
  // - Signs of injury
  // - Distress expressions
  // - Multiple faces in frame

  return anomalies;
}

// ============================================================================
// Panic/Emergency Features
// ============================================================================

/**
 * Check if a phrase is the panic phrase
 */
export async function checkForPanicPhrase(
  spokenText: string
): Promise<boolean> {
  const settings = await getSecuritySettings();

  if (!settings.panicPhraseEnabled || !settings.panicPhrase) {
    return false;
  }

  const normalizedInput = spokenText.toLowerCase().trim();
  const normalizedPanic = settings.panicPhrase.toLowerCase().trim();

  return normalizedInput.includes(normalizedPanic);
}

/**
 * Trigger panic mode
 *
 * This would:
 * 1. Log the incident
 * 2. Alert emergency contact (if enabled)
 * 3. Show fake/decoy content
 * 4. Record what's happening (if enabled)
 */
export async function triggerPanicMode(): Promise<void> {
  // Log the incident
  await logSecurityIncident('panic_mode_triggered');

  // In real implementation:
  // - Send alert to emergency contact
  // - Show decoy screen
  // - Start background recording (with consent)

  console.warn('[Security] Panic mode triggered');
}

// ============================================================================
// Logging
// ============================================================================

interface AuthLogEntry {
  timestamp: string;
  method: 'voice' | 'face' | 'both' | 'fallback';
  success: boolean;
  recognizedAs?: string;
  anomalies: AnomalyType[];
  confidence: number;
}

/**
 * Log an authentication attempt
 */
async function logAuthAttempt(result: AuthenticationResult): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_LOG);
    const log: AuthLogEntry[] = stored ? JSON.parse(stored) : [];

    log.push({
      timestamp: new Date().toISOString(),
      method: result.method,
      success: result.authenticated,
      recognizedAs: result.recognizedAs,
      anomalies: result.anomalies.map(a => a.type),
      confidence: result.confidence,
    });

    // Keep only last 100 entries
    if (log.length > 100) {
      log.splice(0, log.length - 100);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_LOG, JSON.stringify(log));
  } catch (error) {
    console.error('[Security] Failed to log auth attempt:', error);
  }
}

/**
 * Log a security incident
 */
async function logSecurityIncident(type: string): Promise<void> {
  // In real implementation, this would:
  // - Store locally
  // - Optionally alert emergency contact
  // - Optionally send to secure server
  console.log(`[Security] Incident logged: ${type}`);
}

/**
 * Get authentication history
 */
export async function getAuthHistory(): Promise<AuthLogEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_LOG);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

// ============================================================================
// Authorized User Management
// ============================================================================

/**
 * Add an authorized user (partner, therapist, etc.)
 */
export async function addAuthorizedUser(
  label: string,
  permissions: AuthorizedUserPermissions,
  enrollVoice: boolean = true,
  enrollFace: boolean = true
): Promise<{ voicePrint?: VoicePrint; faceProfile?: FaceProfile }> {
  const result: { voicePrint?: VoicePrint; faceProfile?: FaceProfile } = {};

  if (enrollVoice) {
    result.voicePrint = await enrollVoicePrint(label, 'authorized', permissions);
  }

  if (enrollFace) {
    result.faceProfile = await enrollFaceProfile(label, 'authorized', permissions);
  }

  return result;
}

/**
 * Remove an authorized user
 */
export async function removeAuthorizedUser(label: string): Promise<void> {
  const voicePrints = await getVoicePrints();
  const faceProfiles = await getFaceProfiles();

  const filteredVoice = voicePrints.filter(p => p.label !== label || p.accessLevel === 'owner');
  const filteredFace = faceProfiles.filter(p => p.label !== label || p.accessLevel === 'owner');

  await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINTS, JSON.stringify(filteredVoice));
  await AsyncStorage.setItem(STORAGE_KEYS.FACE_PROFILES, JSON.stringify(filteredFace));
}

/**
 * Get all authorized users
 */
export async function getAuthorizedUsers(): Promise<Array<{
  label: string;
  hasVoice: boolean;
  hasFace: boolean;
  permissions?: AuthorizedUserPermissions;
}>> {
  const voicePrints = await getVoicePrints();
  const faceProfiles = await getFaceProfiles();

  const users = new Map<string, {
    label: string;
    hasVoice: boolean;
    hasFace: boolean;
    permissions?: AuthorizedUserPermissions;
  }>();

  for (const print of voicePrints.filter(p => p.accessLevel === 'authorized')) {
    users.set(print.label, {
      label: print.label,
      hasVoice: true,
      hasFace: false,
      permissions: print.permissions,
    });
  }

  for (const profile of faceProfiles.filter(p => p.accessLevel === 'authorized')) {
    const existing = users.get(profile.label);
    if (existing) {
      existing.hasFace = true;
    } else {
      users.set(profile.label, {
        label: profile.label,
        hasVoice: false,
        hasFace: true,
        permissions: profile.permissions,
      });
    }
  }

  return Array.from(users.values());
}
