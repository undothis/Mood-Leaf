# Mood Leaf - Development Guide

## Architecture Overview

Mood Leaf uses a hybrid AI architecture centered around the **MoodPrint** - the synthesis of everything we know about a person.

**MoodPrint** (`moodPrintService.ts`) combines four core systems:

```
┌──────────────────────────────────────────────────────────────┐
│                     MOOD PRINT                                │
│  (The synthesis of everything we know about a person)        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Cognitive  │  │   Memory    │  │   Conversation      │  │
│  │   Profile   │  │   Tiers     │  │   Controller        │  │
│  │             │  │             │  │                     │  │
│  │ How they    │  │ What they   │  │ How to talk         │  │
│  │ think       │  │ shared      │  │ to them             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│                  ┌─────────────────┐                        │
│                  │  Human Score    │                        │
│                  │  Service        │                        │
│                  │                 │                        │
│                  │ Did we get it   │                        │
│                  │ right?          │                        │
│                  └─────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Services

### 0. MoodPrint Service (The Synthesis)
**File:** `services/moodPrintService.ts`

MoodPrint is the synthesis of everything we know about a person - their unique fingerprint of how they think, feel, and communicate.

**Key exports:**
```typescript
// Get the complete MoodPrint
getMoodPrint(): Promise<MoodPrint>

// Get a concise summary (for display or quick context)
getMoodPrintSummary(): Promise<MoodPrintSummary>

// Get context formatted for LLM injection
getMoodPrintContextForLLM(): Promise<string>

// Generate response directives using full MoodPrint
generateMoodPrintDirectives(sessionId, messages, lastMessage): Promise<ResponseDirectives>

// Export for debugging/backup
exportMoodPrint(): Promise<string>
debugMoodPrint(): Promise<void>
```

**MoodPrint structure:**
```typescript
{
  // Core components
  cognitiveProfile: CognitiveProfile,    // How they think
  coachAdaptations: CoachAdaptations,    // How to adapt
  longTermMemory: LongTermMemory,        // What we know

  // Patterns learned over time
  patterns: {
    preferredResponseLength: 'brief' | 'moderate' | 'detailed',
    preferredTone: 'gentle' | 'warm' | 'energetic' | 'direct' | 'playful',
    respondsWellTo: string[],        // ["metaphors", "validation"]
    doesNotRespondWellTo: string[],  // ["immediate solutions"]
  },

  // Current state
  currentState: {
    isInSession: boolean,
    currentMood?: string,
    currentEnergy?: 'low' | 'medium' | 'high',
    recentTopics: string[],
  },

  // Quality metrics
  qualityMetrics: {
    averageHumannessScore: number,
    profileCompleteness: number,
    onboardingComplete: boolean,
  }
}
```

---

### 1. Conversation Controller
**File:** `services/conversationController.ts`

The rules layer that makes responses feel human.

**Key exports:**
```typescript
// Build context from conversation state
buildConversationContext(sessionId, messages, lastMessage): Promise<ConversationContext>

// Generate response rules
generateResponseDirectives(ctx): Promise<ResponseDirectives>

// Convert directives to prompt text
buildPromptModifiers(directives): string

// Detection utilities
detectUserEnergy(message): 'low' | 'medium' | 'high'
detectUserMood(message): 'distressed' | 'anxious' | 'neutral' | 'calm' | 'positive'
detectHeavyTopic(message): boolean
extractTopics(message): string[]
```

**ResponseDirectives shape:**
```typescript
{
  artificialDelay: number,       // ms pause before response
  maxLength: 'brief' | 'moderate' | 'detailed',
  tone: 'gentle' | 'warm' | 'energetic' | 'direct' | 'playful',
  allowQuestions: boolean,
  maxQuestions: number,
  allowMemoryCallback: boolean,
  avoidPhrases: string[],        // AI ticks to never use
  cognitiveAdaptations: {
    useMetaphors: boolean,
    useExamples: boolean,
    useStepByStep: boolean,
    showBigPicture: boolean,
    validateFirst: boolean,
    allowWandering: boolean,
    provideStructure: boolean,
    giveTimeToThink: boolean,
    questionType: 'open' | 'specific' | 'reflective',
  }
}
```

---

### 2. Cognitive Profile Service
**File:** `services/cognitiveProfileService.ts`

Discovers how someone thinks (not IF they're smart).

**Key exports:**
```typescript
// Profile management
getCognitiveProfile(): Promise<CognitiveProfile>
saveCognitiveProfile(profile): Promise<void>

