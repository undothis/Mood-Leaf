/**
 * Skills Management Screen
 *
 * Allows users to:
 * - View all skills and their progress
 * - Enable/disable skills they want to use
 * - See skill details and stats
 *
 * Following Mood Leaf Ethics:
 * - User has full control over their experience
 * - No pressure to enable all skills
 * - Skills build real capabilities
 *
 * Unit: Skills Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  SKILLS,
  SKILL_CATEGORIES,
  Skill,
  SkillCategory,
  SkillProgress,
  getSkillsWithEnabledState,
  toggleSkillEnabled,
} from '@/services/skillsService';

interface SkillItemData {
  skill: Skill;
  progress: SkillProgress;
  enabled: boolean;
  isLocked: boolean;
}

export default function SkillsManageScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [skills, setSkills] = useState<SkillItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false); // TODO: Get from subscription service

  // Load skills data
  const loadSkills = useCallback(async () => {
    try {
      const skillsData = await getSkillsWithEnabledState(isPremium);
      setSkills(skillsData);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // Handle toggle
  const handleToggle = async (skillId: string) => {
    const skill = skills.find((s) => s.skill.id === skillId);
    if (!skill || skill.isLocked) return;

    try {
      const newEnabled = await toggleSkillEnabled(skillId);
      setSkills((prev) =>
        prev.map((s) =>
          s.skill.id === skillId ? { ...s, enabled: newEnabled } : s
        )
      );
    } catch (error) {
      console.error('Failed to toggle skill:', error);
    }
  };

  // Group skills by category
  const skillsByCategory: Record<SkillCategory, SkillItemData[]> = {
    mindfulness: [],
    coping: [],
    growth: [],
    social: [],
    advanced: [],
  };

  skills.forEach((item) => {
    skillsByCategory[item.skill.category].push(item);
  });

  // Count enabled skills
  const enabledCount = skills.filter((s) => s.enabled).length;
  const totalCount = skills.filter((s) => !s.isLocked).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Manage Skills
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Active Skills
          </Text>
          <Text style={[styles.summaryValue, { color: colors.tint }]}>
            {enabledCount}/{totalCount}
          </Text>
        </View>
        <Text style={[styles.summaryHint, { color: colors.textMuted }]}>
          Enable the skills you want to practice. Disabled skills won't appear in menus.
        </Text>
      </View>

      {/* Skills List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(SKILL_CATEGORIES).map(([categoryId, categoryInfo]) => {
          const categorySkills = skillsByCategory[categoryId as SkillCategory];
          if (categorySkills.length === 0) return null;

          return (
            <View key={categoryId} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {categoryInfo.name}
                </Text>
              </View>

              {categorySkills.map((item) => (
                <View
                  key={item.skill.id}
                  style={[
                    styles.skillCard,
                    { backgroundColor: colors.card },
                    item.isLocked && styles.skillCardLocked,
                  ]}
                >
                  <View style={styles.skillInfo}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillEmoji}>{item.skill.emoji}</Text>
                      <Text style={[styles.skillName, { color: colors.text }]}>
                        {item.skill.name}
                      </Text>
                      {item.isLocked && (
                        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                      )}
                    </View>

                    <Text
                      style={[styles.skillDescription, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {item.skill.description}
                    </Text>

                    {/* Progress info */}
                    <View style={styles.progressRow}>
                      <Text style={[styles.progressText, { color: colors.textMuted }]}>
                        Level {item.progress.level}/{item.skill.maxLevel}
                      </Text>
                      <Text style={[styles.progressText, { color: colors.textMuted }]}>
                        {item.progress.timesUsed} uses
                      </Text>
                      {item.progress.lastUsed && (
                        <Text style={[styles.progressText, { color: colors.textMuted }]}>
                          Last: {new Date(item.progress.lastUsed).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Toggle Switch */}
                  <View style={styles.toggleContainer}>
                    <Switch
                      value={item.enabled}
                      onValueChange={() => handleToggle(item.skill.id)}
                      disabled={item.isLocked}
                      trackColor={{
                        false: colors.border,
                        true: colors.tint,
                      }}
                      thumbColor={item.enabled ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Premium upsell */}
        {!isPremium && (
          <View style={[styles.premiumCard, { backgroundColor: colors.card }]}>
            <Ionicons name="star" size={24} color={colors.warning} />
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              Unlock All Skills
            </Text>
            <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
              Premium unlocks {skills.filter((s) => s.isLocked).length} additional skills
              with advanced exercises and techniques.
            </Text>
            <TouchableOpacity
              style={[styles.premiumButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/settings' as any)}
            >
              <Text style={styles.premiumButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  summaryHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  skillCardLocked: {
    opacity: 0.6,
  },
  skillInfo: {
    flex: 1,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  skillEmoji: {
    fontSize: 18,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '500',
  },
  skillDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressText: {
    fontSize: 11,
  },
  toggleContainer: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  premiumCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  premiumText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  premiumButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
