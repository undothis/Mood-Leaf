/**
 * Skill Badges Component
 *
 * Displays skill badges around the tree as floating decorations.
 * Shows user's enabled skills with their progress level.
 *
 * Following Mood Leaf Ethics:
 * - Celebrates progress without pressure
 * - Visual representation of growth
 * - Not gamification for addiction
 *
 * Unit: Tree Skill Badges
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Skill,
  SkillProgress,
  getSkillsWithEnabledState,
} from '@/services/skillsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Storage key for badge visibility preference
const BADGE_VISIBILITY_KEY = 'moodleaf_skill_badges_visible';

interface SkillBadgeData {
  skill: Skill;
  progress: SkillProgress;
  enabled: boolean;
}

interface SkillBadgesProps {
  onBadgePress?: (skill: Skill) => void;
  maxBadges?: number;
}

/**
 * Get badge visibility preference
 */
export async function getBadgeVisibility(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(BADGE_VISIBILITY_KEY);
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

/**
 * Set badge visibility preference
 */
export async function setBadgeVisibility(visible: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BADGE_VISIBILITY_KEY, visible.toString());
  } catch (error) {
    console.error('Failed to save badge visibility:', error);
  }
}

/**
 * Individual floating badge
 */
const FloatingBadge: React.FC<{
  skill: Skill;
  progress: SkillProgress;
  position: { x: number; y: number };
  delay: number;
  onPress?: () => void;
}> = ({ skill, progress, position, delay, onPress }) => {
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Fade in with delay
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });

      // Start floating animation
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, floatY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Calculate level display (filled dots)
  const levelDots = [];
  for (let i = 0; i < skill.maxLevel; i++) {
    levelDots.push(i < progress.level);
  }

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        { left: position.x, top: position.y },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.badge}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.badgeEmoji}>{skill.emoji}</Text>
        <View style={styles.levelDots}>
          {levelDots.map((filled, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                filled ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Skill Badges container
 */
export const SkillBadges: React.FC<SkillBadgesProps> = ({
  onBadgePress,
  maxBadges = 6,
}) => {
  const [badges, setBadges] = useState<SkillBadgeData[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Check visibility preference
      const isVisible = await getBadgeVisibility();
      setVisible(isVisible);

      if (!isVisible) return;

      // Load enabled skills with progress
      const skills = await getSkillsWithEnabledState(false); // TODO: Get premium status

      // Filter to enabled skills that have been used at least once
      const usedSkills = skills.filter(
        (s) => s.enabled && s.progress.timesUsed > 0
      );

      // Sort by most recently used and take top badges
      const sorted = usedSkills.sort((a, b) => {
        const aDate = a.progress.lastUsed ? new Date(a.progress.lastUsed).getTime() : 0;
        const bDate = b.progress.lastUsed ? new Date(b.progress.lastUsed).getTime() : 0;
        return bDate - aDate;
      });

      setBadges(sorted.slice(0, maxBadges));
    };

    loadData();
  }, [maxBadges]);

  if (!visible || badges.length === 0) {
    return null;
  }

  // Calculate positions around the tree (semi-circle arrangement)
  const getPosition = (index: number, total: number) => {
    // Spread badges in an arc around the tree
    const baseX = SCREEN_WIDTH / 2 - 25; // Center, offset for badge width
    const baseY = 120; // Start height
    const radius = 100; // Distance from center

    // Distribute in arc from left to right
    const angleStart = Math.PI * 0.7; // Start angle (upper left)
    const angleEnd = Math.PI * 0.3; // End angle (upper right)
    const angleStep = (angleStart - angleEnd) / Math.max(1, total - 1);
    const angle = angleStart - (index * angleStep);

    return {
      x: baseX + Math.cos(angle) * radius * (1 + index * 0.1),
      y: baseY + Math.sin(angle) * radius * 0.5 + (index % 2) * 30,
    };
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {badges.map((item, index) => (
        <FloatingBadge
          key={item.skill.id}
          skill={item.skill}
          progress={item.progress}
          position={getPosition(index, badges.length)}
          delay={index * 150}
          onPress={() => onBadgePress?.(item.skill)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  badgeContainer: {
    position: 'absolute',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 50,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  levelDots: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotFilled: {
    backgroundColor: '#8FAE8B', // sage
  },
  dotEmpty: {
    backgroundColor: '#E8E0D5', // sand
  },
});

export default SkillBadges;
