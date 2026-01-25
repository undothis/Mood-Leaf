/**
 * Memory Viewer
 *
 * Shows what the coach "remembers" about you from past to present.
 * Displays all memory tiers: short-term, mid-term, and long-term.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getCurrentSession,
  getMidTermMemories,
  getLongTermMemory,
  getFullMemoryState,
  ShortTermMemory,
  MidTermMemory,
  LongTermMemory,
} from '@/services/memoryTierService';
import { getRecentJournalContextForClaude, getAllEntries } from '@/services/journalStorage';
import { getLifeContextForClaude, getLifeContext } from '@/services/lifeContextService';
import { getCognitiveProfileContextForLLM } from '@/services/cognitiveProfileService';
import { getContextForClaude } from '@/services/userContextService';

interface MemoryItem {
  id?: string;
  content: string;
  timestamp: string;
  importance?: number;
  tags?: string[];
}

interface MemorySection {
  title: string;
  subtitle: string;
  data: string | null;
  items?: MemoryItem[];
  expanded: boolean;
  loading: boolean;
  color: string;
}

export default function MemoryViewer() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Record<string, MemorySection>>({
    shortTerm: {
      title: 'Short-Term Memory',
      subtitle: 'Recent conversations (last hour)',
      data: null,
      items: [],
      expanded: true,
      loading: false,
      color: '#4CAF50',
    },
    midTerm: {
      title: 'Mid-Term Memory',
      subtitle: 'Recent patterns (last 24 hours)',
      data: null,
      items: [],
      expanded: false,
      loading: false,
      color: '#2196F3',
    },
    longTerm: {
      title: 'Long-Term Memory',
      subtitle: 'Core knowledge about you',
      data: null,
      items: [],
      expanded: false,
      loading: false,
      color: '#9C27B0',
    },
    profile: {
      title: 'User Profile',
      subtitle: 'Who you are to the coach',
      data: null,
      expanded: false,
      loading: false,
      color: '#FF9800',
    },
    cognitive: {
      title: 'Cognitive Profile',
      subtitle: 'How you think and learn',
      data: null,
      expanded: false,
      loading: false,
      color: '#E91E63',
    },
    lifeContext: {
      title: 'Life Context',
      subtitle: 'Your current life situation',
      data: null,
      expanded: false,
      loading: false,
      color: '#00BCD4',
    },
    journals: {
      title: 'Journal Summaries',
      subtitle: 'What you\'ve written about',
      data: null,
      expanded: false,
      loading: false,
      color: '#795548',
    },
  });

  const [stats, setStats] = useState<{
    shortTermCount: number;
    midTermCount: number;
    longTermCount: number;
    totalMemories: number;
  } | null>(null);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      // Load full memory state
      const memState = await getFullMemoryState();

      // Convert short-term session to items
      const shortTermItems: MemoryItem[] = memState.shortTerm
        ? memState.shortTerm.messages.map((msg, idx) => ({
            id: `short_${idx}`,
            content: `${msg.role}: ${msg.content}`,
            timestamp: memState.shortTerm!.startTime,
            tags: memState.shortTerm!.topics,
          }))
        : [];

      // Convert mid-term memories to items
      const midTermItems: MemoryItem[] = memState.midTerm.map((mem, idx) => ({
        id: mem.id || `mid_${idx}`,
        content: mem.summary,
        timestamp: mem.compressedAt,
        importance: mem.importance,
        tags: mem.topics,
      }));

      // Convert long-term memory to items
      const longTermItems: MemoryItem[] = [];
      if (memState.longTerm.coreTraits?.length > 0) {
        longTermItems.push({
          id: 'traits',
          content: `Core Traits: ${memState.longTerm.coreTraits.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }
      if (memState.longTerm.triggers?.length > 0) {
        longTermItems.push({
          id: 'triggers',
          content: `Triggers: ${memState.longTerm.triggers.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }
      if (memState.longTerm.calmingFactors?.length > 0) {
        longTermItems.push({
          id: 'calming',
          content: `Calming Factors: ${memState.longTerm.calmingFactors.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }
      if (memState.longTerm.relationships?.length > 0) {
        memState.longTerm.relationships.forEach((rel, idx) => {
          longTermItems.push({
            id: `rel_${idx}`,
            content: `${rel.name} (${rel.relationship}): ${rel.notes || 'No notes'}`,
            timestamp: rel.lastMentioned || new Date().toISOString(),
          });
        });
      }

      // Calculate stats
      const memStats = {
        shortTermCount: shortTermItems.length,
        midTermCount: midTermItems.length,
        longTermCount: longTermItems.length,
        totalMemories: shortTermItems.length + midTermItems.length + longTermItems.length,
      };
      setStats(memStats);

      // Load context data
      const [profile, cognitive, lifeCtx, journals] = await Promise.all([
        getContextForClaude().catch(() => ''),
        getCognitiveProfileContextForLLM().catch(() => ''),
        getLifeContextForClaude().catch(() => ''),
        getRecentJournalContextForClaude().catch(() => ''),
      ]);

      setSections(prev => ({
        ...prev,
        shortTerm: {
          ...prev.shortTerm,
          items: shortTermItems,
          data: shortTermItems.length > 0 ? `${shortTermItems.length} recent messages` : null,
        },
        midTerm: {
          ...prev.midTerm,
          items: midTermItems,
          data: midTermItems.length > 0 ? `${midTermItems.length} pattern memories` : null,
        },
        longTerm: {
          ...prev.longTerm,
          items: longTermItems,
          data: longTermItems.length > 0 ? `${longTermItems.length} core memories` : null,
        },
        profile: {
          ...prev.profile,
          data: profile || null,
        },
        cognitive: {
          ...prev.cognitive,
          data: cognitive || null,
        },
        lifeContext: {
          ...prev.lifeContext,
          data: lifeCtx || null,
        },
        journals: {
          ...prev.journals,
          data: journals || null,
        },
      }));
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const toggleSection = (key: string) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key], expanded: !prev[key].expanded },
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderMemoryItems = (items: MemoryItem[], color: string) => {
    if (!items || items.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No memories stored yet. Chat with your coach to build memories.
        </Text>
      );
    }

    return items.slice(0, 10).map((item, index) => (
      <View key={item.id || index} style={[styles.memoryItem, { borderLeftColor: color }]}>
        <View style={styles.memoryHeader}>
          <Text style={[styles.memoryTime, { color: colors.textSecondary }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {item.importance && (
            <View style={[styles.importanceBadge, { backgroundColor: color + '30' }]}>
              <Text style={[styles.importanceText, { color }]}>
                {item.importance}/10
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.memoryContent, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: color + '20' }]}>
                <Text style={[styles.tagText, { color }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    ));
  };

  const renderContextData = (data: string | null, color: string) => {
    if (!data) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No data available yet.
        </Text>
      );
    }

    return (
      <View style={[styles.contextBox, { backgroundColor: color + '10', borderColor: color + '30' }]}>
        <Text style={[styles.contextText, { color: colors.text }]}>
          {data}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading coach memories...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Coach Memory Viewer',
          headerShown: true,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Card */}
        {stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Memory Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {stats.shortTermCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Short</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2196F3' }]}>
                  {stats.midTermCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mid</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#9C27B0' }]}>
                  {stats.longTermCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Long</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {stats.totalMemories}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={styles.infoIcon}>🧠</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            This shows what your coach "remembers" about you. Short-term fades after an hour,
            mid-term after a day. Important things move to long-term memory permanently.
          </Text>
        </View>

        {/* Memory Sections */}
        {Object.entries(sections).map(([key, section]) => (
          <View key={key} style={[styles.section, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(key)}
            >
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {section.subtitle}
                </Text>
              </View>
              <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                {section.expanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {section.expanded && (
              <View style={styles.sectionContent}>
                {section.items ? (
                  renderMemoryItems(section.items as MemoryEntry[], section.color)
                ) : (
                  renderContextData(section.data, section.color)
                )}
              </View>
            )}
          </View>
        ))}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
  },
  sectionContent: {
    padding: 14,
    paddingTop: 0,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  memoryItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memoryTime: {
    fontSize: 11,
  },
  importanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memoryContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  contextBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contextText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
