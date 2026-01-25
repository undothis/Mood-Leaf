/**
 * Pixel Hunt Game
 * Find subtle differences in two retro pixel scenes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PixelHuntScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pixel Hunt</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={[styles.comingSoon, { color: colors.text }]}>Coming Soon</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Find subtle differences in two retro pixel scenes
        </Text>
        <Text style={[styles.benefit, { color: colors.tint }]}>
          Builds: Attention to detail, visual processing
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/games')}
        >
          <Text style={styles.buttonText}>Browse Other Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  benefit: {
    fontSize: 14,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
