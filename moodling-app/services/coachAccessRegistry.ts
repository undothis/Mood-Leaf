/**
 * Coach Access Registry
 *
 * WHITELIST of everything the AI coach is allowed to access.
 * If a service/data source is NOT in this registry, the AI cannot access it.
 *
 * Developer-only control for:
 * - Enabling/disabling specific data sources
 * - Debugging what data flows to AI
 * - Troubleshooting issues by isolating services
 *
 * Unit: AI Access Control
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'moodleaf_coach_access_registry';
const ACCESS_LOG_KEY = 'moodleaf_coach_access_log';

// ============================================
// TYPES
// ============================================

export type AccessCategory =
  | 'core'           // Essential for coach to function
  | 'user_data'      // User's personal data
  | 'tracking'       // Mood, habits, logs
  | 'health'         // HealthKit, correlations
  | 'context'        // Life context, memories
  | 'therapeutic'    // CBT, DBT modes
  | 'actions';       // Things AI can trigger

export interface AccessEntry {
  id: string;
  name: string;
  description: string;
  service: string;           // The service file it comes from
  category: AccessCategory;
  enabled: boolean;          // Can be toggled by developer
  required: boolean;         // If true, cannot be disabled (core functionality)
  conditional?: string;      // e.g., "Requires HealthKit enabled"
}

export interface AccessLog {
  id: string;
  timestamp: Date;
  action: 'read' | 'write' | 'trigger';
  data?: string;
}

// ============================================
// THE REGISTRY - Everything AI can access
// ============================================

export const COACH_ACCESS_REGISTRY: Record<string, AccessEntry> = {
  // ==========================================
  // CORE (Required - cannot disable)
  // ==========================================
  core_principles: {
    id: 'core_principles',
    name: 'Ethical Principles',
    description: 'Core safety tenets that guide AI behavior',
    service: 'corePrincipleKernel',
    category: 'core',
    enabled: true,
    required: true,
  },
  coach_personality: {
    id: 'coach_personality',
    name: 'Coach Personality',
    description: 'Persona and tone settings (Clover, Spark, etc.)',
    service: 'coachPersonalityService',
    category: 'core',
    enabled: true,
    required: true,
  },
  tone_preferences: {
    id: 'tone_preferences',
    name: 'Tone Preferences',
    description: 'User preferred communication style',
    service: 'tonePreferencesService',
    category: 'core',
    enabled: true,
    required: true,
  },
  conversation_history: {
    id: 'conversation_history',
    name: 'Conversation History',
    description: 'Recent messages in current chat',
    service: 'coach/index.tsx',
    category: 'core',
    enabled: true,
    required: true,
  },

  // ==========================================
  // USER DATA
  // ==========================================
  user_name: {
    id: 'user_name',
    name: 'User Name',
    description: 'User\'s name for personalization',
    service: 'coachPersonalityService',
    category: 'user_data',
    enabled: true,
    required: false,
    conditional: 'Only if user has set their name',
  },
  user_preferences: {
    id: 'user_preferences',
    name: 'User Preferences',
    description: 'General user settings and preferences',
    service: 'userContextService',
    category: 'user_data',
    enabled: true,
    required: false,
  },
  cognitive_profile: {
    id: 'cognitive_profile',
    name: 'Cognitive Profile',
    description: 'How user thinks and learns',
    service: 'cognitiveProfileService',
    category: 'user_data',
    enabled: true,
    required: false,
  },
  psychological_profile: {
    id: 'psychological_profile',
    name: 'Psychological Profile',
    description: 'User psychological patterns and traits',
    service: 'psychAnalysisService',
    category: 'user_data',
    enabled: true,
    required: false,
  },
  chronotype: {
    id: 'chronotype',
    name: 'Chronotype',
    description: 'Early bird / night owl preferences',
    service: 'coachPersonalityService',
    category: 'user_data',
    enabled: true,
    required: false,
  },

  // ==========================================
  // CONTEXT & MEMORIES
  // ==========================================
  memory_context: {
    id: 'memory_context',
    name: 'Conversation Memories',
    description: 'Important things remembered from past chats',
    service: 'memoryTierService',
    category: 'context',
    enabled: true,
    required: false,
  },
  life_context: {
    id: 'life_context',
    name: 'Life Context',
    description: 'People, events, topics in user\'s life',
    service: 'lifeContextService',
    category: 'context',
    enabled: true,
    required: false,
  },
  social_connections: {
    id: 'social_connections',
    name: 'Social Connection Health',
    description: 'Relationship and social health data',
    service: 'socialConnectionHealthService',
    category: 'context',
    enabled: true,
    required: false,
  },
  journal_entries: {
    id: 'journal_entries',
    name: 'Journal Entries',
    description: 'Recent journal entries (summarized)',
    service: 'journalStorage',
    category: 'context',
    enabled: true,
    required: false,
  },

  // ==========================================
  // TRACKING DATA
  // ==========================================
  quick_logs: {
    id: 'quick_logs',
    name: 'Quick Logs',
    description: 'Mood, energy, and other tracking logs',
    service: 'quickLogsService',
    category: 'tracking',
    enabled: true,
    required: false,
  },
  lifestyle_factors: {
    id: 'lifestyle_factors',
    name: 'Lifestyle Factors',
    description: 'Sleep, caffeine, alcohol, exercise patterns',
    service: 'patternService',
    category: 'tracking',
    enabled: true,
    required: false,
  },
  exposure_progress: {
    id: 'exposure_progress',
    name: 'Exposure Ladder Progress',
    description: 'Social anxiety exposure tracking',
    service: 'exposureLadderService',
    category: 'tracking',
    enabled: true,
    required: false,
  },
  accountability_data: {
    id: 'accountability_data',
    name: 'Accountability Data',
    description: 'Limits and accountability preferences',
    service: 'aiAccountabilityService',
    category: 'tracking',
    enabled: true,
    required: false,
  },
  skill_recommendations: {
    id: 'skill_recommendations',
    name: 'Skill Recommendations',
    description: 'Suggested skills based on patterns',
    service: 'skillRecommendationService',
    category: 'tracking',
    enabled: true,
    required: false,
  },
  achievements: {
    id: 'achievements',
    name: 'Achievement Celebrations',
    description: 'Pending achievement notifications',
    service: 'achievementNotificationService',
    category: 'tracking',
    enabled: true,
    required: false,
    conditional: 'Only if achievements pending',
  },

  // ==========================================
  // HEALTH DATA (Conditional)
  // ==========================================
  health_metrics: {
    id: 'health_metrics',
    name: 'Health Metrics',
    description: 'Heart rate, sleep, activity from HealthKit',
    service: 'healthKitService',
    category: 'health',
    enabled: true,
    required: false,
    conditional: 'Requires HealthKit enabled',
  },
  health_correlations: {
    id: 'health_correlations',
    name: 'Health-Mood Correlations',
    description: 'Connections between health and mood',
    service: 'healthInsightService',
    category: 'health',
    enabled: true,
    required: false,
    conditional: 'Requires HealthKit enabled',
  },
  calendar_events: {
    id: 'calendar_events',
    name: 'Calendar Events',
    description: 'Upcoming calendar events',
    service: 'calendarService',
    category: 'health',
    enabled: true,
    required: false,
    conditional: 'Requires Calendar permission',
  },
  drink_pacing: {
    id: 'drink_pacing',
    name: 'Drink Pacing',
    description: 'Active drink pacing session data',
    service: 'drinkPacingService',
    category: 'health',
    enabled: true,
    required: false,
    conditional: 'Only if active session',
  },
  habit_timers: {
    id: 'habit_timers',
    name: 'Habit Timers',
    description: 'Active habit tracking data',
    service: 'habitTimerService',
    category: 'health',
    enabled: true,
    required: false,
    conditional: 'Only if habits active',
  },

  // ==========================================
  // THERAPEUTIC MODES
  // ==========================================
  coach_modes: {
    id: 'coach_modes',
    name: 'Coach Modes',
    description: 'Active therapeutic modes (CBT, DBT, etc.)',
    service: 'coachModeService',
    category: 'therapeutic',
    enabled: true,
    required: false,
    conditional: 'Only if user activated',
  },

  // ==========================================
  // ACTIONS (What AI can trigger)
  // ==========================================
  action_open_skill: {
    id: 'action_open_skill',
    name: 'Open Skill Overlay',
    description: 'AI can open breathing/grounding skills',
    service: 'SkillOverlay',
    category: 'actions',
    enabled: true,
    required: false,
  },
  action_close_skill: {
    id: 'action_close_skill',
    name: 'Close Skill Overlay',
    description: 'AI can close active skill overlay',
    service: 'SkillOverlay',
    category: 'actions',
    enabled: true,
    required: false,
  },

  // ==========================================
  // BLOCKED BY DEFAULT (Not currently accessed)
  // These exist so developers can see what's
  // explicitly NOT allowed and toggle if needed
  // ==========================================

  // --- Data that EXISTS but AI doesn't access ---
  raw_journal_content: {
    id: 'raw_journal_content',
    name: 'Raw Journal Content',
    description: 'Full unedited journal entries (vs summaries)',
    service: 'journalStorage',
    category: 'user_data',
    enabled: false, // BLOCKED - only summaries allowed
    required: false,
  },
  deleted_entries: {
    id: 'deleted_entries',
    name: 'Deleted Entries',
    description: 'Deleted journal entries and data',
    service: 'journalStorage',
    category: 'user_data',
    enabled: false, // BLOCKED
    required: false,
  },
  export_history: {
    id: 'export_history',
    name: 'Export History',
    description: 'Data export logs and history',
    service: 'dataPersistenceService',
    category: 'user_data',
    enabled: false, // BLOCKED
    required: false,
  },
  subscription_status: {
    id: 'subscription_status',
    name: 'Subscription Status',
    description: 'Premium subscription details',
    service: 'subscriptionService',
    category: 'user_data',
    enabled: false, // BLOCKED
    required: false,
  },
  api_keys: {
    id: 'api_keys',
    name: 'API Keys',
    description: 'User API keys and tokens',
    service: 'claudeAPIService',
    category: 'user_data',
    enabled: false, // BLOCKED - security sensitive
    required: false,
  },
  device_info: {
    id: 'device_info',
    name: 'Device Information',
    description: 'Device model, OS version, etc.',
    service: 'Platform',
    category: 'user_data',
    enabled: false, // BLOCKED
    required: false,
  },

  // --- Potential future data sources ---
  location_data: {
    id: 'location_data',
    name: 'Location Data',
    description: 'GPS location and location history',
    service: 'N/A',
    category: 'user_data',
    enabled: false, // BLOCKED - not implemented
    required: false,
  },
  contacts: {
    id: 'contacts',
    name: 'Contacts',
    description: 'Phone contacts list',
    service: 'N/A',
    category: 'user_data',
    enabled: false, // BLOCKED - not implemented
    required: false,
  },
  photos: {
    id: 'photos',
    name: 'Photo Library',
    description: 'Access to photo library',
    service: 'N/A',
    category: 'user_data',
    enabled: false, // BLOCKED - not implemented
    required: false,
  },
  notifications: {
    id: 'notifications',
    name: 'Notification History',
    description: 'Past notifications sent',
    service: 'notificationService',
    category: 'tracking',
    enabled: false, // BLOCKED
    required: false,
  },
  app_usage: {
    id: 'app_usage',
    name: 'App Usage Stats',
    description: 'How long user spends in app',
    service: 'analyticsService',
    category: 'tracking',
    enabled: false, // BLOCKED
    required: false,
  },
  crash_logs: {
    id: 'crash_logs',
    name: 'Crash Logs',
    description: 'App crash and error logs',
    service: 'N/A',
    category: 'tracking',
    enabled: false, // BLOCKED
    required: false,
  },
  network_requests: {
    id: 'network_requests',
    name: 'Network Requests',
    description: 'API call history',
    service: 'N/A',
    category: 'tracking',
    enabled: false, // BLOCKED - debug only
    required: false,
  },
  training_data: {
    id: 'training_data',
    name: 'Training Data',
    description: 'Data marked for AI training',
    service: 'dataPersistenceService',
    category: 'tracking',
    enabled: false, // BLOCKED
    required: false,
  },

  // --- Actions AI cannot take ---
  action_delete_data: {
    id: 'action_delete_data',
    name: 'Delete User Data',
    description: 'AI can delete journal entries or data',
    service: 'N/A',
    category: 'actions',
    enabled: false, // BLOCKED - dangerous
    required: false,
  },
  action_send_notification: {
    id: 'action_send_notification',
    name: 'Send Notification',
    description: 'AI can send push notifications',
    service: 'notificationService',
    category: 'actions',
    enabled: false, // BLOCKED
    required: false,
  },
  action_make_purchase: {
    id: 'action_make_purchase',
    name: 'Make Purchase',
    description: 'AI can trigger in-app purchases',
    service: 'N/A',
    category: 'actions',
    enabled: false, // BLOCKED - dangerous
    required: false,
  },
  action_share_externally: {
    id: 'action_share_externally',
    name: 'Share Externally',
    description: 'AI can share data outside app',
    service: 'N/A',
    category: 'actions',
    enabled: false, // BLOCKED - privacy
    required: false,
  },
  action_navigate: {
    id: 'action_navigate',
    name: 'Navigate App',
    description: 'AI can navigate to other screens',
    service: 'router',
    category: 'actions',
    enabled: false, // BLOCKED - could be disruptive
    required: false,
  },
  action_modify_settings: {
    id: 'action_modify_settings',
    name: 'Modify Settings',
    description: 'AI can change user settings',
    service: 'N/A',
    category: 'actions',
    enabled: false, // BLOCKED - dangerous
    required: false,
  },
  action_access_clipboard: {
    id: 'action_access_clipboard',
    name: 'Access Clipboard',
    description: 'AI can read/write clipboard',
    service: 'N/A',
    category: 'actions',
    enabled: false, // BLOCKED - privacy
    required: false,
  },
};

// ============================================
// STATE
// ============================================

let enabledOverrides: Record<string, boolean> = {};
let accessLogs: AccessLog[] = [];
let initialized = false;

// ============================================
// INITIALIZATION
// ============================================

export async function initializeAccessRegistry(): Promise<void> {
  if (initialized) return;

  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      enabledOverrides = JSON.parse(saved);
    }

    const savedLogs = await AsyncStorage.getItem(ACCESS_LOG_KEY);
    if (savedLogs) {
      accessLogs = JSON.parse(savedLogs);
    }

    initialized = true;
    console.log('[CoachAccessRegistry] Initialized with', Object.keys(COACH_ACCESS_REGISTRY).length, 'entries');
  } catch (error) {
    console.error('[CoachAccessRegistry] Init failed:', error);
  }
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Check if a service/data source is allowed
 * This is the main function used throughout the app
 */
