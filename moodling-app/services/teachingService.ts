/**
 * Teaching Service
 *
 * Enables the coach to teach various subjects like languages,
 * mindfulness concepts, psychology basics, and life skills.
 *
 * Following Mood Leaf Ethics:
 * - Learning should feel supportive, not stressful
 * - No grades or punishing failure
 * - Progress is celebrated, not required
 * - Knowledge serves emotional wellbeing
 *
 * Unit: Teaching System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TEACHING_PROGRESS: 'moodleaf_teaching_progress',
  TEACHING_SETTINGS: 'moodleaf_teaching_settings',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type SubjectCategory =
  | 'language'       // Languages like Spanish, French, etc.
  | 'mindfulness'    // Meditation, breathing, etc.
  | 'psychology'     // CBT, DBT concepts, etc.
  | 'wellness'       // Sleep, nutrition, etc.
  | 'life_skills'    // Budgeting, cooking, etc.
  | 'creativity';    // Art, writing, music

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  category: SubjectCategory;
  description: string;
  tier: 'free' | 'premium';
  lessons: Lesson[];
  totalLessons: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'vocabulary' | 'practice' | 'conversation' | 'quiz';
  content: LessonContent;
  duration: number; // minutes
  order: number;
}

export interface LessonContent {
  introduction?: string;
  mainContent?: string;
  examples?: string[];
  practicePrompts?: string[];
  vocabulary?: VocabularyItem[];
  quiz?: QuizQuestion[];
}

export interface VocabularyItem {
  term: string;
  translation?: string;
  pronunciation?: string;
  example?: string;
  audio?: string; // URL to audio
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  score?: number; // For quizzes, 0-100
  timeSpent: number; // seconds
}

export interface SubjectProgress {
  subjectId: string;
  currentLesson: number;
  lessonsCompleted: number;
  totalTimeSpent: number; // seconds
  lastPracticed?: string;
  streak: number; // Days in a row (optional, anti-streak design)
  lessons: Record<string, LessonProgress>;
}

export interface TeachingSettings {
  dailyGoal: number; // Minutes per day (0 = no goal)
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM
  difficulty: 'gentle' | 'moderate' | 'challenge';
  preferVoice: boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: TeachingSettings = {
  dailyGoal: 0, // No pressure
  reminderEnabled: false,
  difficulty: 'gentle',
  preferVoice: false,
};

// ============================================
// SUBJECT DEFINITIONS
// ============================================

export const SUBJECTS: Subject[] = [
  // ========== LANGUAGES ==========
  {
    id: 'spanish',
    name: 'Spanish',
    emoji: '🇪🇸',
    category: 'language',
    description: 'Learn Spanish with your supportive coach',
    tier: 'free',
    totalLessons: 30,
    lessons: generateLanguageLessons('spanish', 'Spanish', [
      { term: 'Hola', translation: 'Hello', pronunciation: 'OH-lah' },
      { term: 'Gracias', translation: 'Thank you', pronunciation: 'GRAH-see-ahs' },
      { term: 'Por favor', translation: 'Please', pronunciation: 'por fah-VOR' },
      { term: 'Buenos días', translation: 'Good morning', pronunciation: 'BWEH-nohs DEE-ahs' },
      { term: '¿Cómo estás?', translation: 'How are you?', pronunciation: 'KOH-moh ehs-TAHS' },
    ]),
  },
  {
    id: 'french',
    name: 'French',
    emoji: '🇫🇷',
    category: 'language',
    description: 'Learn French at your own pace',
    tier: 'free',
    totalLessons: 30,
    lessons: generateLanguageLessons('french', 'French', [
      { term: 'Bonjour', translation: 'Hello', pronunciation: 'bohn-ZHOOR' },
      { term: 'Merci', translation: 'Thank you', pronunciation: 'mehr-SEE' },
      { term: "S'il vous plaît", translation: 'Please', pronunciation: 'seel voo PLEH' },
      { term: 'Comment allez-vous?', translation: 'How are you?', pronunciation: 'koh-mohn tah-lay VOO' },
      { term: 'Au revoir', translation: 'Goodbye', pronunciation: 'oh ruh-VWAHR' },
    ]),
  },
  {
    id: 'japanese',
    name: 'Japanese',
    emoji: '🇯🇵',
    category: 'language',
    description: 'Explore Japanese language and culture',
    tier: 'premium',
    totalLessons: 30,
    lessons: generateLanguageLessons('japanese', 'Japanese', [
      { term: 'こんにちは', translation: 'Hello', pronunciation: 'kohn-NEE-chee-wah' },
      { term: 'ありがとう', translation: 'Thank you', pronunciation: 'ah-ree-GAH-toh' },
      { term: 'お願いします', translation: 'Please', pronunciation: 'oh-neh-GAI-shee-mahs' },
      { term: 'おはよう', translation: 'Good morning', pronunciation: 'oh-HAH-yoh' },
      { term: 'さようなら', translation: 'Goodbye', pronunciation: 'sah-YOH-nah-rah' },
    ]),
  },
  {
    id: 'mandarin',
    name: 'Mandarin Chinese',
    emoji: '🇨🇳',
    category: 'language',
    description: 'Learn the basics of Mandarin',
    tier: 'premium',
    totalLessons: 30,
    lessons: generateLanguageLessons('mandarin', 'Mandarin', [
      { term: '你好', translation: 'Hello', pronunciation: 'nee-HOW' },
      { term: '谢谢', translation: 'Thank you', pronunciation: 'shyeh-shyeh' },
      { term: '请', translation: 'Please', pronunciation: 'ching' },
      { term: '早上好', translation: 'Good morning', pronunciation: 'zow-shung how' },
      { term: '再见', translation: 'Goodbye', pronunciation: 'zai-jee-EN' },
    ]),
  },

  // ========== MINDFULNESS ==========
  {
    id: 'meditation_basics',
    name: 'Meditation Basics',
    emoji: '🧘',
    category: 'mindfulness',
    description: 'Start your meditation journey',
    tier: 'free',
    totalLessons: 10,
    lessons: [
      {
        id: 'med_1',
        title: 'What is Meditation?',
        description: 'Understanding the basics',
        type: 'concept',
        order: 1,
        duration: 5,
        content: {
          introduction: "Meditation isn't about emptying your mind—it's about noticing what's there.",
          mainContent: "At its core, meditation is simply paying attention on purpose. When your mind wanders (and it will!), you gently bring it back. That's the whole practice. There's no failing at meditation—noticing you got distracted IS the practice working.",
          examples: [
            "Watching your breath like watching waves at the beach",
            "Noticing thoughts like cars passing on a road",
            "Feeling your body like scanning a map",
          ],
          practicePrompts: [
            "Take 3 slow breaths right now. Notice how they feel.",
            "What sounds can you hear in this moment?",
          ],
        },
      },
      {
        id: 'med_2',
        title: 'Your First Sit',
        description: 'A gentle 2-minute practice',
        type: 'practice',
        order: 2,
        duration: 5,
        content: {
          introduction: "Let's try a short practice together. Just 2 minutes.",
          mainContent: "Find a comfortable position. You can sit in a chair, on the floor, or even lie down. Close your eyes if that feels okay, or soften your gaze. We're just going to breathe together.",
          practicePrompts: [
            "Notice where your body touches the surface beneath you",
            "Feel your breath—don't change it, just notice it",
            "When thoughts come, imagine them as clouds passing by",
            "Gently open your eyes when you're ready",
          ],
        },
      },
    ],
  },
  {
    id: 'breathing_mastery',
    name: 'Breathing Mastery',
    emoji: '💨',
    category: 'mindfulness',
    description: 'Master different breathing techniques',
    tier: 'free',
    totalLessons: 8,
    lessons: [
      {
        id: 'breath_1',
        title: 'Why Breathing Matters',
        description: 'The science of breath',
        type: 'concept',
        order: 1,
        duration: 4,
        content: {
          introduction: "Your breath is the remote control for your nervous system.",
          mainContent: "When you're stressed, your breathing becomes shallow and fast. But here's the secret: you can reverse-engineer calm. By changing how you breathe, you can signal safety to your brain. Long exhales activate your parasympathetic nervous system—the 'rest and digest' mode.",
          examples: [
            "Longer exhales = telling your body you're safe",
            "Slower breathing = lower heart rate",
            "Deep belly breaths = less tension",
          ],
        },
      },
    ],
  },

  // ========== PSYCHOLOGY ==========
  {
    id: 'cbt_basics',
    name: 'CBT Fundamentals',
    emoji: '🧠',
    category: 'psychology',
    description: 'Understand cognitive behavioral therapy concepts',
    tier: 'free',
    totalLessons: 12,
    lessons: [
      {
        id: 'cbt_1',
        title: 'Thoughts, Feelings, Actions',
        description: 'The CBT triangle',
        type: 'concept',
        order: 1,
        duration: 6,
        content: {
          introduction: "Your thoughts, feelings, and actions are all connected—and you can change the cycle.",
          mainContent: "CBT is based on a simple idea: it's not events that upset us, but our interpretation of them. The same event can make one person laugh and another cry—the difference is in thinking. This means if we can change our thoughts, we can change how we feel.",
          examples: [
            "Thought: 'They didn't text back—they hate me' → Feeling: Anxious → Action: Avoid them",
            "Alternative: 'They might be busy' → Feeling: Neutral → Action: Wait patiently",
          ],
          practicePrompts: [
            "Think of something that upset you recently. What thought triggered the feeling?",
            "What's another way to interpret that situation?",
          ],
        },
      },
    ],
  },
  {
    id: 'emotional_intelligence',
    name: 'Emotional Intelligence',
    emoji: '💝',
    category: 'psychology',
    description: 'Develop your EQ skills',
    tier: 'premium',
    totalLessons: 15,
    lessons: [],
  },

  // ========== WELLNESS ==========
  {
    id: 'sleep_science',
    name: 'Better Sleep',
    emoji: '😴',
    category: 'wellness',
    description: 'Understand and improve your sleep',
    tier: 'free',
    totalLessons: 8,
    lessons: [
      {
        id: 'sleep_1',
        title: 'Why Sleep Matters',
        description: 'The foundation of wellbeing',
        type: 'concept',
        order: 1,
        duration: 5,
        content: {
          introduction: "Sleep isn't just rest—it's when your brain does its most important work.",
          mainContent: "During sleep, your brain processes emotions, consolidates memories, and clears out toxins. Poor sleep is linked to anxiety, depression, and difficulty managing emotions. Improving sleep is often the most impactful change you can make for mental health.",
          examples: [
            "One night of poor sleep = harder to regulate emotions",
            "Deep sleep = emotional memories get processed",
            "REM sleep = creative problem solving",
          ],
        },
      },
    ],
  },

  // ========== LIFE SKILLS ==========
  {
    id: 'self_compassion',
    name: 'Self-Compassion',
    emoji: '🤗',
    category: 'life_skills',
    description: 'Learn to be kinder to yourself',
    tier: 'free',
    totalLessons: 10,
    lessons: [
      {
        id: 'sc_1',
        title: "What is Self-Compassion?",
        description: 'Understanding self-kindness',
        type: 'concept',
        order: 1,
        duration: 5,
        content: {
          introduction: "Self-compassion isn't self-pity or self-indulgence—it's treating yourself like you'd treat a good friend.",
          mainContent: "Research shows self-compassion leads to less anxiety, less depression, and more motivation (not less!). It has three parts: self-kindness (not self-criticism), common humanity (recognizing everyone struggles), and mindfulness (not over-identifying with negative emotions).",
          practicePrompts: [
            "What would you say to a friend going through what you're going through?",
            "Can you say those same words to yourself?",
          ],
        },
      },
    ],
  },
  {
    id: 'boundaries',
    name: 'Healthy Boundaries',
    emoji: '🚧',
    category: 'life_skills',
    description: 'Learn to set and maintain boundaries',
    tier: 'premium',
    totalLessons: 8,
    lessons: [],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate basic language lessons from vocabulary
 */
