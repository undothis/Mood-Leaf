/**
 * Cognitive Profile Service
 *
 * Discovers HOW someone thinks, not IF they're smart.
 * Traditional IQ fails most people. This captures:
 * - How you process information (patterns vs details vs stories)
 * - How you learn best (doing, watching, reading, discussing)
 * - How you relate to others (social energy, communication style)
 * - How you handle emotions (sensitive, analytical, action-oriented)
 *
 * NO JARGON. No "INFP". No "high IQ". Just human understanding.
 *
 * The onboarding ADAPTS - asks different questions based on responses.
 * Someone who thinks in systems gets systems questions.
 * Someone who thinks in feelings gets feeling questions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES - How People Actually Think
// ============================================

/**
 * How someone naturally processes information
 * NOT about intelligence - about cognitive style
 */
export type ProcessingStyle =
  | 'patterns'      // Sees connections, systems, underlying structures
  | 'details'       // Notices specifics, remembers facts, step-by-step
  | 'stories'       // Understands through narrative, examples, experiences
  | 'feelings'      // Processes through emotional resonance first
  | 'actions'       // Learns by doing, figures it out hands-on
  | 'synthesis';    // Pulls from multiple sources, makes new wholes

/**
 * How someone best receives new information
 */
export type LearningStyle =
  | 'visual'        // Needs to see it (diagrams, images, written)
  | 'auditory'      // Needs to hear it (conversation, explanation)
  | 'kinesthetic'   // Needs to do it (practice, movement, hands-on)
  | 'reading'       // Needs to read/write it (text, notes)
  | 'social'        // Needs to discuss it (dialogue, debate)
  | 'solitary';     // Needs alone time to process

/**
 * Social energy and comfort
 */
export type SocialOrientation =
  | 'energized_by_people'    // Gains energy from interaction
  | 'drained_by_people'      // Needs recovery after socializing
  | 'selective'              // Deep connections > many connections
  | 'situational';           // Depends on context and people

/**
 * How someone handles emotions
 */
export type EmotionalProcessing =
  | 'feeler_first'     // Emotions come first, then logic
  | 'thinker_first'    // Logic first, emotions processed after
  | 'integrated'       // Emotions and logic intertwined
  | 'action_oriented'  // Processes emotions through doing
  | 'delayed';         // Emotions surface later, not in moment

/**
 * Communication preference
 */
export type CommunicationStyle =
  | 'direct'           // Get to the point, clear and concise
  | 'exploratory'      // Think out loud, wander to the answer
  | 'reflective'       // Need time to respond, prefer writing
  | 'collaborative'    // Build understanding together
  | 'metaphorical';    // Understand through analogies and images

/**
 * How someone prefers structure
 */
export type StructurePreference =
  | 'loves_structure'      // Plans, lists, clear steps
  | 'needs_flexibility'    // Goes with flow, adapts
  | 'structured_start'     // Needs structure to begin, then flows
  | 'emergent';            // Structure emerges from doing

/**
 * Sensitivity level (emotional/sensory)
 */
export type SensitivityLevel = 'highly_sensitive' | 'moderate' | 'low_sensitivity';

/**
 * The complete cognitive profile
 */
export interface CognitiveProfile {
  // Core processing
  primaryProcessing: ProcessingStyle;
  secondaryProcessing: ProcessingStyle | null;

  // Learning
  learningStyles: LearningStyle[]; // Can have multiple
  bestLearningContext: string; // Free text, learned over time

  // Social
  socialOrientation: SocialOrientation;
  socialComfortLevel: number; // 1-10
  preferredGroupSize: 'one_on_one' | 'small_group' | 'large_group' | 'alone';

  // Emotional
  emotionalProcessing: EmotionalProcessing;
  sensitivityLevel: SensitivityLevel;
  emotionalIntelligence: 'high' | 'moderate' | 'developing';

  // Communication
  communicationStyle: CommunicationStyle;
  prefersWrittenOrSpoken: 'written' | 'spoken' | 'either';
  needsTimeToRespond: boolean;

  // Structure
  structurePreference: StructurePreference;
  comfortWithAmbiguity: 'high' | 'moderate' | 'low';

  // Self-awareness
  selfAwarenessLevel: 'high' | 'moderate' | 'developing';

  // Strengths discovered (updated over time)
  discoveredStrengths: string[];

  // How traditional education/testing worked for them
  traditionalLearningFit: 'worked_well' | 'struggled' | 'mixed';

  // Metadata
  completedOnboarding: boolean;
  onboardingDepth: 'quick' | 'standard' | 'deep';
  lastUpdated: string;
  confidenceLevel: number; // 0-100, how sure we are about this profile
}