export function isAccessAllowed(id: string): boolean {
  const entry = COACH_ACCESS_REGISTRY[id];

  // Not in registry = NOT ALLOWED
  if (!entry) {
    console.warn(`[CoachAccessRegistry] BLOCKED - "${id}" not in registry`);
    logAccess(id, 'read', 'BLOCKED - not in registry');
    return false;
  }

  // Required entries cannot be disabled
  if (entry.required) {
    return true;
  }

  // Check for developer override
  if (id in enabledOverrides) {
    return enabledOverrides[id];
  }

  // Default to entry's enabled state
  return entry.enabled;
}

/**
 * Enable or disable a data source (developer only)
 */
export async function setAccessEnabled(id: string, enabled: boolean): Promise<boolean> {
  const entry = COACH_ACCESS_REGISTRY[id];

  if (!entry) {
    console.error(`[CoachAccessRegistry] Cannot set unknown entry: ${id}`);
    return false;
  }

  if (entry.required && !enabled) {
    console.error(`[CoachAccessRegistry] Cannot disable required entry: ${id}`);
    return false;
  }

  enabledOverrides[id] = enabled;
  await saveOverrides();

  logAccess(id, 'write', `${enabled ? 'Enabled' : 'Disabled'} by developer`);
  return true;
}

/**
 * Reset all overrides to defaults
 */