function generateLanguageLessons(
  subjectId: string,
  languageName: string,
  basicVocab: VocabularyItem[]
): Lesson[] {
  return [
    {
      id: `${subjectId}_1`,
      title: `Welcome to ${languageName}`,
      description: 'Your first words',
      type: 'concept',
      order: 1,
      duration: 5,
      content: {
        introduction: `Learning ${languageName} is a journey, and every journey starts with a single step. Let's take that step together.`,
        mainContent: `We'll start with the most useful phrases—the ones you'll actually use. No pressure to be perfect. Language learning is about communication, not perfection.`,
        vocabulary: basicVocab.slice(0, 2),
        practicePrompts: [
          `Try saying "${basicVocab[0]?.term}" out loud`,
          `Practice greeting yourself in ${languageName}`,
        ],
      },
    },
    {
      id: `${subjectId}_2`,
      title: 'Essential Phrases',
      description: 'Thank you and please',
      type: 'vocabulary',
      order: 2,
      duration: 8,
      content: {
        introduction: "Politeness goes a long way in any language.",
        vocabulary: basicVocab.slice(2, 4),
        practicePrompts: [
          "Practice these phrases while doing a simple task",
          "Try using them in your head throughout the day",
        ],
      },
    },
    {
      id: `${subjectId}_3`,
      title: 'Your First Conversation',
      description: 'Putting it together',
      type: 'conversation',
      order: 3,
      duration: 10,
      content: {
        introduction: "Let's try a simple conversation together.",
        vocabulary: basicVocab,
        practicePrompts: [
          "I'll greet you, and you respond",
          "Don't worry about mistakes—we're practicing!",
        ],
      },
    },
  ];
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get teaching settings
 */
export async function getTeachingSettings(): Promise<TeachingSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TEACHING_SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get teaching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save teaching settings
 */
export async function saveTeachingSettings(
  settings: Partial<TeachingSettings>
): Promise<TeachingSettings> {
  try {
    const current = await getTeachingSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.TEACHING_SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save teaching settings:', error);
    throw error;
  }
}

// ============================================
// PROGRESS MANAGEMENT
// ============================================

/**
 * Get progress for all subjects
 */
export async function getAllProgress(): Promise<Record<string, SubjectProgress>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TEACHING_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get teaching progress:', error);
    return {};
  }
}