// ============================================
// ONBOARDING QUESTIONS
// ============================================

export interface OnboardingQuestion {
  id: string;
  text: string;
  subtext?: string; // Clarifying text
  type: 'choice' | 'scale' | 'multiselect' | 'open';
  options?: OnboardingOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  measures: string[]; // What dimensions this question informs
  followUpCondition?: (answer: any) => boolean; // Should we ask follow-up?
  followUpQuestions?: string[]; // IDs of follow-up questions
  adaptiveDepth: 'basic' | 'standard' | 'deep'; // When to show this question
  requiresPrevious?: string[]; // Question IDs that must be answered first
}

export interface OnboardingOption {
  value: string;
  label: string;
  description?: string;
  indicates: Partial<CognitiveProfile>; // What this answer suggests
}

/**
 * Core onboarding questions - adaptive and human
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // ========== OPENING (Everyone gets these) ==========
  {
    id: 'welcome_comfort',
    text: "Before we start, how are you feeling about answering some questions about yourself?",
    subtext: "There are no wrong answers. This helps me understand how to talk with you.",
    type: 'choice',
    options: [
      {
        value: 'excited',
        label: "I like thinking about this stuff",
        indicates: { selfAwarenessLevel: 'high' }
      },
      {
        value: 'neutral',
        label: "I'm open to it",
        indicates: { selfAwarenessLevel: 'moderate' }
      },
      {
        value: 'unsure',
        label: "I'm not sure I know myself that well",
        indicates: { selfAwarenessLevel: 'developing' }
      },
      {
        value: 'anxious',
        label: "Questions about myself make me a bit anxious",
        indicates: { sensitivityLevel: 'highly_sensitive' }
      }
    ],
    measures: ['selfAwarenessLevel', 'sensitivityLevel'],
    adaptiveDepth: 'basic'
  },

  // ========== PROCESSING STYLE ==========
  {
    id: 'processing_scenario',
    text: "When someone explains something new to you, what helps you understand it?",
    type: 'choice',
    options: [
      {
        value: 'big_picture',
        label: "Show me how it fits into the bigger picture",
        description: "I need to see the whole system first",
        indicates: { primaryProcessing: 'patterns' }
      },
      {
        value: 'steps',
        label: "Walk me through it step by step",
        description: "I like clear, logical progression",
        indicates: { primaryProcessing: 'details' }
      },
      {
        value: 'example',
        label: "Give me a real example or story",
        description: "I understand better through concrete situations",
        indicates: { primaryProcessing: 'stories' }
      },
      {
        value: 'why_matters',
        label: "Tell me why it matters first",
        description: "I need to feel connected to it emotionally",
        indicates: { primaryProcessing: 'feelings' }
      },
      {
        value: 'let_me_try',
        label: "Just let me try it and figure it out",
        description: "I learn by doing, not listening",
        indicates: { primaryProcessing: 'actions' }
      }
    ],
    measures: ['primaryProcessing'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'processing_natural',
    text: "When you're trying to solve a problem, what's your natural first move?",
    type: 'choice',
    options: [
      {
        value: 'connect_dots',
        label: "Look for patterns or connections to other things I know",
        indicates: { primaryProcessing: 'patterns', secondaryProcessing: 'synthesis' }
      },
      {
        value: 'break_down',
        label: "Break it into smaller pieces and tackle them one by one",
        indicates: { primaryProcessing: 'details' }
      },
      {
        value: 'similar_situation',
        label: "Think of a similar situation and what worked then",
        indicates: { primaryProcessing: 'stories' }
      },
      {
        value: 'gut_feeling',
        label: "Check in with my gut feeling about it",
        indicates: { primaryProcessing: 'feelings', emotionalIntelligence: 'high' }
      },
      {
        value: 'just_start',
        label: "Just start doing something and adjust as I go",
        indicates: { primaryProcessing: 'actions', structurePreference: 'emergent' }
      },
      {
        value: 'research',
        label: "Gather information from different sources first",
        indicates: { primaryProcessing: 'synthesis' }
      }
    ],
    measures: ['primaryProcessing', 'secondaryProcessing'],
    adaptiveDepth: 'basic'
  },

  // ========== LEARNING STYLE ==========
  {
    id: 'learning_best',
    text: "Think of something you learned easily. How did you learn it?",
    type: 'multiselect',
    options: [
      { value: 'watched', label: "Watched someone do it", indicates: { learningStyles: ['visual'] } },
      { value: 'read', label: "Read about it", indicates: { learningStyles: ['reading'] } },
      { value: 'discussed', label: "Talked it through with someone", indicates: { learningStyles: ['social', 'auditory'] } },
      { value: 'practiced', label: "Practiced until I got it", indicates: { learningStyles: ['kinesthetic'] } },
      { value: 'diagrams', label: "Drew diagrams or made notes", indicates: { learningStyles: ['visual', 'reading'] } },
      { value: 'alone', label: "Figured it out on my own", indicates: { learningStyles: ['solitary'] } }
    ],
    measures: ['learningStyles'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'school_experience',
    text: "How was traditional school for you?",
    subtext: "This isn't about intelligence - it's about fit.",
    type: 'choice',
    options: [
      {
        value: 'worked',
        label: "It worked well for how I learn",
        indicates: { traditionalLearningFit: 'worked_well' }
      },
      {
        value: 'struggled',
        label: "I struggled, even though I'm smart in other ways",
        indicates: { traditionalLearningFit: 'struggled' }
      },
      {
        value: 'mixed',
        label: "Some subjects clicked, others didn't",
        indicates: { traditionalLearningFit: 'mixed' }
      },
      {
        value: 'bored',
        label: "I was bored - it was too slow or too linear",
        indicates: { traditionalLearningFit: 'struggled', primaryProcessing: 'patterns' }
      }
    ],
    measures: ['traditionalLearningFit'],
    adaptiveDepth: 'standard'
  },

  // ========== SOCIAL ORIENTATION ==========
  {
    id: 'social_energy',
    text: "After spending time with people, how do you usually feel?",
    type: 'choice',
    options: [
      {
        value: 'energized',
        label: "Energized - I love connecting",
        indicates: { socialOrientation: 'energized_by_people' }
      },
      {
        value: 'drained',
        label: "I need alone time to recharge",
        indicates: { socialOrientation: 'drained_by_people' }
      },
      {
        value: 'depends_people',
        label: "Depends on who I'm with",
        indicates: { socialOrientation: 'selective' }
      },
      {
        value: 'depends_context',
        label: "Depends on the situation",
        indicates: { socialOrientation: 'situational' }
      }
    ],
    measures: ['socialOrientation'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'social_comfort',
    text: "How comfortable are you in new social situations?",
    type: 'scale',
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: "Very uncomfortable", max: "Totally at ease" },
    measures: ['socialComfortLevel'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'group_preference',
    text: "Where do you feel most yourself?",
    type: 'choice',
    options: [
      { value: 'one_on_one', label: "One-on-one conversations", indicates: { preferredGroupSize: 'one_on_one' } },
      { value: 'small_group', label: "Small groups of close people", indicates: { preferredGroupSize: 'small_group' } },
      { value: 'large_group', label: "Bigger gatherings and parties", indicates: { preferredGroupSize: 'large_group' } },
      { value: 'alone', label: "Honestly, when I'm alone", indicates: { preferredGroupSize: 'alone' } }
    ],
    measures: ['preferredGroupSize'],
    adaptiveDepth: 'standard'
  },

  // ========== EMOTIONAL PROCESSING ==========
  {
    id: 'emotion_first',
    text: "When something difficult happens, what comes first for you?",
    type: 'choice',
    options: [
      {
        value: 'feel_first',
        label: "The feelings hit me first, then I think about it",
        indicates: { emotionalProcessing: 'feeler_first' }
      },
      {
        value: 'think_first',
        label: "I analyze it first, feelings come later",
        indicates: { emotionalProcessing: 'thinker_first' }
      },
      {
        value: 'both',
        label: "Feelings and thoughts come together",
        indicates: { emotionalProcessing: 'integrated' }
      },
      {
        value: 'do_something',
        label: "I need to do something - action helps me process",
        indicates: { emotionalProcessing: 'action_oriented' }
      },
      {
        value: 'delayed',
        label: "I often don't feel it until much later",
        indicates: { emotionalProcessing: 'delayed' }
      }
    ],
    measures: ['emotionalProcessing'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'sensitivity',
    text: "How would you describe your sensitivity?",
    subtext: "Sensitivity is a strength, not a weakness.",
    type: 'choice',
    options: [
      {
        value: 'highly',
        label: "I feel things deeply - environments, emotions, subtleties",
        indicates: { sensitivityLevel: 'highly_sensitive', emotionalIntelligence: 'high' }
      },
      {
        value: 'moderate',
        label: "I'm aware of feelings but don't get overwhelmed",
        indicates: { sensitivityLevel: 'moderate' }
      },
      {
        value: 'thick_skin',
        label: "I'm pretty thick-skinned - things roll off me",
        indicates: { sensitivityLevel: 'low_sensitivity' }
      }
    ],
    measures: ['sensitivityLevel', 'emotionalIntelligence'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'emotional_intelligence',
    text: "How easily do you pick up on what others are feeling?",
    type: 'choice',
    options: [
      {
        value: 'very_easily',
        label: "Very easily - I often know before they say anything",
        indicates: { emotionalIntelligence: 'high' }
      },
      {
        value: 'when_I_pay_attention',
        label: "When I pay attention, yes",
        indicates: { emotionalIntelligence: 'moderate' }
      },
      {
        value: 'not_naturally',
        label: "Not naturally - I often miss social cues",
        indicates: { emotionalIntelligence: 'developing' }
      }
    ],
    measures: ['emotionalIntelligence'],
    adaptiveDepth: 'standard'
  },

  // ========== COMMUNICATION STYLE ==========
  {
    id: 'communication_preference',
    text: "How do you prefer people communicate with you?",
    type: 'choice',
    options: [
      {
        value: 'direct',
        label: "Be direct - just tell me straight",
        indicates: { communicationStyle: 'direct' }
      },
      {
        value: 'explore',
        label: "Let's explore it together - I think out loud",
        indicates: { communicationStyle: 'exploratory' }
      },
      {
        value: 'time',
        label: "Give me time to think before I respond",
        indicates: { communicationStyle: 'reflective', needsTimeToRespond: true }
      },
      {
        value: 'build_together',
        label: "Build understanding back and forth",
        indicates: { communicationStyle: 'collaborative' }
      },
      {
        value: 'analogies',
        label: "Use metaphors and comparisons - they help me get it",
        indicates: { communicationStyle: 'metaphorical' }
      }
    ],
    measures: ['communicationStyle', 'needsTimeToRespond'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'written_spoken',
    text: "Do you express yourself better in writing or speaking?",
    type: 'choice',
    options: [
      { value: 'written', label: "Writing - I can think as I type", indicates: { prefersWrittenOrSpoken: 'written' } },
      { value: 'spoken', label: "Speaking - talking helps me process", indicates: { prefersWrittenOrSpoken: 'spoken' } },
      { value: 'either', label: "Depends on the situation", indicates: { prefersWrittenOrSpoken: 'either' } }
    ],
    measures: ['prefersWrittenOrSpoken'],
    adaptiveDepth: 'standard'
  },

  // ========== STRUCTURE PREFERENCE ==========
  {
    id: 'structure',
    text: "How do you feel about plans and structure?",
    type: 'choice',
    options: [
      {
        value: 'love_it',
        label: "I love having a plan - it calms me",
        indicates: { structurePreference: 'loves_structure', comfortWithAmbiguity: 'low' }
      },
      {
        value: 'need_flex',
        label: "I need flexibility - too much structure feels suffocating",
        indicates: { structurePreference: 'needs_flexibility', comfortWithAmbiguity: 'high' }
      },
      {
        value: 'start_structured',
        label: "I need structure to start, then I can improvise",
        indicates: { structurePreference: 'structured_start', comfortWithAmbiguity: 'moderate' }
      },
      {
        value: 'emerges',
        label: "Structure emerges as I go - I find my way",
        indicates: { structurePreference: 'emergent', comfortWithAmbiguity: 'high' }
      }
    ],
    measures: ['structurePreference', 'comfortWithAmbiguity'],
    adaptiveDepth: 'basic'
  },

  // ========== DEEPER QUESTIONS (Adaptive) ==========
  {
    id: 'systems_thinking',
    text: "Do you often see how different parts of life connect to each other?",
    subtext: "Like noticing that sleep affects mood affects relationships affects work...",
    type: 'choice',
    options: [
      {
        value: 'constantly',
        label: "Yes, constantly - everything is connected",
        indicates: { primaryProcessing: 'patterns', discoveredStrengths: ['systems thinking'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes, when I step back",
        indicates: { secondaryProcessing: 'patterns' }
      },
      {
        value: 'not_really',
        label: "I tend to focus on one thing at a time",
        indicates: { primaryProcessing: 'details' }
      }
    ],
    measures: ['primaryProcessing', 'discoveredStrengths'],
    adaptiveDepth: 'deep',
    requiresPrevious: ['processing_scenario']
  },

  {
    id: 'nonlinear',
    text: "Do you often have ideas or make connections that seem to 'come out of nowhere'?",
    type: 'choice',
    options: [
      {
        value: 'yes',
        label: "Yes - my mind jumps around and lands on things",
        indicates: { structurePreference: 'emergent', discoveredStrengths: ['nonlinear thinking', 'creative connections'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes - it surprises me when it happens",
        indicates: { secondaryProcessing: 'synthesis' }
      },
      {
        value: 'no',
        label: "I usually think in more linear steps",
        indicates: { structurePreference: 'loves_structure' }
      }
    ],
    measures: ['structurePreference', 'discoveredStrengths'],
    adaptiveDepth: 'deep'
  },

  {
    id: 'absorb_others',
    text: "Do you sometimes absorb other people's emotions without meaning to?",
    type: 'choice',
    options: [
      {
        value: 'very_much',
        label: "Yes - I often feel what others feel",
        indicates: { sensitivityLevel: 'highly_sensitive', emotionalIntelligence: 'high', discoveredStrengths: ['empathy', 'emotional attunement'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes, especially with people I'm close to",
        indicates: { emotionalIntelligence: 'high' }
      },
      {
        value: 'not_really',
        label: "Not really - I can separate my feelings from theirs",
        indicates: { sensitivityLevel: 'moderate' }
      }
    ],
    measures: ['sensitivityLevel', 'emotionalIntelligence', 'discoveredStrengths'],
    adaptiveDepth: 'deep'
  },

  {
    id: 'understimulated',
    text: "Do you ever feel understimulated - like you need more complexity or novelty?",
    type: 'choice',
    options: [
      {
        value: 'often',
        label: "Often - I get bored easily and need new challenges",
        indicates: { discoveredStrengths: ['needs intellectual stimulation'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes, but I'm okay with routine too",
        indicates: {}
      },
      {
        value: 'rarely',
        label: "Rarely - I like stability and consistency",
        indicates: { structurePreference: 'loves_structure' }
      }
    ],
    measures: ['discoveredStrengths'],
    adaptiveDepth: 'deep'
  }
];

// ============================================
// DEFAULT PROFILE
// ============================================

const DEFAULT_PROFILE: CognitiveProfile = {
  primaryProcessing: 'stories',
  secondaryProcessing: null,
  learningStyles: ['visual', 'auditory'],
  bestLearningContext: '',
  socialOrientation: 'selective',
  socialComfortLevel: 5,
  preferredGroupSize: 'small_group',
  emotionalProcessing: 'integrated',
  sensitivityLevel: 'moderate',
  emotionalIntelligence: 'moderate',
  communicationStyle: 'collaborative',
  prefersWrittenOrSpoken: 'either',
  needsTimeToRespond: false,
  structurePreference: 'structured_start',
  comfortWithAmbiguity: 'moderate',
  selfAwarenessLevel: 'moderate',
  discoveredStrengths: [],
  traditionalLearningFit: 'mixed',
  completedOnboarding: false,
  onboardingDepth: 'standard',
  lastUpdated: new Date().toISOString(),
  confidenceLevel: 0
};

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  PROFILE: 'moodleaf_cognitive_profile',
  ONBOARDING_PROGRESS: 'moodleaf_onboarding_progress',
  ONBOARDING_ANSWERS: 'moodleaf_onboarding_answers',
};

/**
 * Get current cognitive profile
 */