export async function resetToDefaults(): Promise<void> {
  enabledOverrides = {};
  await AsyncStorage.removeItem(STORAGE_KEY);
  console.log('[CoachAccessRegistry] Reset to defaults');
}

// ============================================
// LOGGING
// ============================================

function logAccess(id: string, action: 'read' | 'write' | 'trigger', data?: string): void {
  if (!__DEV__) return; // Only log in dev mode

  accessLogs.unshift({
    id,
    timestamp: new Date(),
    action,
    data,
  });

  // Keep last 200 entries
  if (accessLogs.length > 200) {
    accessLogs = accessLogs.slice(0, 200);
  }

  // Save async
  AsyncStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(accessLogs)).catch(() => {});
}

/**
 * Log when AI accesses data (for debugging)
 */
export function logDataAccess(id: string, data?: string): void {
  if (isAccessAllowed(id)) {
    logAccess(id, 'read', data);
  }
}

/**
 * Log when AI triggers an action
 */
export function logActionTrigger(id: string, data?: string): void {
  if (isAccessAllowed(id)) {
    logAccess(id, 'trigger', data);
  }
}

/**
 * Get recent access logs
 */
export function getAccessLogs(limit: number = 50): AccessLog[] {
  return accessLogs.slice(0, limit);
}

/**
 * Clear access logs
 */