/**
 * Get progress for a specific subject
 */
export async function getSubjectProgress(subjectId: string): Promise<SubjectProgress | null> {
  const all = await getAllProgress();
  return all[subjectId] || null;
}

/**
 * Save progress for a subject
 */
export async function saveSubjectProgress(
  subjectId: string,
  progress: Partial<SubjectProgress>
): Promise<SubjectProgress> {
  try {
    const all = await getAllProgress();
    const current = all[subjectId] || {
      subjectId,
      currentLesson: 0,
      lessonsCompleted: 0,
      totalTimeSpent: 0,
      streak: 0,
      lessons: {},
    };

    const updated: SubjectProgress = { ...current, ...progress };
    all[subjectId] = updated;

    await AsyncStorage.setItem(STORAGE_KEYS.TEACHING_PROGRESS, JSON.stringify(all));
    return updated;
  } catch (error) {
    console.error('Failed to save teaching progress:', error);
    throw error;
  }
}

/**
 * Mark a lesson as completed
 */
export async function completLesson(
  subjectId: string,
  lessonId: string,
  timeSpent: number,
  score?: number
): Promise<SubjectProgress> {
  const progress = await getSubjectProgress(subjectId) || {
    subjectId,
    currentLesson: 0,
    lessonsCompleted: 0,
    totalTimeSpent: 0,
    streak: 0,
    lessons: {},
  };

  progress.lessons[lessonId] = {
    lessonId,
    completed: true,
    completedAt: new Date().toISOString(),
    score,
    timeSpent,
  };

  progress.lessonsCompleted = Object.values(progress.lessons).filter((l) => l.completed).length;
  progress.totalTimeSpent += timeSpent;
  progress.lastPracticed = new Date().toISOString();

  return saveSubjectProgress(subjectId, progress);
}