export async function getCognitiveProfile(): Promise<CognitiveProfile> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
  } catch (error) {
    console.error('[CognitiveProfile] Failed to get profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save cognitive profile
 */
export async function saveCognitiveProfile(profile: Partial<CognitiveProfile>): Promise<void> {
  try {
    const current = await getCognitiveProfile();
    const updated = {
      ...current,
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  } catch (error) {
    console.error('[CognitiveProfile] Failed to save profile:', error);
  }
}

// ============================================
// ONBOARDING FLOW
// ============================================

export interface OnboardingProgress {
  currentQuestionIndex: number;
  answeredQuestions: string[];
  adaptiveDepth: 'basic' | 'standard' | 'deep';
  estimatedSelfAwareness: 'high' | 'moderate' | 'developing';
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    return stored ? JSON.parse(stored) : {
      currentQuestionIndex: 0,
      answeredQuestions: [],
      adaptiveDepth: 'basic',
      estimatedSelfAwareness: 'moderate'
    };
  } catch (error) {
    return {
      currentQuestionIndex: 0,
      answeredQuestions: [],
      adaptiveDepth: 'basic',
      estimatedSelfAwareness: 'moderate'
    };
  }
}

/**
 * Save onboarding progress
 */
export async function saveOnboardingProgress(progress: OnboardingProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(progress));
}

/**
 * Get next question based on progress and answers
 * This is where adaptation happens
 */
export async function getNextOnboardingQuestion(): Promise<OnboardingQuestion | null> {
  const progress = await getOnboardingProgress();
  const profile = await getCognitiveProfile();

  // Filter questions by adaptive depth and requirements
  const availableQuestions = ONBOARDING_QUESTIONS.filter(q => {
    // Already answered?
    if (progress.answeredQuestions.includes(q.id)) return false;

    // Meets depth requirement?
    const depthOrder = { basic: 0, standard: 1, deep: 2 };
    if (depthOrder[q.adaptiveDepth] > depthOrder[progress.adaptiveDepth]) return false;

    // Has required previous answers?
    if (q.requiresPrevious) {
      const hasRequired = q.requiresPrevious.every(id =>
        progress.answeredQuestions.includes(id)
      );
      if (!hasRequired) return false;
    }

    return true;
  });

  if (availableQuestions.length === 0) return null;

  // Prioritize basic questions first, then standard, then deep
  const sorted = availableQuestions.sort((a, b) => {
    const depthOrder = { basic: 0, standard: 1, deep: 2 };
    return depthOrder[a.adaptiveDepth] - depthOrder[b.adaptiveDepth];
  });

  return sorted[0];
}

/**
 * Record an answer and update profile
 */
export async function recordOnboardingAnswer(
  questionId: string,
  answer: any
): Promise<void> {
  const progress = await getOnboardingProgress();
  const profile = await getCognitiveProfile();

  // Find the question
  const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId);
  if (!question) return;

  // Mark as answered
  progress.answeredQuestions.push(questionId);

  // Apply profile updates based on answer
  if (question.type === 'choice' || question.type === 'multiselect') {
    const answers = Array.isArray(answer) ? answer : [answer];

    for (const ans of answers) {
      const option = question.options?.find(o => o.value === ans);
      if (option?.indicates) {
        // Merge indicated profile values
        for (const [key, value] of Object.entries(option.indicates)) {
          if (key === 'discoveredStrengths' && Array.isArray(value)) {
            // Append to strengths
            profile.discoveredStrengths = [
              ...new Set([...profile.discoveredStrengths, ...value])
            ];
          } else if (key === 'learningStyles' && Array.isArray(value)) {
            // Append to learning styles
            profile.learningStyles = [
              ...new Set([...profile.learningStyles, ...value])
            ];
          } else {
            (profile as any)[key] = value;
          }
        }
      }
    }
  } else if (question.type === 'scale') {
    // Handle scale answers
    if (questionId === 'social_comfort') {
      profile.socialComfortLevel = answer;
    }
  }

  // Adapt depth based on self-awareness signals
  if (questionId === 'welcome_comfort') {
    if (answer === 'excited') {
      progress.adaptiveDepth = 'deep';
      progress.estimatedSelfAwareness = 'high';
    } else if (answer === 'unsure') {
      progress.adaptiveDepth = 'basic';
      progress.estimatedSelfAwareness = 'developing';
    }
  }

  // Update confidence based on answers
  profile.confidenceLevel = Math.min(100, profile.confidenceLevel + 8);

  // Save both
  await saveOnboardingProgress(progress);
  await saveCognitiveProfile(profile);

  // Store raw answer for potential re-analysis
  const answers = await getOnboardingAnswers();
  answers[questionId] = { answer, timestamp: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_ANSWERS, JSON.stringify(answers));
}

