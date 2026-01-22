# Mood Leaf - Project Handoff

## Project Overview

**Mood Leaf** is an AI-powered journaling and coaching app that adapts to how each user thinks.

### Core Philosophy
- **MoodPrint**: Every person has a unique fingerprint of how they think, feel, and communicate
- Learn HOW someone thinks, not IF they're smart
- Make AI feel human, not robotic
- Own user data locally (survive without Claude)
- Self-improve through scoring and learning

### Target Audience
- v1: Women (architecture is gender-neutral for future expansion)
- People who journal for emotional processing
- Those seeking an adaptive AI companion

---

## Architecture Summary

**MoodPrint** is the central concept - the unique fingerprint of how someone thinks, feels, and communicates.

```
┌──────────────────────────────────────────────────────────────┐
│                      MOODPRINT                                │
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

**MoodPrint captures:**
- **Cognitive Profile**: Patterns, details, stories, feelings - HOW they think
- **Memory Tiers**: Short-term (session), mid-term (weekly), long-term (core identity)
- **Conversation Patterns**: Preferred tone, length, timing, what works/doesn't work
- **Quality Metrics**: Average scores, common issues, profile completeness

---

## Current State

### What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| Claude API integration | ✅ Active | Main chat backend |
| Conversation Controller | ✅ Active | Rules layer for human-ness |
| Cognitive Profile Service | ✅ Backend ready | Using defaults until UI built |
| Human Score Service | ✅ Active | Scoring every response |
| Memory Tier Service | ✅ Active | Short/mid/long term memory |
| Coach Mode Skills | ✅ Active | ~45 skills available |
| Coach Modes Picker | ✅ Active | Sparkle button UI |
| Text-to-Speech | ✅ Ready | Google Cloud TTS integration |
| Breathing Ball | ✅ Active | Animated breathing component |
| Journal Entry | ✅ Active | Basic journaling |

### What Needs Building

| Component | Priority | Notes |
|-----------|----------|-------|
| Cognitive Profile Onboarding UI | High | Backend ready, needs screens |
| Profile Reveal Screen | High | Show user their profile |
| Memory Compression Trigger | Medium | Weekly or on app close |
| Local LLM Integration | Low | Future - Ollama/llama.cpp |
| Local Scorer Training | Low | Need 500+ Claude examples |

---

## Key Files

### Core Services

| File | Purpose |
|------|---------|
| `services/moodPrintService.ts` | **MoodPrint synthesis** - combines all systems |
| `services/claudeAPIService.ts` | Orchestrates all services, calls Claude |
| `services/conversationController.ts` | Human-ness rules layer |
| `services/cognitiveProfileService.ts` | Thinking style detection |
| `services/humanScoreService.ts` | Response quality scoring |
| `services/memoryTierService.ts` | Three-tier local memory |
| `services/coachModeService.ts` | Skill modes (breathing, CBT, etc.) |
| `services/textToSpeechService.ts` | Google Cloud TTS |

### UI Components

| File | Purpose |
|------|---------|
| `app/(tabs)/coach/index.tsx` | Main coach chat screen |
| `components/CoachModesPicker.tsx` | Mode selection UI |
| `components/BreathingBall.tsx` | Animated breathing component |

### Storage Keys

All data stored locally via AsyncStorage:

```typescript
STORAGE_KEYS = {
  COGNITIVE_PROFILE: '@moodleaf_cognitive_profile',
  ONBOARDING_PROGRESS: '@moodleaf_onboarding_progress',
  SHORT_TERM_MEMORY: '@moodleaf_short_term',
  MID_TERM_MEMORIES: '@moodleaf_mid_term',
  LONG_TERM_MEMORY: '@moodleaf_long_term',
  SCORED_EXCHANGES: '@moodleaf_scored_exchanges',
  SCORE_STATS: '@moodleaf_score_stats',
}
```

---

## How It Works

### Response Generation Flow

```
1. User sends message
2. Crisis check (immediate return if detected)
3. Load all contexts:
   - Cognitive profile (how they think)
   - Memory (what they've shared)
   - Life context, health, calendar, etc.
4. Track in session memory
5. Generate conversation directives:
   - Energy matching
   - Mood adaptation
   - Cognitive adaptations
   - AI tick blocking
6. Build system prompt with all context
7. Call Claude API
8. Score response in background
9. Track assistant response in memory
10. Return to user
```

### Cognitive Profile Flow

```
1. Onboarding questions (5-8 questions)
2. Questions adapt based on responses
3. Profile stored locally
4. Profile shapes every response:
   - Use metaphors? Step-by-step?
   - Validate first? Solutions first?
   - Open questions? Specific questions?
5. Profile evolves over time from feedback
```

### Scoring Flow

```
1. Every response scored locally (instant)
2. Claude scoring runs in background (if API key)
3. Scores saved with exchanges
4. After 500+ Claude scores → can train local scorer
5. Local scorer replaces Claude → full independence
```

---

## Dependencies

### Required
- React Native / Expo
- AsyncStorage (local storage)
- Claude API key (for AI features)

### Optional
- Google Cloud TTS API key (for voice)

### Future
- Ollama (local LLM)

---

## Configuration

### Environment / Settings

```typescript
// User provides via Settings screen:
- Claude API Key (required for AI)
- Google TTS API Key (optional for voice)
- Coach persona selection
- TTS voice preferences
```

### Coach Personas

7 personas available, each with distinct personality:
- Clover (warm bestie)
- Spark (energetic hype)
- Willow (wise sage)
- Luna (mindful guide)
- Ridge (action coach)
- Flint (straight shooter)
- Fern (cozy blanket)

---

## Data Privacy

### What Stays Local
- All journal entries
- Cognitive profile
- Memory (short, mid, long term)
- Conversation history
- Scored exchanges

### What Goes to Claude
- Messages (for response generation)
- Context (anonymized patterns)
- NOT: names, identifiable info

### Export/Import
```typescript
await exportMemory() → JSON string
await importMemory(json) → boolean
await clearAllMemory() → void
```

---

## Extending the System

### Adding a New Cognitive Dimension

1. Add type to `cognitiveProfileService.ts`
2. Add to `CognitiveProfile` interface
3. Add onboarding question to `ONBOARDING_QUESTIONS`
4. Add to `getCoachAdaptations()` if affects responses
5. Add to `getCognitiveProfileContextForLLM()`

### Adding a New Conversation Rule

1. Add to `ResponseDirectives` interface
2. Add logic in `generateResponseDirectives()`
3. Add prompt text in `buildPromptModifiers()`

### Adding a New Memory Type

1. Add interface for new structure
2. Add storage key
3. Add getter/setter functions
4. Add to `getMemoryContextForLLM()` if should be in prompts

### Adding Local LLM

1. All services work unchanged (LLM-agnostic)
2. Create `localLLMService.ts`
3. Swap calls in `claudeAPIService.ts`
4. Need MORE compression (local = smaller context)
5. Claude becomes evaluator-only, then optional

---

## Known Issues / Considerations

### Technical
- Cognitive profile using defaults until onboarding UI built
- Memory compression not auto-triggered (manual or periodic needed)
- Local scorer needs 500+ Claude examples before viable

### Design
- Validation vs solutions is weighted, not binary
- No jargon policy (no MBTI, no clinical labels)
- Gender-neutral architecture, women-focused content v1

---

## Recommended Next Steps

1. **Build onboarding UI** - Use existing service, just need screens
2. **Add profile reveal** - Show users their profile after onboarding
3. **Trigger weekly compression** - Call `compressToMidTerm()` periodically
4. **Monitor scores** - Use `getScoreStats()` to see patterns
5. **Collect training data** - Need 500+ Claude-scored exchanges

---

## Contacts / Resources

- **Documentation**: `/docs/` folder
- **Architecture**: `HYBRID_AI_ARCHITECTURE.md`
- **Cognitive System**: `COGNITIVE_PROFILE_SYSTEM.md`
- **User Manual**: `USER_MANUAL.md`
- **Dev Guide**: `DEVELOPMENT_GUIDE.md`

---

## Quick Commands for Development

```bash
# Start development
npx expo start

# Test services manually (in app or REPL)
import { getScoreStats } from './services/humanScoreService';
const stats = await getScoreStats();

import { getCognitiveProfile } from './services/cognitiveProfileService';
const profile = await getCognitiveProfile();

import { getMemoryContextForLLM } from './services/memoryTierService';
const context = await getMemoryContextForLLM();
```

---

*Last updated: January 2026*