// ============================================
// SUBJECT RETRIEVAL
// ============================================

/**
 * Get all subjects
 */
export function getAllSubjects(): Subject[] {
  return SUBJECTS;
}

/**
 * Get subjects by category
 */
export function getSubjectsByCategory(category: SubjectCategory): Subject[] {
  return SUBJECTS.filter((s) => s.category === category);
}

/**
 * Get a specific subject
 */
export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

/**
 * Get next lesson for a subject
 */
export async function getNextLesson(subjectId: string): Promise<Lesson | null> {
  const subject = getSubjectById(subjectId);
  if (!subject) return null;

  const progress = await getSubjectProgress(subjectId);
  const completedIds = progress
    ? Object.values(progress.lessons).filter((l) => l.completed).map((l) => l.lessonId)
    : [];

  // Find first uncompleted lesson
  const nextLesson = subject.lessons
    .sort((a, b) => a.order - b.order)
    .find((l) => !completedIds.includes(l.id));

  return nextLesson || null;
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get category display info
 */
export function getCategoryInfo(category: SubjectCategory): { name: string; emoji: string } {
  const info: Record<SubjectCategory, { name: string; emoji: string }> = {
    language: { name: 'Languages', emoji: '🌍' },
    mindfulness: { name: 'Mindfulness', emoji: '🧘' },
    psychology: { name: 'Psychology', emoji: '🧠' },
    wellness: { name: 'Wellness', emoji: '💚' },
    life_skills: { name: 'Life Skills', emoji: '🌱' },
    creativity: { name: 'Creativity', emoji: '🎨' },
  };
  return info[category];
}

/**
 * Format progress percentage
 */
export function getProgressPercentage(subject: Subject, progress: SubjectProgress | null): number {
  if (!progress || subject.totalLessons === 0) return 0;
  return Math.round((progress.lessonsCompleted / subject.totalLessons) * 100);
}

/**
 * Format time spent
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}