export async function clearAccessLogs(): Promise<void> {
  accessLogs = [];
  await AsyncStorage.removeItem(ACCESS_LOG_KEY);
}

// ============================================
// HELPERS
// ============================================

async function saveOverrides(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabledOverrides));
  } catch (error) {
    console.error('[CoachAccessRegistry] Save failed:', error);
  }
}

/**
 * Get all entries by category
 */
export function getEntriesByCategory(category: AccessCategory): AccessEntry[] {
  return Object.values(COACH_ACCESS_REGISTRY)
    .filter(entry => entry.category === category)
    .map(entry => ({
      ...entry,
      enabled: isAccessAllowed(entry.id),
    }));
}

/**
 * Get summary for admin UI
 */
export function getRegistrySummary(): {
  total: number;
  enabled: number;
  disabled: number;
  required: number;
  byCategory: Record<AccessCategory, number>;
} {
  const entries = Object.values(COACH_ACCESS_REGISTRY);
  const enabled = entries.filter(e => isAccessAllowed(e.id)).length;

  const byCategory: Record<AccessCategory, number> = {
    core: 0,
    user_data: 0,
    tracking: 0,
    health: 0,
    context: 0,
    therapeutic: 0,
    actions: 0,
  };

  for (const entry of entries) {
    byCategory[entry.category]++;
  }

  return {
    total: entries.length,
    enabled,
    disabled: entries.length - enabled,
    required: entries.filter(e => e.required).length,
    byCategory,
  };
}