// Onboarding
getNextOnboardingQuestion(): Promise<OnboardingQuestion | null>
recordOnboardingAnswer(questionId, answer): Promise<void>
completeOnboarding(): Promise<void>

// Profile reveal
generateProfileReveal(): Promise<string>

// Coach adaptations
getCoachAdaptations(): Promise<CoachAdaptations>
getCognitiveProfileContextForLLM(): Promise<string>
```

**Profile dimensions:**
- `primaryProcessing`: patterns | details | stories | feelings | actions | synthesis
- `learningStyles`: visual | auditory | kinesthetic | reading | social | solitary
- `socialOrientation`: energized_by_people | drained_by_people | selective | situational
- `emotionalProcessing`: feeler_first | thinker_first | integrated | action_oriented | delayed
- `communicationStyle`: direct | exploratory | reflective | collaborative | metaphorical
- `structurePreference`: loves_structure | needs_flexibility | structured_start | emergent

**Onboarding questions:** Defined in `ONBOARDING_QUESTIONS` array. Questions adapt based on `adaptiveDepth` property.

---

### 3. Human Score Service
**File:** `services/humanScoreService.ts`

Scores every AI response for quality.

**Key exports:**
```typescript
// Score an exchange (runs both local and Claude scoring)
scoreExchange(userMessage, aiResponse, context, options): Promise<HumannessScore>

// Local-only scoring (fast, always available)
scoreLocally(userMessage, aiResponse, context): HumannessScore

// Claude scoring (more accurate, background)
scoreWithClaude(userMessage, aiResponse, context, apiKey): Promise<HumannessScore | null>

// Stats and export
getScoreStats(): Promise<ScoreStats>
getScoredExchanges(): Promise<ScoredExchange[]>
exportForTraining(): Promise<string>
canTrainLocalScorer(): Promise<{ready, claudeExamples, needed}>
```

**Scoring rubric (100 points):**
- Natural language: 0-15
- Emotional timing: 0-20
- Brevity control: 0-15
- Memory use: 0-15
- Imperfection: 0-10
- Personality consistency: 0-15
- Avoided AI ticks: 0-10

---

### 4. Memory Tier Service
**File:** `services/memoryTierService.ts`

Three-tier memory system, all local.

**Key exports:**
```typescript
// Short-term (session)
startSession(): Promise<ShortTermMemory>
getCurrentSession(): Promise<ShortTermMemory | null>
addMessageToSession(role, content, mood?, energy?): Promise<void>
updateSessionTopics(topics): Promise<void>
endSession(): Promise<void>

// Mid-term (weekly summaries)
getMidTermMemories(): Promise<MidTermMemory[]>
saveMidTermMemory(memory): Promise<void>
compressToMidTerm(apiKey): Promise<boolean>  // Uses Claude

// Long-term (core identity)
getLongTermMemory(): Promise<LongTermMemory>
updateLongTermMemory(updates): Promise<void>
addRelationship(entry): Promise<void>
addLifeEvent(event): Promise<void>
addTrigger(trigger): Promise<void>
addCalmingFactor(factor): Promise<void>
addSensitivity(topic): Promise<void>

// Context for LLM
getMemoryContextForLLM(): Promise<string>

// Export/import
exportMemory(): Promise<string>
importMemory(json): Promise<boolean>
clearAllMemory(): Promise<void>
```

**Memory tiers:**
```
SHORT-TERM (session)
├── Last 20 messages verbatim
├── Current mood & energy
├── Topics discussed
└── Emotional arc

MID-TERM (weekly)
├── Summary (Claude-compressed)
├── Themes
├── Notable moments
└── Flags to monitor