/**
 * Get all onboarding answers
 */
async function getOnboardingAnswers(): Promise<Record<string, any>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_ANSWERS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(): Promise<void> {
  const profile = await getCognitiveProfile();
  const progress = await getOnboardingProgress();

  profile.completedOnboarding = true;
  profile.onboardingDepth = progress.adaptiveDepth;

  await saveCognitiveProfile(profile);
}

// ============================================
// PROFILE REVEAL (Coach explains user to themselves)
// ============================================

/**
 * Generate the profile reveal - how the coach explains the user to themselves
 * This is the "aha" moment
 */
export async function generateProfileReveal(): Promise<string> {
  const profile = await getCognitiveProfile();

  const parts: string[] = [];

  // Opening based on self-awareness
  if (profile.selfAwarenessLevel === 'high') {
    parts.push("Based on what you've shared, I'm seeing some patterns that might resonate with you.");
  } else if (profile.selfAwarenessLevel === 'developing') {
    parts.push("I've noticed some things about how your mind works that might be helpful to know.");
  } else {
    parts.push("Here's what I'm picking up about how you process the world.");
  }

  parts.push('');

  // Processing style
  const processingDescriptions: Record<ProcessingStyle, string> = {
    patterns: "You're a natural systems thinker. You see connections that others miss, and you understand things by seeing how they fit into a bigger picture. This is a real strength - even if traditional education didn't always reward it.",
    details: "You have a gift for precision. You notice the specifics, remember the details, and think things through step by step. This makes you thorough and reliable.",
    stories: "You understand the world through stories and examples. Abstract concepts make sense when you can see them in action. This makes you relatable and helps you connect with others.",
    feelings: "You process through emotional resonance first. You need to feel connected to something before you can fully engage with it. This emotional intelligence is a genuine strength.",
    actions: "You learn by doing. Sitting and listening doesn't work for you - you need to get your hands on things. This makes you practical and effective.",
    synthesis: "You're a natural synthesizer. You pull from many sources and create something new. Your mind doesn't follow linear paths - it makes leaps."
  };

  parts.push(`**How you think:** ${processingDescriptions[profile.primaryProcessing]}`);

  if (profile.secondaryProcessing && profile.secondaryProcessing !== profile.primaryProcessing) {
    parts.push(`You also draw on ${profile.secondaryProcessing} thinking when needed.`);
  }

  parts.push('');

  // Emotional processing
  const emotionalDescriptions: Record<EmotionalProcessing, string> = {
    feeler_first: "Emotions come first for you - they're not separate from your thinking, they're part of how you understand things.",
    thinker_first: "You tend to analyze first and feel later. This isn't cold - it's just how your mind processes.",
    integrated: "Your feelings and thoughts work together. You don't separate logic from emotion.",
    action_oriented: "You process emotions through action. Sitting with feelings is hard - doing something helps.",
    delayed: "Your emotions often surface later, not in the moment. This can be confusing, but it's just your processing style."
  };

  parts.push(`**How you feel:** ${emotionalDescriptions[profile.emotionalProcessing]}`);

  // Sensitivity
  if (profile.sensitivityLevel === 'highly_sensitive') {
    parts.push("You're highly sensitive - you pick up on subtleties others miss. This is a gift, even when it feels overwhelming.");
  }

  // Emotional intelligence
  if (profile.emotionalIntelligence === 'high') {
    parts.push("Your emotional intelligence is strong. You read people well and understand what's beneath the surface.");
  }

  parts.push('');

  // Social
  const socialDescriptions: Record<SocialOrientation, string> = {
    energized_by_people: "People energize you. Connection isn't draining - it's fuel.",
    drained_by_people: "Social time costs energy for you. This isn't antisocial - you just need to recharge alone.",
    selective: "You're selective about connection. A few deep relationships mean more than many shallow ones.",
    situational: "Your social energy depends on context. Some situations feed you, others drain you."
  };

  parts.push(`**How you relate:** ${socialDescriptions[profile.socialOrientation]}`);

  parts.push('');

  // Communication
  const commDescriptions: Record<CommunicationStyle, string> = {
    direct: "You prefer directness. Don't beat around the bush - just say it.",
    exploratory: "You think out loud. Talking helps you process, even when you don't have the answer yet.",
    reflective: "You need time to respond. Quick conversations can feel pressured.",
    collaborative: "You like building understanding together. Back-and-forth helps you think.",
    metaphorical: "Metaphors and analogies help you understand. Abstract explanations don't land the same way."
  };

  parts.push(`**How to talk with you:** ${commDescriptions[profile.communicationStyle]}`);

  if (profile.needsTimeToRespond) {
    parts.push("I'll give you space to think. No pressure to respond quickly.");
  }

  parts.push('');

  // Structure
  if (profile.structurePreference === 'needs_flexibility' || profile.structurePreference === 'emergent') {
    parts.push("**About structure:** You need room to flow. I won't over-structure our conversations.");
  } else if (profile.structurePreference === 'loves_structure') {
    parts.push("**About structure:** You like having a plan. I'll be clear and organized.");
  }

  // Strengths
  if (profile.discoveredStrengths.length > 0) {
    parts.push('');
    parts.push(`**Your strengths:** ${profile.discoveredStrengths.join(', ')}`);
  }

  // Traditional learning
  if (profile.traditionalLearningFit === 'struggled') {
    parts.push('');
    parts.push("One more thing: If traditional school didn't work for you, that says nothing about your intelligence. The system rewards one type of mind. Your mind works differently - and that's actually valuable.");
  }

  // Closing
  parts.push('');
  parts.push("This is just a starting point. I'll learn more about you as we talk. And if something doesn't feel right, just tell me - I can adapt.");

  return parts.join('\n');
}

