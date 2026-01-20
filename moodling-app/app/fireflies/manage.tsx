/**
 * Fireflies Manager
 *
 * Screen for customizing Fireflies categories.
 * Users can:
 * - Enable/disable preset categories
 * - Create custom categories with AI-generated wisdoms
 * - Edit/delete custom categories
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  PRESET_CATEGORIES,
  CustomCategory,
  getEnabledPresets,
  togglePreset,
  getCustomCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  regenerateWisdoms,
} from '@/services/firefliesService';

// Common emojis for quick selection
const COMMON_EMOJIS = [
  '🌟', '💫', '✨', '🌙', '☀️', '🌈', '🦋', '🌸',
  '🌊', '🔥', '💎', '🎯', '💪', '🧘', '🎨', '🎵',
  '📚', '💭', '🌱', '🍃', '🌻', '⭐', '💝', '🕊️',
  '🌺', '🦄', '🐝', '🌴', '🏔️', '🌅', '🎭', '🔮',
];

export default function FirefliesManagerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [enabledPresets, setEnabledPresets] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [description, setDescription] = useState('');

  // Preset picker state
  const [showPresets, setShowPresets] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [presets, custom] = await Promise.all([
        getEnabledPresets(),
        getCustomCategories(),
      ]);
      setEnabledPresets(presets);
      setCustomCategories(custom);
    } catch (error) {
      console.error('Failed to load fireflies data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle preset
  const handleTogglePreset = async (key: string) => {
    try {
      const newPresets = await togglePreset(key);
      setEnabledPresets(newPresets);
    } catch (error) {
      console.error('Failed to toggle preset:', error);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCategory(null);
    setLabel('');
    setEmoji('✨');
    setDescription('');
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (category: CustomCategory) => {
    setEditingCategory(category);
    setLabel(category.label);
    setEmoji(category.emoji);
    setDescription('');
    setShowModal(true);
  };

  // Save category (create or update)
  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Name required', 'Please enter a name for your category');
      return;
    }

    try {
      setIsGenerating(true);

      if (editingCategory) {
        // Update existing (only label and emoji, not wisdoms)
        await updateCustomCategory(editingCategory.id, {
          label: label.trim(),
          emoji,
        });
      } else {
        // Create new with AI-generated wisdoms
        await createCustomCategory(label.trim(), emoji, description.trim() || undefined);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete category
  const handleDelete = (category: CustomCategory) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomCategory(category.id);
              loadData();
            } catch (error) {
              console.error('Failed to delete category:', error);
            }
          },
        },
      ]
    );
  };

  // Regenerate wisdoms
  const handleRegenerate = async (category: CustomCategory) => {
    Alert.alert(
      'Regenerate Wisdoms',
      `Generate new wisdoms for "${category.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            try {
              await regenerateWisdoms(category.id);
              loadData();
              Alert.alert('Done', 'New wisdoms generated!');
            } catch (error) {
              console.error('Failed to regenerate wisdoms:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Customize Fireflies
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Custom categories section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Categories
          </Text>

          {customCategories.length === 0 && !loading ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No custom categories yet. Create one to get personalized wisdoms!
              </Text>
            </View>
          ) : (
            customCategories.map((category) => (
              <View
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <View style={styles.categoryDetails}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.label}
                    </Text>
                    <Text style={[styles.categoryMeta, { color: colors.textMuted }]}>
                      {category.wisdoms.length} wisdoms
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    onPress={() => handleRegenerate(category)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="refresh" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(category)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(category)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add buttons */}
        <View style={styles.addButtons}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={handleCreate}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Create Custom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setShowPresets(true)}
          >
            <Ionicons name="list" size={20} color={colors.text} />
            <Text style={[styles.addButtonText, { color: colors.text }]}>
              Choose Presets
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)} disabled={isGenerating}>
              <Text style={[styles.modalCancel, { color: isGenerating ? colors.textMuted : colors.tint }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isGenerating}>
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.tint }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g., Focus, Gratitude, Calm..."
                placeholderTextColor={colors.textMuted}
                editable={!isGenerating}
              />
            </View>

            {/* Emoji picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Emoji</Text>
              <View style={styles.emojiGrid}>
                {COMMON_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.emojiButton,
                      {
                        backgroundColor: emoji === e ? colors.tint + '30' : colors.card,
                        borderColor: emoji === e ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setEmoji(e)}
                    disabled={isGenerating}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description (for AI context) - only for new categories */}
            {!editingCategory && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Description (optional)
                </Text>
                <Text style={[styles.formHint, { color: colors.textMuted }]}>
                  Help the AI understand what kind of wisdoms you want
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Quotes about staying focused at work, or gentle reminders to take breaks..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  editable={!isGenerating}
                />
              </View>
            )}

            {/* Generating indicator */}
            {isGenerating && (
              <View style={[styles.generatingCard, { backgroundColor: colors.card }]}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.generatingText, { color: colors.text }]}>
                  Generating wisdoms...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Presets Modal */}
      <Modal visible={showPresets} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPresets(false)}>
              <Text style={[styles.modalCancel, { color: colors.tint }]}>Done</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Preset Categories</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.presetsHint, { color: colors.textMuted }]}>
              Enable or disable preset categories. Enabled categories will appear in your Fireflies.
            </Text>

            {PRESET_CATEGORIES.map((preset) => {
              const isEnabled = enabledPresets.includes(preset.key);
              return (
                <View
                  key={preset.key}
                  style={[styles.presetRow, { backgroundColor: colors.card }]}
                >
                  <View style={styles.presetInfo}>
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.presetLabel, { color: colors.text }]}>
                      {preset.label}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleTogglePreset(preset.key)}
                    trackColor={{ false: colors.border, true: colors.tint + '80' }}
                    thumbColor={isEnabled ? colors.tint : '#f4f3f4'}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryMeta: {
    fontSize: 13,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addButtons: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  generatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  generatingText: {
    fontSize: 15,
  },
  // Preset styles
  presetsHint: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  presetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetEmoji: {
    fontSize: 24,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
