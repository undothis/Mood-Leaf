/**
 * Voice Settings Screen
 *
 * Configure text-to-speech for coach responses.
 * Users can enable/disable voice, choose gender, and test voices.
 *
 * Unit: Voice Output Settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  getTTSSettings,
  updateTTSSettings,
  hasTTSAPIKey,
  setTTSAPIKey,
  testTTS,
  TTSSettings,
  VoiceGender,
} from '@/services/textToSpeechService';
import {
  getCoachSettings,
  PERSONAS,
  CoachPersona,
} from '@/services/coachPersonalityService';
// Simple value control component to replace external Slider dependency
const ValueControl = ({
  value,
  min,
  max,
  step,
  onValueChange,
  tintColor,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  tintColor: string;
}) => {
  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(newValue);
  };
  const increase = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(newValue);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={decrease}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: tintColor + '30',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20, color: tintColor }}>-</Text>
      </TouchableOpacity>
      <View
        style={{
          flex: 1,
          height: 6,
          backgroundColor: '#333',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            height: '100%',
            backgroundColor: tintColor,
          }}
        />
      </View>
      <TouchableOpacity
        onPress={increase}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: tintColor + '30',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20, color: tintColor }}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function VoiceSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [settings, setSettings] = useState<TTSSettings | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<CoachPersona>('clover');
  const [isTesting, setIsTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadError(false);
      const [ttsSettings, keyExists, coachSettings] = await Promise.all([
        getTTSSettings(),
        hasTTSAPIKey(),
        getCoachSettings(),
      ]);
      setSettings(ttsSettings);
      setHasKey(keyExists);
      setCurrentPersona(coachSettings.selectedPersona);
    } catch (error) {
      console.error('Failed to load voice settings:', error);
      setLoadError(true);
      Alert.alert('Error', 'Failed to load voice settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const updated = await updateTTSSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  const handleToggleAutoPlay = async () => {
    if (!settings) return;
    const updated = await updateTTSSettings({ autoPlay: !settings.autoPlay });
    setSettings(updated);
  };

  const handleGenderChange = async (gender: VoiceGender) => {
    if (!settings) return;
    const updated = await updateTTSSettings({ voiceGender: gender });
    setSettings(updated);
  };

  const handleSpeedChange = async (speed: number) => {
    if (!settings) return;
    const updated = await updateTTSSettings({ speakingRateMultiplier: speed });
    setSettings(updated);
  };

  const handleVolumeChange = async (volume: number) => {
    if (!settings) return;
    const updated = await updateTTSSettings({ volume });
    setSettings(updated);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    await setTTSAPIKey(apiKeyInput.trim());
    setHasKey(true);
    setShowApiKeyInput(false);
    setApiKeyInput('');
    Alert.alert('Success', 'Google Cloud TTS API key saved');
  };

  const handleTestVoice = async () => {
    if (!hasKey) {
      Alert.alert('No API Key', 'Please add your Google Cloud TTS API key first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testTTS(currentPersona, settings?.voiceGender || 'female');
      if (!result.success) {
        Alert.alert('Test Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Test Failed', 'Could not play test audio');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  const persona = PERSONAS[currentPersona];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Voice Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Enable Voice */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Voice
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {persona.name} will speak responses aloud
              </Text>
            </View>
            <Switch
              value={settings?.enabled ?? false}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.tint }}
            />
          </View>

          {settings?.enabled && (
            <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto-Play
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Automatically speak each response
                </Text>
              </View>
              <Switch
                value={settings?.autoPlay ?? true}
                onValueChange={handleToggleAutoPlay}
                trackColor={{ false: colors.border, true: colors.tint }}
              />
            </View>
          )}
        </View>

        {/* Voice Gender */}
        {settings?.enabled && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Voice Gender
            </Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  settings.voiceGender === 'female' && { backgroundColor: colors.tint },
                  { borderColor: colors.border },
                ]}
                onPress={() => handleGenderChange('female')}
              >
                <Text style={[
                  styles.genderButtonText,
                  { color: settings.voiceGender === 'female' ? '#FFFFFF' : colors.text },
                ]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  settings.voiceGender === 'male' && { backgroundColor: colors.tint },
                  { borderColor: colors.border },
                ]}
                onPress={() => handleGenderChange('male')}
              >
                <Text style={[
                  styles.genderButtonText,
                  { color: settings.voiceGender === 'male' ? '#FFFFFF' : colors.text },
                ]}>
                  Male
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Speed and Volume */}
        {settings?.enabled && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sliderSection}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Speed: {settings.speakingRateMultiplier.toFixed(1)}x
              </Text>
              <ValueControl
                value={settings.speakingRateMultiplier}
                min={0.5}
                max={1.5}
                step={0.1}
                onValueChange={handleSpeedChange}
                tintColor={colors.tint}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Slow</Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Fast</Text>
              </View>
            </View>

            <View style={[styles.sliderSection, { marginTop: 16 }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Volume: {Math.round(settings.volume * 100)}%
              </Text>
              <ValueControl
                value={settings.volume}
                min={0.1}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                tintColor={colors.tint}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Quiet</Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Loud</Text>
              </View>
            </View>
          </View>
        )}

        {/* Test Voice */}
        {settings?.enabled && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.tint }]}
            onPress={handleTestVoice}
            disabled={isTesting || !hasKey}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                <Text style={styles.testButtonText}>
                  Test {persona.name}'s Voice
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* API Key Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Google Cloud TTS API Key
          </Text>

          {hasKey ? (
            <View style={styles.keyStatus}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.keyStatusText, { color: colors.textSecondary }]}>
                API key configured
              </Text>
              <TouchableOpacity onPress={() => setShowApiKeyInput(true)}>
                <Text style={[styles.changeKeyLink, { color: colors.tint }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noKeyText, { color: colors.textSecondary }]}>
              Add your Google Cloud TTS API key to enable voice
            </Text>
          )}

          {(showApiKeyInput || !hasKey) && (
            <View style={styles.apiKeyInput}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter API key..."
                placeholderTextColor={colors.textMuted}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            Get a free API key from Google Cloud Console. The free tier includes 1 million characters/month.
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Each coach has a unique voice that matches their personality. {persona.name} uses a {settings?.voiceGender || 'female'} voice with {persona.traits[0].toLowerCase()} energy.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sliderSection: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  keyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyStatusText: {
    flex: 1,
    fontSize: 14,
  },
  changeKeyLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  noKeyText: {
    fontSize: 14,
    marginBottom: 12,
  },
  apiKeyInput: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
