import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Journal Tab - Primary Entry Point
 *
 * Following Moodling Ethics:
 * - "How are you feeling right now?" (warm, present)
 * - No pressure, no streaks, no guilt
 * - Compassionate, grounded interface
 *
 * Unit 1: Text editor, save button, timestamp, character count
 * Unit 2 will add: Persistent storage (data survives restart)
 * Unit 3 will add: Entry history list
 */

interface JournalEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Entry text state
  const [entryText, setEntryText] = useState('');

  // Last saved entry (in-memory only for now - Unit 2 adds persistence)
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);

  // Track if we just saved (for feedback)
  const [justSaved, setJustSaved] = useState(false);

  const characterCount = entryText.length;
  const canSave = entryText.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: entryText.trim(),
      timestamp: new Date(),
    };

    setSavedEntry(newEntry);
    setEntryText('');
    setJustSaved(true);

    // Clear "just saved" feedback after 3 seconds
    setTimeout(() => setJustSaved(false), 3000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const currentTime = formatTimestamp(new Date());

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            How are you feeling right now?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No rush. Take your time.
          </Text>
        </View>

        {/* Text Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Write whatever comes to mind..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={entryText}
            onChangeText={setEntryText}
            textAlignVertical="top"
          />
        </View>

        {/* Character count and timestamp */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {characterCount} {characterCount === 1 ? 'character' : 'characters'}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {currentTime}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: canSave ? colors.buttonPrimary : colors.buttonSecondary,
              opacity: canSave ? 1 : 0.5,
            },
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.saveButtonText,
              { color: canSave ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            Save Entry
          </Text>
        </TouchableOpacity>

        {/* Just saved feedback */}
        {justSaved && (
          <Text style={[styles.savedFeedback, { color: colors.success }]}>
            Entry saved
          </Text>
        )}

        {/* Saved Entry Preview */}
        {savedEntry && (
          <View style={styles.savedEntrySection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Your last entry
            </Text>
            <View style={[styles.savedEntryCard, { backgroundColor: colors.card }]}>
              <Text
                style={[styles.savedEntryText, { color: colors.text }]}
                numberOfLines={4}
              >
                {savedEntry.text}
              </Text>
              <Text style={[styles.savedEntryTime, { color: colors.textMuted }]}>
                {formatTimestamp(savedEntry.timestamp)}
              </Text>
            </View>
            <Text style={[styles.persistenceNote, { color: colors.textMuted }]}>
              Note: Entry is in memory only. Unit 2 adds persistence.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
            Everything stays on your device
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    minHeight: 180,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 13,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savedFeedback: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  savedEntrySection: {
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  savedEntryCard: {
    borderRadius: 12,
    padding: 16,
  },
  savedEntryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  savedEntryTime: {
    fontSize: 12,
    marginTop: 12,
  },
  persistenceNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  privacyNote: {
    fontSize: 12,
  },
});
