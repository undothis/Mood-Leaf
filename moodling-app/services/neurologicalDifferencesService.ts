/**
 * Neurological Differences Service
 *
 * Detects and respects neurological differences that affect how
 * coaching techniques should be selected.
 *
 * This is CRITICAL because many standard techniques assume abilities
 * that not everyone has:
 * - Visualization assumes mental imagery (aphantasia = can't do this)
 * - "Notice your self-talk" assumes internal monologue (some don't have this)
 * - "Imagine hearing a calming voice" assumes auditory imagination
 *
 * Using the wrong technique isn't just ineffective - it's frustrating
 * and can damage trust.
 *
 * This service is SEPARATE from cognitive profile because:
 * 1. These are neurological facts, not preferences
 * 2. They require hard constraints on technique selection
 * 3. They're stable over time (don't change like mood)
 * 4. Modular control for updates and extensions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Mental imagery ability (visualization)
 * The aphantasia → hyperphantasia spectrum
 */
export type MentalImageryAbility =
  | 'aphantasia'           // Cannot visualize at all - "mind's eye is blind"
  | 'hypophantasia'        // Weak/dim mental images
  | 'typical'              // Average visualization ability
  | 'hyperphantasia';      // Extremely vivid, almost real imagery

/**
 * Internal monologue presence
 * Some people have constant inner speech, others think in abstract concepts
 */
export type InternalMonologue =
  | 'constant'             // Always talking to themselves internally
  | 'frequent'             // Often have inner speech
  | 'situational'          // Only in certain contexts
  | 'rare'                 // Rarely have verbal thoughts
  | 'none';                // Think in concepts/feelings, not words

/**
 * Auditory imagination
 * Can you "hear" sounds in your head?
 */
export type AuditoryImagination =
  | 'vivid'                // Can clearly "hear" music, voices, sounds
  | 'moderate'             // Some auditory imagination
  | 'weak'                 // Faint or unclear
  | 'none';                // Cannot imagine sounds

/**
 * Prospective imagination
 * Can you imagine future scenarios?
 */
export type ProspectiveImagination =
  | 'vivid'                // Can vividly imagine future scenarios
  | 'conceptual'           // Understand future but can't "see" it
  | 'limited';             // Difficulty imagining future scenarios

/**
 * Spatial reasoning ability
 */
export type SpatialReasoning =
  | 'strong'               // Can mentally rotate objects, navigate well
  | 'moderate'             // Average spatial ability
  | 'weak';                // Difficulty with spatial tasks

/**
 * Time perception
 */
export type TimePerception =
  | 'accurate'             // Good sense of time passing
  | 'time_blind'           // Often loses track of time
  | 'hyperaware';          // Very aware of time, maybe anxiously so

/**
 * Complete neurological profile
 */
export interface NeurologicalProfile {
  // Core imagery abilities
  mentalImagery: MentalImageryAbility;
  auditoryImagination: AuditoryImagination;
  prospectiveImagination: ProspectiveImagination;

  // Internal experience
  internalMonologue: InternalMonologue;

  // Spatial and temporal
  spatialReasoning: SpatialReasoning;
  timePerception: TimePerception;

  // Sensory processing
  sensoryProcessingSensitivity: 'high' | 'moderate' | 'low';

  // Self-reported conditions (optional, user-disclosed)
  selfReportedConditions: string[];  // e.g., "ADHD", "autism", "dyslexia"

  // Metadata
  assessmentComplete: boolean;
  lastUpdated: string;
  confidenceLevel: number;  // 0-100
}

/**
 * Technique constraints based on neurological profile
 */
export interface TechniqueConstraints {
  // Visualization
  canUseVisualization: boolean;
  visualizationAlternative: 'conceptual' | 'sensory' | 'verbal' | 'kinesthetic';

  // Inner voice
  canUseInnerVoiceWork: boolean;
  innerVoiceAlternative: 'feelings' | 'body' | 'external' | 'concepts';

  // Audio
  canUseAudioImagination: boolean;

  // Future visualization
  canUseFutureVisualization: boolean;
  futureAlternative: 'goals_list' | 'values_based' | 'action_steps';