// ============================================
// COACH ADAPTATION RULES
// ============================================

export interface CoachAdaptations {
  // Response style
  useMetaphors: boolean;
  useExamples: boolean;
  useStepByStep: boolean;
  showBigPicture: boolean;

  // Pacing
  allowSilence: boolean;
  quickResponses: boolean;
  giveTimeToThink: boolean;

  // Questions
  questionFrequency: 'low' | 'medium' | 'high';
  questionType: 'open' | 'specific' | 'reflective';

  // Emotional
  validateFirst: boolean;
  mirrorEmotions: boolean;
  actionOriented: boolean;

  // Structure
  provideStructure: boolean;
  allowWandering: boolean;

  // Length
  preferBrief: boolean;
}

/**
 * Generate coach adaptations based on profile
 */
export async function getCoachAdaptations(): Promise<CoachAdaptations> {
  const profile = await getCognitiveProfile();

  return {
    // Response style based on processing
    useMetaphors: profile.communicationStyle === 'metaphorical' || profile.primaryProcessing === 'patterns',
    useExamples: profile.primaryProcessing === 'stories' || profile.primaryProcessing === 'actions',
    useStepByStep: profile.primaryProcessing === 'details',
    showBigPicture: profile.primaryProcessing === 'patterns' || profile.primaryProcessing === 'synthesis',

    // Pacing based on communication + social
    allowSilence: profile.socialOrientation === 'drained_by_people' || profile.needsTimeToRespond,
    quickResponses: profile.socialOrientation === 'energized_by_people' && profile.communicationStyle === 'direct',
    giveTimeToThink: profile.needsTimeToRespond || profile.communicationStyle === 'reflective',

    // Questions based on emotional processing + communication
    questionFrequency: profile.emotionalProcessing === 'feeler_first' ? 'low' : 'medium',
    questionType: profile.communicationStyle === 'reflective' ? 'reflective' :
                  profile.primaryProcessing === 'details' ? 'specific' : 'open',

    // Emotional based on sensitivity + emotional processing
    validateFirst: profile.sensitivityLevel === 'highly_sensitive' || profile.emotionalProcessing === 'feeler_first',
    mirrorEmotions: profile.emotionalIntelligence === 'high',
    actionOriented: profile.emotionalProcessing === 'action_oriented',

    // Structure based on preference
    provideStructure: profile.structurePreference === 'loves_structure' || profile.structurePreference === 'structured_start',
    allowWandering: profile.structurePreference === 'needs_flexibility' || profile.structurePreference === 'emergent',

    // Length based on communication
    preferBrief: profile.communicationStyle === 'direct' || profile.prefersWrittenOrSpoken === 'spoken'
  };
}