LONG-TERM (permanent)
├── Communication preferences
├── Relationships
├── Triggers & calming factors
├── Life events
└── Sensitivities
```

---

## Integration Point: Claude API Service

**File:** `services/claudeAPIService.ts`

Orchestrates all services when generating a response.

**Flow:**
```typescript
async function sendMessage(message, context) {
  // 1. Crisis check
  if (detectCrisis(message)) return CRISIS_RESPONSE;

  // 2. Load all contexts
  const cognitiveProfileContext = await getCognitiveProfileContextForLLM();
  const memoryContext = await getMemoryContextForLLM();
  // ... plus health, calendar, journals, etc.

  // 3. Track in session memory
  await addMessageToSession('user', message, mood, energy);

  // 4. Get conversation controller directives
  const directives = await generateResponseDirectives(controllerCtx);
  const modifiers = buildPromptModifiers(directives);

  // 5. Build system prompt with all context
  const systemPrompt = basePrompt + coachMode + modifiers;

  // 6. Call Claude API
  const response = await fetch(...);

  // 7. Score in background
  scoreExchange(message, response, context, { apiKey });

  // 8. Track assistant response
  await addMessageToSession('assistant', response);

  return response;
}
```

---

## Adding New Features

### Adding a new cognitive dimension

1. Add type to `cognitiveProfileService.ts`:
```typescript
export type NewDimension = 'option1' | 'option2' | 'option3';
```

2. Add to `CognitiveProfile` interface

3. Add onboarding question to `ONBOARDING_QUESTIONS` array

4. Add to `getCoachAdaptations()` if it affects responses

5. Add to `getCognitiveProfileContextForLLM()` for prompt injection

### Adding a new conversation rule

1. Add to `ResponseDirectives` interface if new property needed

2. Add logic in `generateResponseDirectives()`:
```typescript
if (someCondition) {
  directives.newProperty = value;
}
```

3. Add prompt text in `buildPromptModifiers()`:
```typescript
if (directives.newProperty) {
  modifiers.push('New instruction for LLM');
}
```

### Adding a new memory type

1. Add interface for new memory structure

2. Add storage key to `STORAGE_KEYS`

3. Add getter/setter functions

4. Add to `getMemoryContextForLLM()` if should be in prompts

---

## Local LLM Integration (Future)

When adding Ollama/local LLM:

1. **All services work unchanged** - They're LLM-agnostic

2. **Create new LLM service:**
```typescript
// services/localLLMService.ts
export async function sendToLocalLLM(prompt, systemPrompt) {
  return fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      system: systemPrompt,
    })
  });
}
```

3. **Swap in claudeAPIService:**
```typescript
// Option: Use local or Claude based on config
const response = useLocalLLM
  ? await sendToLocalLLM(message, systemPrompt)
  : await sendToClaude(message, systemPrompt);
```

4. **Compression still needed** (local LLMs have smaller context windows)

5. **Claude becomes evaluator-only** then optional

---

## Testing

### Manual testing
```typescript
// Test conversation controller
const ctx = await buildConversationContext('test', [], 'I feel tired');
const directives = await generateResponseDirectives(ctx);
console.log(directives); // Should show: tone='gentle', maxLength='brief'

// Test cognitive profile
const profile = await getCognitiveProfile();
const adaptations = await getCoachAdaptations();
console.log(adaptations);

// Test scoring
const score = scoreLocally('I feel sad', 'I understand how you feel', {});
console.log(score); // Should penalize "I understand"
```

### Check scoring stats
```typescript
const stats = await getScoreStats();
console.log(stats.averageScore, stats.commonIssues);
```

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `moodPrintService.ts` | **MoodPrint synthesis** | ✅ Active |
| `conversationController.ts` | Human-ness rules | ✅ Active |
| `cognitiveProfileService.ts` | Thinking style | ✅ Active |
| `humanScoreService.ts` | Quality scoring | ✅ Active |
| `memoryTierService.ts` | Three-tier memory | ✅ Active |
| `claudeAPIService.ts` | Orchestration | ✅ Active |
| `coachModeService.ts` | Skill modes | ✅ Active |
| `textToSpeechService.ts` | Voice output | ✅ Ready |
