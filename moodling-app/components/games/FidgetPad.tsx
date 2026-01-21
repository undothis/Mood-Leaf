/**
 * Fidget Pad Game
 *
 * A collection of digital fidget toys for anxiety relief:
 * - Bubble Wrap: Pop satisfying bubbles
 * - Sliders: Slide bars with haptic feedback
 * - Spinner: Flick to spin
 *
 * Works on iOS, Android, and Web.
 *
 * Unit: Games System
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  Vibration,
  PanResponder,
  ScrollView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

type FidgetTool = 'bubbles' | 'sliders' | 'spinner';

interface FidgetPadProps {
  onClose?: () => void;
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (Platform.OS === 'web') return;

  // Simple vibration patterns based on type
  const patterns: Record<string, number> = {
    light: 10,
    medium: 20,
    heavy: 40,
  };

  Vibration.vibrate(patterns[type] || 10);
};

// ============================================
// BUBBLE WRAP COMPONENT
// ============================================

interface BubbleProps {
  id: string;
  isPopped: boolean;
  onPop: (id: string) => void;
}

const Bubble: React.FC<BubbleProps> = ({ id, isPopped, onPop }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePop = useCallback(() => {
    if (isPopped) return;

    hapticFeedback('medium');

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPop(id);
  }, [id, isPopped, onPop, scaleAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePop}
      style={styles.bubbleContainer}
    >
      <Animated.View
        style={[
          styles.bubble,
          isPopped && styles.bubblePopped,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {!isPopped && <View style={styles.bubbleHighlight} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

const BubbleWrap: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const ROWS = 8;
  const COLS = 6;
  const totalBubbles = ROWS * COLS;

  const [poppedBubbles, setPoppedBubbles] = useState<Set<string>>(new Set());

  const handlePop = useCallback((id: string) => {
    setPoppedBubbles((prev) => new Set(prev).add(id));
  }, []);

  const handleReset = useCallback(() => {
    setPoppedBubbles(new Set());
    onReset();
  }, [onReset]);

  const poppedCount = poppedBubbles.size;
  const allPopped = poppedCount === totalBubbles;

  return (
    <View style={styles.bubbleWrapContainer}>
      <Text style={styles.bubbleCount}>
        {poppedCount} / {totalBubbles} popped 🫧
      </Text>

      <View style={styles.bubbleGrid}>
        {Array.from({ length: ROWS }).map((_, row) => (
          <View key={row} style={styles.bubbleRow}>
            {Array.from({ length: COLS }).map((_, col) => {
              const id = `${row}-${col}`;
              return (
                <Bubble
                  key={id}
                  id={id}
                  isPopped={poppedBubbles.has(id)}
                  onPop={handlePop}
                />
              );
            })}
          </View>
        ))}
      </View>

      {allPopped && (
        <View style={styles.resetContainer}>
          <Text style={styles.allPoppedText}>All done! 🎉</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Fresh Wrap</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================
// SLIDERS COMPONENT
// ============================================

interface SliderBarProps {
  color: string;
  initialValue?: number;
}

const SliderBar: React.FC<SliderBarProps> = ({ color, initialValue = 0.5 }) => {
  const [value, setValue] = useState(initialValue);
  const sliderWidth = SCREEN_WIDTH - 80;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        hapticFeedback('light');
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(0, Math.min(1, (gestureState.moveX - 40) / sliderWidth));
        setValue(newValue);

        // Haptic at ends
        if (newValue <= 0.02 || newValue >= 0.98) {
          hapticFeedback('medium');
        }
      },
      onPanResponderRelease: () => {
        hapticFeedback('light');
      },
    })
  ).current;

  return (
    <View style={styles.sliderContainer}>
      <View style={[styles.sliderTrack, { backgroundColor: `${color}30` }]}>
        <View
          style={[
            styles.sliderFill,
            { width: `${value * 100}%`, backgroundColor: color },
          ]}
        />
        <View
          {...panResponder.panHandlers}
          style={[
            styles.sliderThumb,
            {
              left: `${value * 100}%`,
              backgroundColor: color,
              borderColor: `${color}80`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const Sliders: React.FC = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  return (
    <View style={styles.slidersContainer}>
      <Text style={styles.sliderHint}>Slide the bars. Feel the calm. ✨</Text>
      {colors.map((color, index) => (
        <SliderBar
          key={index}
          color={color}
          initialValue={Math.random() * 0.6 + 0.2}
        />
      ))}
    </View>
  );
};

// ============================================
// SPINNER COMPONENT
// ============================================

const Spinner: React.FC = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  const velocity = useRef(0);
  const lastY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        lastY.current = gestureState.y0;
        hapticFeedback('light');
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaY = gestureState.moveY - lastY.current;
        velocity.current = deltaY * 2;
        lastY.current = gestureState.moveY;

        // Update rotation during drag
        rotation.setValue((rotation as any)._value + deltaY);
      },
      onPanResponderRelease: () => {
        hapticFeedback('medium');

        // Continue spinning based on velocity
        const spinDuration = Math.abs(velocity.current) * 50;
        const spinAmount = velocity.current * 10;

        Animated.decay(rotation, {
          velocity: velocity.current / 100,
          deceleration: 0.997,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const spin = rotation.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  return (
    <View style={styles.spinnerContainer}>
      <Text style={styles.spinnerHint}>Flick to spin 🌀</Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.spinner, { transform: [{ rotate: spin }] }]}
      >
        <View style={styles.spinnerCenter} />
        <View style={[styles.spinnerArm, styles.spinnerArm1]} />
        <View style={[styles.spinnerArm, styles.spinnerArm2]} />
        <View style={[styles.spinnerArm, styles.spinnerArm3]} />
      </Animated.View>
    </View>
  );
};

// ============================================
// MAIN FIDGET PAD COMPONENT
// ============================================

export const FidgetPad: React.FC<FidgetPadProps> = ({ onClose }) => {
  const [activeTool, setActiveTool] = useState<FidgetTool>('bubbles');
  const [bubbleResetKey, setBubbleResetKey] = useState(0);

  const tools: { id: FidgetTool; emoji: string; name: string }[] = [
    { id: 'bubbles', emoji: '🔵', name: 'Bubbles' },
    { id: 'sliders', emoji: '📊', name: 'Sliders' },
    { id: 'spinner', emoji: '🌀', name: 'Spinner' },
  ];

  const handleBubbleReset = useCallback(() => {
    setBubbleResetKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔘 Fidget Pad</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tool Selector */}
      <View style={styles.toolSelector}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              activeTool === tool.id && styles.toolButtonActive,
            ]}
            onPress={() => {
              hapticFeedback('light');
              setActiveTool(tool.id);
            }}
          >
            <Text style={styles.toolEmoji}>{tool.emoji}</Text>
            <Text
              style={[
                styles.toolName,
                activeTool === tool.id && styles.toolNameActive,
              ]}
            >
              {tool.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Tool */}
      <View style={styles.toolArea}>
        {activeTool === 'bubbles' && (
          <BubbleWrap key={bubbleResetKey} onReset={handleBubbleReset} />
        )}
        {activeTool === 'sliders' && <Sliders />}
        {activeTool === 'spinner' && <Spinner />}
      </View>

      {/* Footer hint */}
      <Text style={styles.footerHint}>
        Take your time. There's no goal here. Just calm.
      </Text>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#888',
  },

  // Tool Selector
  toolSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#252545',
    minWidth: 80,
  },
  toolButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  toolEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  toolName: {
    fontSize: 12,
    color: '#888',
  },
  toolNameActive: {
    color: '#1A1A2E',
    fontWeight: '600',
  },

  // Tool Area
  toolArea: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Bubble Wrap
  bubbleWrapContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bubbleCount: {
    fontSize: 16,
    color: '#4ECDC4',
    marginBottom: 15,
  },
  bubbleGrid: {
    alignItems: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleContainer: {
    padding: 4,
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bubblePopped: {
    backgroundColor: '#252545',
    shadowOpacity: 0,
    elevation: 0,
  },
  bubbleHighlight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    top: 8,
    left: 8,
  },
  resetContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  allPoppedText: {
    fontSize: 20,
    color: '#4ECDC4',
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '600',
  },

  // Sliders
  slidersContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  sliderHint: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    height: 50,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 20,
    borderRadius: 10,
    overflow: 'visible',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 10,
  },
  sliderThumb: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    top: -8,
    marginLeft: -18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Spinner
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerHint: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  spinner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#252545',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4ECDC4',
  },
  spinnerCenter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4ECDC4',
    position: 'absolute',
  },
  spinnerArm: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
  },
  spinnerArm1: {
    top: 20,
    transform: [{ translateY: 0 }],
  },
  spinnerArm2: {
    bottom: 25,
    left: 25,
    backgroundColor: '#45B7D1',
  },
  spinnerArm3: {
    bottom: 25,
    right: 25,
    backgroundColor: '#96CEB4',
  },

  // Footer
  footerHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

export default FidgetPad;