/**
 * Get context for LLM prompts based on cognitive profile
 */
export async function getCognitiveProfileContextForLLM(): Promise<string> {
  const profile = await getCognitiveProfile();
  const adaptations = await getCoachAdaptations();

  if (!profile.completedOnboarding) {
    return ''; // No profile yet
  }

  const parts: string[] = ['USER\'S COGNITIVE PROFILE (adapt your responses accordingly):'];

  // Processing
  parts.push(`- Thinks in: ${profile.primaryProcessing}${profile.secondaryProcessing ? ` with ${profile.secondaryProcessing}` : ''}`);

  // Communication
  parts.push(`- Communication style: ${profile.communicationStyle}`);
  if (profile.needsTimeToRespond) {
    parts.push('- Needs time to respond - don\'t rush');
  }

  // Emotional
  parts.push(`- Emotional processing: ${profile.emotionalProcessing}`);
  if (profile.sensitivityLevel === 'highly_sensitive') {
    parts.push('- Highly sensitive - be gentle');
  }
  if (profile.emotionalIntelligence === 'high') {
    parts.push('- High emotional intelligence - can handle nuance');
  }

  // Social
  parts.push(`- Social orientation: ${profile.socialOrientation}`);

  // Structure
  parts.push(`- Structure preference: ${profile.structurePreference}`);

  // Adaptations
  parts.push('\nADAPT YOUR RESPONSES:');
  if (adaptations.useMetaphors) parts.push('- Use metaphors and analogies');
  if (adaptations.useExamples) parts.push('- Give concrete examples');
  if (adaptations.useStepByStep) parts.push('- Be step-by-step and clear');
  if (adaptations.showBigPicture) parts.push('- Connect to bigger picture');
  if (adaptations.validateFirst) parts.push('- Validate emotions before anything else');
  if (adaptations.allowWandering) parts.push('- Allow conversation to wander');
  if (adaptations.provideStructure) parts.push('- Provide clear structure');
  if (adaptations.preferBrief) parts.push('- Keep responses brief');
  if (adaptations.giveTimeToThink) parts.push('- Don\'t ask rapid questions');

  // Strengths
  if (profile.discoveredStrengths.length > 0) {
    parts.push(`\nKNOWN STRENGTHS: ${profile.discoveredStrengths.join(', ')}`);
  }

  return parts.join('\n');
}