  // Spatial
  canUseSpatialMetaphors: boolean;

  // Techniques that are ENHANCED by their neurology
  enhancedTechniques: string[];

  // Techniques to AVOID entirely
  avoidTechniques: string[];
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = '@moodleaf_neurological_profile';

const DEFAULT_PROFILE: NeurologicalProfile = {
  mentalImagery: 'typical',
  auditoryImagination: 'moderate',
  prospectiveImagination: 'vivid',
  internalMonologue: 'frequent',
  spatialReasoning: 'moderate',
  timePerception: 'accurate',
  sensoryProcessingSensitivity: 'moderate',
  selfReportedConditions: [],
  assessmentComplete: false,
  lastUpdated: new Date().toISOString(),
  confidenceLevel: 0,
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get neurological profile
 */
export async function getNeurologicalProfile(): Promise<NeurologicalProfile> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
  } catch (error) {
    console.error('[Neurological] Failed to get profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save neurological profile
 */
export async function saveNeurologicalProfile(
  profile: Partial<NeurologicalProfile>
): Promise<void> {
  try {
    const current = await getNeurologicalProfile();
    const updated = {
      ...current,
      ...profile,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[Neurological] Failed to save profile:', error);
  }
}

/**
 * Generate technique constraints from neurological profile
 */
export async function getTechniqueConstraints(): Promise<TechniqueConstraints> {
  const profile = await getNeurologicalProfile();

  const constraints: TechniqueConstraints = {
    // Visualization
    canUseVisualization:
      profile.mentalImagery === 'typical' ||
      profile.mentalImagery === 'hyperphantasia',

    visualizationAlternative:
      profile.mentalImagery === 'aphantasia' ? 'conceptual' :
      profile.mentalImagery === 'hypophantasia' ? 'sensory' : 'verbal',

    // Inner voice
    canUseInnerVoiceWork:
      profile.internalMonologue === 'constant' ||
      profile.internalMonologue === 'frequent',

    innerVoiceAlternative:
      profile.internalMonologue === 'none' ? 'feelings' :
      profile.internalMonologue === 'rare' ? 'body' : 'concepts',

    // Audio
    canUseAudioImagination:
      profile.auditoryImagination === 'vivid' ||
      profile.auditoryImagination === 'moderate',

    // Future visualization
    canUseFutureVisualization:
      profile.prospectiveImagination === 'vivid' &&
      (profile.mentalImagery === 'typical' || profile.mentalImagery === 'hyperphantasia'),

    futureAlternative:
      profile.prospectiveImagination === 'limited' ? 'action_steps' :
      profile.prospectiveImagination === 'conceptual' ? 'values_based' : 'goals_list',

    // Spatial
    canUseSpatialMetaphors: profile.spatialReasoning !== 'weak',

    // Build enhanced and avoid lists
    enhancedTechniques: [],
    avoidTechniques: [],
  };

  // Populate enhanced techniques
  if (profile.mentalImagery === 'hyperphantasia') {
    constraints.enhancedTechniques.push(
      'guided_imagery',
      'visualization_meditation',
      'mental_rehearsal',
      'safe_place_visualization'
    );
  }

  if (profile.internalMonologue === 'constant') {
    constraints.enhancedTechniques.push(
      'cognitive_restructuring',
      'thought_records',
      'self_talk_reframing'
    );
  }

  if (profile.sensoryProcessingSensitivity === 'high') {
    constraints.enhancedTechniques.push(
      'grounding_5_senses',
      'body_scan',
      'sensory_soothing'
    );
  }

  // Populate avoid techniques
  if (!constraints.canUseVisualization) {
    constraints.avoidTechniques.push(
      'visualization',
      'guided_imagery',
      'mental_rehearsal',
      'safe_place_visualization',
      'future_self_visualization'
    );
  }

  if (!constraints.canUseInnerVoiceWork) {
    constraints.avoidTechniques.push(
      'self_talk_reframing',
      'inner_critic_dialogue',
      'thought_challenging'
    );
  }

  if (!constraints.canUseAudioImagination) {
    constraints.avoidTechniques.push(
      'imagined_conversation',
      'hearing_calm_voice'
    );
  }

  return constraints;
}

// ============================================================================
// Onboarding Questions
// ============================================================================

export interface NeurologicalQuestion {
  id: string;
  question: string;
  subtext?: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
    indicates: Partial<NeurologicalProfile>;
  }>;
}

/**
 * Questions to assess neurological differences
 */
export const NEUROLOGICAL_QUESTIONS: NeurologicalQuestion[] = [
  {
    id: 'mental_imagery',
    question: "When someone says 'picture a beach', what happens in your mind?",
    subtext: "This isn't about imagination skill - brains genuinely work differently here.",
    options: [
      {
        id: 'vivid',
        label: "I see it clearly, almost like a photo or movie",
        description: "Colors, details, movement - it's all there",
        indicates: { mentalImagery: 'hyperphantasia' }
      },
      {
        id: 'moderate',
        label: "I see something, but it's fuzzy or fleeting",
        description: "I can imagine it, but it's not vivid",
        indicates: { mentalImagery: 'typical' }
      },
      {
        id: 'weak',
        label: "I get a vague sense, but not really a picture",
        description: "More like knowing what a beach is than seeing one",
        indicates: { mentalImagery: 'hypophantasia' }
      },
      {
        id: 'nothing',
        label: "Nothing visual happens - I just think the concept 'beach'",
        description: "My mind's eye is basically blind",
        indicates: { mentalImagery: 'aphantasia' }
      }
    ]
  },
  {
    id: 'internal_voice',
    question: "Do you have an internal voice - like talking to yourself in your head?",
    subtext: "Some people think in words, others in concepts, images, or feelings.",
    options: [
      {
        id: 'constant',
        label: "Yes, constantly - there's always a voice narrating",
        indicates: { internalMonologue: 'constant' }
      },
      {
        id: 'frequent',
        label: "Often, especially when thinking through things",
        indicates: { internalMonologue: 'frequent' }
      },
      {
        id: 'sometimes',
        label: "Sometimes, but I also think in other ways",
        indicates: { internalMonologue: 'situational' }
      },
      {
        id: 'rarely',
        label: "Rarely - my thoughts aren't usually in words",
        indicates: { internalMonologue: 'rare' }
      },
      {
        id: 'never',
        label: "I don't really have verbal thoughts",
        description: "I think in feelings, concepts, or abstract ways",
        indicates: { internalMonologue: 'none' }
      }
    ]
  },
  {
    id: 'auditory_imagination',
    question: "Can you 'hear' music in your head - like actually hear it, not just remember it exists?",
    options: [
      {
        id: 'vivid',
        label: "Yes, I can hear songs clearly in my mind",
        description: "I can replay music almost like it's playing",
        indicates: { auditoryImagination: 'vivid' }
      },
      {
        id: 'moderate',
        label: "Sort of - I can recall melodies but it's not vivid",
        indicates: { auditoryImagination: 'moderate' }
      },
      {
        id: 'weak',
        label: "Barely - I know the song but can't really 'hear' it",
        indicates: { auditoryImagination: 'weak' }
      },
      {
        id: 'none',
        label: "No - I can't imagine sounds at all",
        indicates: { auditoryImagination: 'none' }
      }
    ]
  },
  {
    id: 'future_imagination',
    question: "When you think about a future event, can you 'see' yourself there?",
    subtext: "Like imagining yourself at a party next week, or in a new job.",
    options: [
      {
        id: 'vivid',
        label: "Yes, I can visualize future scenarios clearly",
        indicates: { prospectiveImagination: 'vivid' }
      },
      {
        id: 'conceptual',
        label: "I can think about it, but not visually 'see' it",
        description: "I understand the future conceptually",
        indicates: { prospectiveImagination: 'conceptual' }
      },
      {
        id: 'limited',
        label: "It's hard for me to imagine future scenarios",
        indicates: { prospectiveImagination: 'limited' }
      }
    ]
  },
  {
    id: 'time_awareness',
    question: "How would you describe your sense of time?",
    options: [
      {
        id: 'accurate',
        label: "Pretty accurate - I usually know roughly what time it is",
        indicates: { timePerception: 'accurate' }
      },
      {
        id: 'time_blind',
        label: "Time blind - hours can pass without me noticing",
        description: "I'm often shocked when I check the time",
        indicates: { timePerception: 'time_blind' }
      },
      {
        id: 'hyperaware',
        label: "Hyperaware - I'm very conscious of time passing",
        description: "Sometimes anxiously so",
        indicates: { timePerception: 'hyperaware' }
      }
    ]
  },
  {
    id: 'sensory_sensitivity',
    question: "How sensitive are you to sensory input (sounds, lights, textures)?",
    options: [
      {
        id: 'high',
        label: "Very sensitive - I notice things others don't",
        description: "Certain sounds, lights, or textures can be overwhelming",
        indicates: { sensoryProcessingSensitivity: 'high' }
      },
      {
        id: 'moderate',
        label: "Moderate - some things bother me but I cope",
        indicates: { sensoryProcessingSensitivity: 'moderate' }
      },
      {
        id: 'low',
        label: "Not very - I'm pretty unfazed by sensory stuff",
        indicates: { sensoryProcessingSensitivity: 'low' }
      }
    ]
  }
];

/**
 * Record an answer to a neurological question
 */
export async function recordNeurologicalAnswer(
  questionId: string,
  answerId: string
): Promise<void> {
  const question = NEUROLOGICAL_QUESTIONS.find(q => q.id === questionId);
  if (!question) return;

  const option = question.options.find(o => o.id === answerId);
  if (!option) return;

  const profile = await getNeurologicalProfile();
  const updated = { ...profile, ...option.indicates };

  // Update confidence based on answered questions
  const answeredCount = NEUROLOGICAL_QUESTIONS.filter(q => {
    const key = Object.keys(q.options[0].indicates)[0] as keyof NeurologicalProfile;
    return profile[key] !== DEFAULT_PROFILE[key];
  }).length + 1;

  updated.confidenceLevel = Math.min(100, (answeredCount / NEUROLOGICAL_QUESTIONS.length) * 100);

  if (answeredCount >= NEUROLOGICAL_QUESTIONS.length) {
    updated.assessmentComplete = true;
  }

  await saveNeurologicalProfile(updated);
}

// ============================================================================
// LLM Context
// ============================================================================

/**
 * Generate LLM context for neurological differences
 * This is CRITICAL - tells the LLM what NOT to do
 */
export async function getNeurologicalContextForLLM(): Promise<string> {
  const profile = await getNeurologicalProfile();
  const constraints = await getTechniqueConstraints();

  if (!profile.assessmentComplete && profile.confidenceLevel < 30) {
    return ''; // Not enough info yet
  }

  const parts: string[] = ['CRITICAL - NEUROLOGICAL ADAPTATIONS:'];
  parts.push('(These are hard constraints, not preferences. Respect them.)');
  parts.push('');

  // Aphantasia / visualization
  if (!constraints.canUseVisualization) {
    parts.push('**CANNOT VISUALIZE (aphantasia)**');
    parts.push('- NEVER say: "picture this", "visualize", "imagine seeing", "close your eyes and see"');
    parts.push('- NEVER use guided imagery or visualization exercises');
    parts.push(`- INSTEAD use: ${constraints.visualizationAlternative} descriptions`);
    parts.push('');
  } else if (profile.mentalImagery === 'hyperphantasia') {
    parts.push('Has HYPERPHANTASIA (extremely vivid imagery)');
    parts.push('- Visual metaphors and guided imagery work VERY well');
    parts.push('');
  }

  // Internal monologue
  if (!constraints.canUseInnerVoiceWork) {
    parts.push('**NO INTERNAL MONOLOGUE**');
    parts.push('- NEVER ask: "what is your inner voice saying", "notice your self-talk"');
    parts.push('- They don\'t think in words');
    parts.push(`- INSTEAD ask about: ${constraints.innerVoiceAlternative}`);
    parts.push('');
  }

  // Audio imagination
  if (!constraints.canUseAudioImagination) {
    parts.push('**CANNOT IMAGINE SOUNDS**');
    parts.push('- Don\'t use audio-based imagery');
    parts.push('');
  }

  // Future visualization
  if (!constraints.canUseFutureVisualization) {
    parts.push('**CANNOT VISUALIZE FUTURE**');
    parts.push('- Don\'t say "picture yourself in 5 years"');
    parts.push(`- INSTEAD use: ${constraints.futureAlternative}`);
    parts.push('');
  }

  // Time blindness
  if (profile.timePerception === 'time_blind') {
    parts.push('Has TIME BLINDNESS - be concrete about time, don\'t assume time awareness');
    parts.push('');
  }

  // Sensory sensitivity
  if (profile.sensoryProcessingSensitivity === 'high') {
    parts.push('HIGH SENSORY SENSITIVITY - grounding exercises work well');
    parts.push('');
  }

  // Avoid list
  if (constraints.avoidTechniques.length > 0) {
    parts.push(`AVOID these techniques: ${constraints.avoidTechniques.join(', ')}`);
    parts.push('');
  }

  // Enhanced list
  if (constraints.enhancedTechniques.length > 0) {
    parts.push(`ENHANCED effectiveness: ${constraints.enhancedTechniques.join(', ')}`);
  }

  return parts.join('\n');
}

// ============================================================================
// Profile Reveal
// ============================================================================

/**
 * Generate reveal text explaining their neurological differences
 */
export async function generateNeurologicalReveal(): Promise<string | null> {
  const profile = await getNeurologicalProfile();

  const hasDifferences =
    profile.mentalImagery === 'aphantasia' ||
    profile.mentalImagery === 'hypophantasia' ||
    profile.mentalImagery === 'hyperphantasia' ||
    profile.internalMonologue === 'none' ||
    profile.internalMonologue === 'rare' ||
    profile.auditoryImagination === 'none' ||
    profile.timePerception === 'time_blind' ||
    profile.sensoryProcessingSensitivity === 'high';

  if (!hasDifferences) {
    return null;
  }

  const parts: string[] = ["**About your mind's unique wiring:**"];
  parts.push('');

  if (profile.mentalImagery === 'aphantasia') {
    parts.push("You have **aphantasia** - your mind's eye doesn't create visual images. This isn't a deficiency; it's a different way of thinking. You likely excel at conceptual and abstract thinking.");
    parts.push('');
    parts.push("I will NEVER ask you to 'visualize' or 'picture' anything - that simply doesn't work for you, and that's completely fine. We'll use conceptual approaches instead.");
  } else if (profile.mentalImagery === 'hypophantasia') {
    parts.push("Your mental imagery is on the **subtler side**. Visualization exercises might feel forced or frustrating. I'll use more sensory or conceptual approaches instead.");
  } else if (profile.mentalImagery === 'hyperphantasia') {
    parts.push("You have **hyperphantasia** - extremely vivid mental imagery. This is a gift for creativity and memory. Visual metaphors and imagery-based reflection will work really well for you.");
  }

  if (profile.internalMonologue === 'none') {
    parts.push('');
    parts.push("You **think without an internal voice** - your thoughts aren't in words. This is more common than people realize. I won't ask 'what is your inner voice saying' because that's not how your mind works. Instead, we'll explore through feelings, concepts, or body sensations.");
  } else if (profile.internalMonologue === 'rare') {
    parts.push('');
    parts.push("Your internal monologue is **quieter than most**. I'll focus more on feelings and sensations than verbal self-talk.");
  }

  if (profile.auditoryImagination === 'none') {
    parts.push('');
    parts.push("You **can't imagine sounds** in your head. Audio-based techniques aren't for you.");
  }

  if (profile.timePerception === 'time_blind') {
    parts.push('');
    parts.push("You experience **time blindness** - hours can pass without you noticing. This is common and nothing to be ashamed of. I'll be concrete about time rather than assuming you'll track it.");
  }

  if (profile.sensoryProcessingSensitivity === 'high') {
    parts.push('');
    parts.push("You have **high sensory sensitivity** - you notice things others miss. This can be overwhelming sometimes, but it's also a form of awareness. Grounding exercises that use your senses will work well for you.");
  }

  return parts.join('\n');
}
