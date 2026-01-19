import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  DailySummary,
  LifestyleFactors,
  TRACKABLE_FACTORS,
  getTodayDateString,
} from '@/types/DailySummary';
import {
  getFactors,
  saveFactors,
  getRecentSummaries,
} from '@/services/patternService';

/**
 * Insights Tab - Pattern Visualization
 *
 * Following Moodling Ethics:
 * - Descriptive patterns, NOT diagnostic
 * - "You might notice..." language
 * - User knows themselves best
 *
 * Unit 10: Pattern data model + Quick Log
 * Unit 11 will add: Pattern visualization
 * Unit 12 will add: Correlation engine
 */
export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [factors, setFactors] = useState<LifestyleFactors>({});
  const [recentDays, setRecentDays] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount and focus
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = getTodayDateString();
      const [todayFactors, summaries] = await Promise.all([
        getFactors(today),
        getRecentSummaries(7),
      ]);
      setFactors(todayFactors);
      setRecentDays(summaries);
    } catch (error) {
      console.error('Failed to load insights data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle factor adjustment
  const adjustFactor = async (key: keyof LifestyleFactors, delta: number) => {
    const current = (factors[key] as number) || 0;
    const config = TRACKABLE_FACTORS.find((f) => f.key === key);
    if (!config) return;

    const newValue = Math.max(0, Math.min(config.max, current + delta));
    const newFactors = { ...factors, [key]: newValue };
    setFactors(newFactors);

    const today = getTodayDateString();
    await saveFactors(today, newFactors);
  };

  // Format factor display value
  const formatValue = (key: keyof LifestyleFactors, value: number | undefined) => {
    const config = TRACKABLE_FACTORS.find((f) => f.key === key);
    if (!config || value === undefined) return '0';
    return `${value}${config.unit}`;
  };

  // Calculate week stats
  const weekStats = {
    entries: recentDays.reduce((sum, d) => sum + d.entryCount, 0),
    daysWithEntries: recentDays.filter((d) => d.entryCount > 0).length,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Patterns you might notice
        </Text>
      </View>

      {/* Quick Log Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Log (optional)
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Track what matters to you
        </Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.tint} />
        ) : (
          <View style={styles.factorList}>
            {TRACKABLE_FACTORS.map((factor) => (
              <View key={factor.key} style={styles.factorRow}>
                <View style={styles.factorLabel}>
                  <Text style={styles.factorEmoji}>{factor.emoji}</Text>
                  <Text style={[styles.factorName, { color: colors.text }]}>
                    {factor.label}
                  </Text>
                </View>
                <View style={styles.factorControls}>
                  <TouchableOpacity
                    style={[styles.factorButton, { backgroundColor: colors.background }]}
                    onPress={() => adjustFactor(factor.key, -factor.step)}
                  >
                    <Text style={[styles.factorButtonText, { color: colors.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.factorValue, { color: colors.text }]}>
                    {formatValue(factor.key, factors[factor.key] as number)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.factorButton, { backgroundColor: colors.background }]}
                    onPress={() => adjustFactor(factor.key, factor.step)}
                  >
                    <Text style={[styles.factorButtonText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.factorHint, { color: colors.textMuted }]}>
          This helps Moodling notice patterns over time.
        </Text>
      </View>

      {/* Week at a Glance */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          This Week
        </Text>

        <View style={styles.weekStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tint }]}>
              {weekStats.entries}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              entries
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tint }]}>
              {weekStats.daysWithEntries}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              days journaled
            </Text>
          </View>
        </View>

        {/* Mini mood calendar */}
        <View style={styles.moodCalendar}>
          {recentDays.map((day) => {
            const emoji = getMoodEmoji(day);
            return (
              <View key={day.date} style={styles.dayCell}>
                <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                  {getDayAbbr(day.date)}
                </Text>
                <Text style={styles.dayEmoji}>{emoji}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Placeholder for future visualization */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Patterns
        </Text>
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
          Charts and correlations coming in Unit 11-12
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          These are observations, not diagnoses.{'\n'}
          You know yourself best.
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper: Get mood emoji for a day
function getMoodEmoji(day: DailySummary): string {
  if (day.entryCount === 0) return '·';
  switch (day.moodCategory) {
    case 'very_positive':
      return '😊';
    case 'positive':
      return '🙂';
    case 'slightly_positive':
      return '🌤️';
    case 'neutral':
      return '😐';
    case 'slightly_negative':
      return '🌧️';
    case 'negative':
      return '😔';
    case 'very_negative':
      return '😢';
    default:
      return '·';
  }
}

// Helper: Get day abbreviation
function getDayAbbr(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  factorList: {
    gap: 12,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorEmoji: {
    fontSize: 20,
  },
  factorName: {
    fontSize: 15,
  },
  factorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  factorValue: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  factorHint: {
    marginTop: 16,
    fontSize: 13,
    fontStyle: 'italic',
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  moodCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  dayEmoji: {
    fontSize: 20,
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  disclaimer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