/**
 * Get all entries with current enabled state
 */
export function getAllEntries(): Array<AccessEntry & { currentlyEnabled: boolean }> {
  return Object.values(COACH_ACCESS_REGISTRY).map(entry => ({
    ...entry,
    currentlyEnabled: isAccessAllowed(entry.id),
  }));
}

/**
 * Generate prompt describing what AI can access (for debugging)
 */
export function generateAccessPrompt(): string {
  const lines = ['AI Coach has access to:'];

  const categories: Record<AccessCategory, string> = {
    core: 'Core',
    user_data: 'User Data',
    tracking: 'Tracking',
    health: 'Health',
    context: 'Context',
    therapeutic: 'Therapeutic',
    actions: 'Actions',
  };

  for (const [cat, label] of Object.entries(categories)) {
    const entries = getEntriesByCategory(cat as AccessCategory)
      .filter(e => e.enabled);

    if (entries.length > 0) {
      lines.push(`\n${label}:`);
      for (const entry of entries) {
        lines.push(`- ${entry.name}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================
// DEBUG
// ============================================

export function debugPrintRegistry(): void {
  console.log('\n========== COACH ACCESS REGISTRY ==========');
  const summary = getRegistrySummary();
  console.log(`Total: ${summary.total} | Enabled: ${summary.enabled} | Required: ${summary.required}`);
  console.log('\nBy Category:');
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log('\nRecent Access:');
  for (const log of accessLogs.slice(0, 5)) {
    console.log(`  [${log.action}] ${log.id} - ${log.data || ''}`);
  }
  console.log('=============================================\n');
}

// ============================================
// EXPORT
// ============================================

export default {
  // Init
  initializeAccessRegistry,

  // Access control
  isAccessAllowed,
  setAccessEnabled,
  resetToDefaults,

  // Logging
  logDataAccess,
  logActionTrigger,
  getAccessLogs,
  clearAccessLogs,

  // Helpers
  getEntriesByCategory,
  getRegistrySummary,
  getAllEntries,
  generateAccessPrompt,

  // Debug
  debugPrintRegistry,

  // Registry
  COACH_ACCESS_REGISTRY,
};
