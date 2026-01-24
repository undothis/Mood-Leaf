/**
 * Coach Access Registry Settings
 *
 * Control what data sources the AI coach can access.
 * Following Mood Leaf Ethics:
 * - User has full control over AI data access
 * - Transparency about what data is used
 * - Easy to toggle sources on/off
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getAccessRegistry,
  toggleSource,
  toggleGlobalAccess,
  getSourcesByCategory,
  CoachAccessRegistry,
  DataSource,
  AccessCategory,
  CATEGORY_LABELS,
} from '@/services/coachAccessRegistry';

// Category emojis for visual clarity
const CATEGORY_EMOJIS: Record<AccessCategory, string> = {
  core_user_data: '👤',
  context_memories: '🧠',
  tracking: '📊',
  health: '💚',
  calendar: '📅',
  social: '👥',
  location: '📍',
  therapeutic: '🌱',
  communication_style: '💬',
  diagnostics: '🔧',
};

export default function CoachAccessSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<CoachAccessRegistry | null>(null);
  const [sourcesByCategory, setSourcesByCategory] = useState<Record<AccessCategory, DataSource[]> | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [loadedRegistry, loadedSources] = await Promise.all([
        getAccessRegistry(),
        getSourcesByCategory(),
      ]);

      setRegistry(loadedRegistry);
      setSourcesByCategory(loadedSources);

      // Expand categories that have disabled sources (so user can see what's off)
      const expanded: Record<string, boolean> = {};
      for (const [category, sources] of Object.entries(loadedSources)) {
        const hasDisabled = sources.some(s => !s.enabled);
        expanded[category] = hasDisabled;
      }
      setExpandedCategories(expanded);
    } catch (error) {
      console.error('Error loading coach access settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle global toggle
  const handleGlobalToggle = async (enabled: boolean) => {
    if (!registry) return;
    await toggleGlobalAccess(enabled);
    setRegistry({ ...registry, globalEnabled: enabled });
  };

  // Handle source toggle
  const handleSourceToggle = async (sourceId: string, enabled: boolean) => {
    if (!registry || !sourcesByCategory) return;

    // Don't allow disabling safety services
    if (['core_principles', 'safeguards'].includes(sourceId) && !enabled) {
      return;
    }

    await toggleSource(sourceId, enabled);

    // Update local state
    const updatedSources = registry.sources.map(s =>
      s.id === sourceId ? { ...s, enabled } : s
    );
    setRegistry({ ...registry, sources: updatedSources });

    // Update category sources
    const updatedByCategory = { ...sourcesByCategory };
    for (const category of Object.keys(updatedByCategory) as AccessCategory[]) {
      updatedByCategory[category] = updatedByCategory[category].map(s =>
        s.id === sourceId ? { ...s, enabled } : s
      );
    }
    setSourcesByCategory(updatedByCategory);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Count enabled sources in a category
  const getCategoryStats = (sources: DataSource[]) => {
    const enabled = sources.filter(s => s.enabled).length;
    return { enabled, total: sources.length };
  };

  if (loading || !registry || !sourcesByCategory) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading access settings...
        </Text>
      </View>
    );
  }

  const enabledCount = registry.sources.filter(s => s.enabled).length;
  const totalCount = registry.sources.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Data Access',
          headerBackTitle: 'Settings',
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Master Toggle */}
        <View style={[styles.masterCard, { backgroundColor: colors.card }]}>
          <View style={styles.masterHeader}>
            <View style={styles.masterInfo}>
              <Text style={[styles.masterTitle, { color: colors.text }]}>
                AI Coach Access
              </Text>
              <Text style={[styles.masterSubtitle, { color: colors.textSecondary }]}>
                {registry.globalEnabled
                  ? `${enabledCount} of ${totalCount} data sources active`
                  : 'All AI data access is disabled'}
              </Text>
            </View>
            <Switch
              value={registry.globalEnabled}
              onValueChange={handleGlobalToggle}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>

          {!registry.globalEnabled && (
            <View style={[styles.warningBanner, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.warningText, { color: colors.error }]}>
                Your AI coach has no access to your data. Conversations will be generic without personalization.
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Control exactly what information your AI coach can use. Toggle individual data sources on or off. Your preferences are saved automatically.
        </Text>

        {/* Categories */}
        {(Object.entries(sourcesByCategory) as [AccessCategory, DataSource[]][])
          .filter(([_, sources]) => sources.length > 0)
          .map(([category, sources]) => {
            const stats = getCategoryStats(sources);
            const isExpanded = expandedCategories[category];
            const emoji = CATEGORY_EMOJIS[category];
            const label = CATEGORY_LABELS[category];

            return (
              <View
                key={category}
                style={[styles.categoryCard, { backgroundColor: colors.card }]}
              >
                {/* Category Header */}
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={styles.categoryEmoji}>{emoji}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryTitle, { color: colors.text }]}>
                      {label}
                    </Text>
                    <Text style={[styles.categoryStats, { color: colors.textSecondary }]}>
                      {stats.enabled} of {stats.total} enabled
                    </Text>
                  </View>
                  <Text style={[styles.categoryArrow, { color: colors.textSecondary }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </Pressable>

                {/* Expanded Sources */}
                {isExpanded && (
                  <View style={styles.sourcesList}>
                    {sources.map((source) => {
                      const isSafetySource = ['core_principles', 'safeguards'].includes(source.id);

                      return (
                        <View
                          key={source.id}
                          style={[
                            styles.sourceRow,
                            { borderTopColor: colors.border },
                          ]}
                        >
                          <View style={styles.sourceInfo}>
                            <Text style={[styles.sourceName, { color: colors.text }]}>
                              {source.name}
                              {isSafetySource && (
                                <Text style={[styles.requiredBadge, { color: colors.tint }]}>
                                  {' '}(Required)
                                </Text>
                              )}
                            </Text>
                            <Text style={[styles.sourceDescription, { color: colors.textSecondary }]}>
                              {source.description}
                            </Text>
                            {source.requiresPermission && !source.permissionGranted && (
                              <Text style={[styles.permissionNote, { color: colors.warning }]}>
                                Requires device permission
                              </Text>
                            )}
                          </View>
                          <Switch
                            value={source.enabled}
                            onValueChange={(value) => handleSourceToggle(source.id, value)}
                            trackColor={{ false: colors.border, true: colors.tint }}
                            thumbColor="#fff"
                            disabled={!registry.globalEnabled || isSafetySource}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

        {/* Privacy Note */}
        <View style={[styles.privacyCard, { backgroundColor: colors.card }]}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <View style={styles.privacyInfo}>
            <Text style={[styles.privacyTitle, { color: colors.text }]}>
              Privacy First
            </Text>
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              All your data stays on your device. When you chat with the coach, only conversation context is sent to Claude's API — and it's never stored. Toggling sources off here means that data won't be included in coach conversations.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  masterCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterInfo: {
    flex: 1,
    marginRight: 16,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  masterSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryStats: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  sourcesList: {
    paddingBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceInfo: {
    flex: 1,
    marginRight: 12,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  requiredBadge: {
    fontSize: 12,
    fontWeight: '400',
  },
  sourceDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  permissionNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  privacyCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
