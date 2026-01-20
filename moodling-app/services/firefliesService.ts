/**
 * Fireflies Service
 *
 * Manages custom wisdom categories for the Fireflies feature.
 * - Preset categories can be enabled/disabled
 * - Custom categories can be created with AI-generated wisdoms
 *
 * Storage:
 * - User's enabled presets
 * - User's custom categories with their wisdoms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ENABLED_PRESETS: 'fireflies_enabled_presets',
  CUSTOM_CATEGORIES: 'fireflies_custom_categories',
};

// Preset category keys (match CUSTOM_CATEGORIES in WisdomOverlay)
export const PRESET_CATEGORIES = [
  { key: 'anxiety', emoji: '🌊', label: 'Anxiety' },
  { key: 'movement', emoji: '🚶', label: 'Movement' },
  { key: 'creativity', emoji: '🎨', label: 'Creativity' },
  { key: 'music', emoji: '🎵', label: 'Music' },
  { key: 'breath', emoji: '🌬️', label: 'Breath' },
  { key: 'connection', emoji: '🤝', label: 'Connection' },
  { key: 'perspective', emoji: '🔮', label: 'Perspective' },
  { key: 'sleep', emoji: '😴', label: 'Sleep' },
];

// Default enabled presets (all enabled by default)
const DEFAULT_ENABLED_PRESETS = PRESET_CATEGORIES.map((c) => c.key);

export interface CustomCategory {
  id: string;
  emoji: string;
  label: string;
  wisdoms: string[];
  createdAt: string;
}

/**
 * Get enabled preset category keys
 */
export async function getEnabledPresets(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_PRESETS);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_ENABLED_PRESETS;
  } catch (error) {
    console.error('Failed to load enabled presets:', error);
    return DEFAULT_ENABLED_PRESETS;
  }
}

/**
 * Save enabled preset category keys
 */
export async function saveEnabledPresets(presets: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_PRESETS, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save enabled presets:', error);
    throw error;
  }
}

/**
 * Toggle a preset category on/off
 */
export async function togglePreset(key: string): Promise<string[]> {
  const current = await getEnabledPresets();
  const isEnabled = current.includes(key);

  let newPresets: string[];
  if (isEnabled) {
    newPresets = current.filter((k) => k !== key);
  } else {
    newPresets = [...current, key];
  }

  await saveEnabledPresets(newPresets);
  return newPresets;
}

/**
 * Get all custom categories
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load custom categories:', error);
    return [];
  }
}

/**
 * Save custom categories
 */
async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save custom categories:', error);
    throw error;
  }
}

/**
 * Generate wisdoms for a custom category using AI
 * Returns array of 10 wisdoms
 */
export async function generateWisdomsForCategory(
  categoryName: string,
  description?: string
): Promise<string[]> {
  // For now, generate some template wisdoms
  // In production, this would call the Claude API
  const templates = [
    `When ${categoryName.toLowerCase()} feels overwhelming, take a breath.`,
    `What would help with ${categoryName.toLowerCase()} right now?`,
    `${categoryName} is part of your journey. Be gentle with yourself.`,
    `One small step with ${categoryName.toLowerCase()}. What could that be?`,
    `You've handled ${categoryName.toLowerCase()} before. You can handle it again.`,
    `What does ${categoryName.toLowerCase()} need from you right now?`,
    `It's okay to struggle with ${categoryName.toLowerCase()}. Everyone does sometimes.`,
    `What would you tell a friend dealing with ${categoryName.toLowerCase()}?`,
    `${categoryName} doesn't define you. It's just something you're experiencing.`,
    `Tomorrow is another chance to work on ${categoryName.toLowerCase()}.`,
  ];

  return templates;
}

/**
 * Create a new custom category
 */
export async function createCustomCategory(
  label: string,
  emoji: string,
  description?: string
): Promise<CustomCategory> {
  const categories = await getCustomCategories();

  // Generate wisdoms using AI
  const wisdoms = await generateWisdomsForCategory(label, description);

  const newCategory: CustomCategory = {
    id: `custom_${Date.now()}`,
    emoji,
    label,
    wisdoms,
    createdAt: new Date().toISOString(),
  };

  categories.push(newCategory);
  await saveCustomCategories(categories);

  return newCategory;
}

/**
 * Update a custom category
 */
export async function updateCustomCategory(
  id: string,
  updates: Partial<Pick<CustomCategory, 'label' | 'emoji'>>
): Promise<CustomCategory | null> {
  const categories = await getCustomCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  categories[index] = { ...categories[index], ...updates };
  await saveCustomCategories(categories);

  return categories[index];
}

/**
 * Delete a custom category
 */
export async function deleteCustomCategory(id: string): Promise<void> {
  const categories = await getCustomCategories();
  const filtered = categories.filter((c) => c.id !== id);
  await saveCustomCategories(filtered);
}

/**
 * Regenerate wisdoms for a custom category
 */
export async function regenerateWisdoms(id: string): Promise<CustomCategory | null> {
  const categories = await getCustomCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  const category = categories[index];
  const newWisdoms = await generateWisdomsForCategory(category.label);
  categories[index] = { ...category, wisdoms: newWisdoms };

  await saveCustomCategories(categories);
  return categories[index];
}
