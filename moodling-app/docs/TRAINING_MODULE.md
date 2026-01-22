# Training Module: Path to Local LLM

This document describes how Mood Leaf collects training data and eventually moves to a local LLM that understands humans deeply.

---

## The Vision

Right now, Mood Leaf uses Claude API for conversations. But our goal is:

1. **Learn from Claude** - Collect scored examples of good human-like responses
2. **Learn from interviews** - Import insights from real user research about how humans think
3. **Distill knowledge** - Extract patterns into training data
4. **Train local model** - Eventually run a fine-tuned local LLM that "gets" people
5. **Claude becomes optional** - Use local model for most things, Claude for edge cases

---

## Current Training Data Collection

### Human-ness Scoring (`humanScoreService.ts`)

Every conversation is scored for "human-ness" - how natural and real it feels.

**What we score:**
| Category | Points | What It Measures |
|----------|--------|------------------|
| Natural Language | 0-15 | Sounds like a real person, not a robot |
| Emotional Timing | 0-20 | Response matches the emotional moment |
| Brevity Control | 0-15 | Length appropriate to context |
| Memory Use | 0-15 | Recalls past subtly, not creepily |
| Imperfection | 0-10 | Allows uncertainty ("I'm not sure") |
| Personality Consistency | 0-15 | Same "voice" across sessions |
| Avoided AI Ticks | 0-10 | No "I understand", "That's valid" |

**Two-layer scoring:**
1. **Local scoring** - Fast, runs immediately, heuristic-based
2. **Claude scoring** - Background, more accurate, costs API

All scored exchanges are saved. When we have 500+ Claude-scored examples, we can train a local scorer.

**Export for training:**
```typescript
import { exportForTraining } from './services/humanScoreService';

const trainingData = await exportForTraining();
// Returns JSON with all scored exchanges + stats
```

---

## Interview Import System

### Purpose

User research interviews contain gold: real humans explaining how their minds work. This system lets you import interview insights to enrich the app's understanding.

### Interview Data Structure

```typescript
interface InterviewInsight {
  id: string;
  sourceType: 'user_interview' | 'research_paper' | 'expert_input' | 'pattern_observation';
  source: string;              // "Interview with user #23", "ADHD study 2024", etc.
  dateCollected: string;

  // The insight itself
  category: InsightCategory;
  title: string;               // Short summary
  insight: string;             // The actual learning
  quotes?: string[];           // Direct quotes if available

  // How to use it
  coachingImplication: string; // How this should change coach behavior
  techniqueSuggestions?: string[];
  antiPatterns?: string[];     // Things NOT to do based on this

  // Validation
  confidenceLevel: 'hypothesis' | 'observed' | 'validated';
  relatedProfiles?: string[];  // Cognitive profiles this applies to
}

type InsightCategory =
  | 'cognitive_patterns'       // How people think
  | 'emotional_processing'     // How people feel
  | 'neurological_differences' // Aphantasia, ADHD, etc.
  | 'communication_needs'      // How people want to be talked to
  | 'motivation_patterns'      // What drives/blocks action
  | 'relationship_with_self'   // Self-talk, self-perception
  | 'crisis_patterns'          // What crisis looks like
  | 'recovery_patterns'        // What healing looks like
  | 'daily_rhythms'            // Energy patterns, timing
  | 'social_dynamics';         // How connection affects them
```

### Import Methods

**1. Manual Import (Admin/Research Interface)**
```typescript
import { importInterviewInsight } from './services/trainingDataService';

await importInterviewInsight({
  sourceType: 'user_interview',
  source: 'Interview with user #23 (cyclical thinker)',
  category: 'cognitive_patterns',
  title: 'Cyclical minds often interpret low phases as personal failure',
  insight: `Many users with pronounced cognitive cycles reported that during
    low phases, they believed something was "wrong" with them. Several used
    phrases like "I should be able to..." or "Why can't I just..."`,
  quotes: [
    "When I'm in a low phase, I genuinely forget that I've ever been productive",
    "It feels like the good times were luck and this is the real me"
  ],
  coachingImplication: `During detected low phases, proactively normalize the
    experience. Don't wait for them to express shame. Frame low phases as
    integration, not failure. Reference their high phase capabilities.`,
  antiPatterns: [
    "Don't say 'You were so productive last week' - this highlights the gap",
    "Don't suggest they 'try harder' during low phases",
    "Don't imply the low phase is a choice or attitude problem"
  ],
  confidenceLevel: 'validated',
  relatedProfiles: ['cyclical_pronounced', 'burst_recovery']
});
```

**2. Bulk Import from Interview Transcripts**
```typescript
import { processInterviewTranscript } from './services/trainingDataService';

// Feed raw transcript, AI extracts insights
const insights = await processInterviewTranscript({
  transcript: rawTranscriptText,
  interviewType: 'user_research',
  participantProfile: {
    cognitiveMode: 'conceptual_systems',
    neurodivergence: ['aphantasia'],
    // ...
  }
});

// Review and approve extracted insights
for (const insight of insights) {
  await approveInsight(insight.id); // or rejectInsight()
}
```

**3. Import from Research Links**
```typescript
import { importFromResearchLink } from './services/trainingDataService';

// Point to a research paper, blog post, or resource
await importFromResearchLink({
  url: 'https://example.com/aphantasia-study-2024',
  type: 'research_paper',
  extractionPrompt: 'Focus on coaching implications and communication adaptations'
});
```

---

## Training Data Categories

### 1. Conversation Examples (Auto-collected)
- Every user-coach exchange
- Scored for human-ness
- Tagged with context (energy, mood, time, profile)
- **Use:** Train response generation

### 2. Interview Insights (Imported)
- Patterns from user research
- How different minds work
- What helps vs. harms
- **Use:** Train understanding, shape principles

### 3. Coach Corrections (User feedback)
- When users say "that's not helpful"
- Implicit negative signals (topic changes, disengagement)
- Explicit positive signals ("yes, exactly!")
- **Use:** Reinforcement learning signal

### 4. Profile-Outcome Correlations (Derived)
- Which approaches work for which profiles
- Technique effectiveness by cognitive mode
- Response length preferences by user type
- **Use:** Personalization training

---

## Integration with Core Principle Kernel

Interview insights feed into the kernel:

```
Interview Insights
       │
       ▼
┌──────────────────────┐
│ Pattern Extraction   │
│ (What did we learn?) │
└──────┬───────────────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────────────┐       ┌──────────────────────┐
│ Update CORE_BELIEFS  │       │ Add HARD_CONSTRAINTS │
│ (Philosophy evolves) │       │ (New "never do"s)    │
└──────────────────────┘       └──────────────────────┘
       │                                  │
       └──────────────────────────────────┤
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │ Update coach prompts │
                               │ (Better responses)   │
                               └──────────────────────┘
```

**Example:** Interview reveals that users with aphantasia feel dismissed when asked to "try visualizing anyway":

1. **Insight imported:** "Aphantasia users report frustration when visualization is suggested"
2. **Kernel updated:** `NO_VISUALIZATION_FOR_APHANTASIA` constraint strengthened
3. **Coach prompt updated:** Add explicit "NEVER suggest visualization for this user"
4. **Training data tagged:** All exchanges with aphantasic users marked for focus

---

## Path to Local LLM

### Phase 1: Data Collection (Current)
- [x] Human-ness scoring system
- [x] Conversation storage
- [ ] Interview import system
- [ ] Coach correction tracking
- **Goal:** 500+ Claude-scored examples

### Phase 2: Local Scorer
- Train small model to score human-ness
- Runs on device, no API needed
- Claude only for validation
- **Goal:** Local scoring matches Claude 85%+

### Phase 3: Response Ranking
- Generate multiple response candidates
- Local scorer ranks them
- Best response chosen without Claude
- **Goal:** 80% of responses use local ranking

### Phase 4: Fine-tuned Local LLM
- Fine-tune open model (Llama, Mistral, etc.) on our data
- Trained on: scored conversations, interview insights, corrections
- Runs locally or on private server
- **Goal:** Local LLM handles 90%+ of conversations

### Phase 5: Claude as Specialist
- Local handles routine conversations
- Claude called for:
  - Complex emotional situations
  - Novel profile combinations
  - Edge cases
  - Training data generation
- **Goal:** Claude costs reduced 80%+

---

## Training Data Schema

### Export Format (for model training)

```json
{
  "exportDate": "2024-12-15T10:00:00Z",
  "version": "1.0",
  "stats": {
    "totalConversations": 1523,
    "totalInsights": 89,
    "totalCorrections": 234,
    "uniqueProfiles": 156
  },
  "conversations": [
    {
      "id": "conv_123",
      "userMessage": "I've been in a fog for days...",
      "coachResponse": "That sounds exhausting. Has this happened before?",
      "profile": {
        "cognitiveMode": "emotional_relational",
        "rhythm": "cyclical_pronounced",
        "neurodivergence": []
      },
      "context": {
        "energy": "low",
        "mood": "frustrated",
        "messageNumber": 3,
        "hourOfDay": 23
      },
      "scores": {
        "local": 78,
        "claude": 82
      },
      "userFeedback": "positive_implicit"
    }
  ],
  "insights": [
    {
      "id": "insight_456",
      "category": "cognitive_patterns",
      "title": "Low phases feel permanent to those in them",
      "insight": "...",
      "coachingImplication": "...",
      "validatedInConversations": ["conv_789", "conv_012"]
    }
  ],
  "corrections": [
    {
      "id": "corr_789",
      "conversationId": "conv_321",
      "originalResponse": "Have you tried making a list?",
      "issue": "Generic advice for user who explicitly said lists don't work",
      "betterApproach": "Ask what HAS worked for them in the past"
    }
  ]
}
```

---

## API: Training Data Service

```typescript
// Import insights
import {
  importInterviewInsight,
  importFromResearchLink,
  processInterviewTranscript,
  approveInsight,
  rejectInsight,
} from './services/trainingDataService';

// Query insights
import {
  getInsightsByCategory,
  getInsightsForProfile,
  searchInsights,
} from './services/trainingDataService';

// Export for training
import {
  exportForTraining,
  exportConversations,
  exportInsights,
  getTrainingReadiness,
} from './services/trainingDataService';

// Check training readiness
const readiness = await getTrainingReadiness();
// {
//   claudeExamples: 523,
//   localExamples: 1892,
//   insightCount: 89,
//   correctionCount: 234,
//   readyForPhase: 2,
//   nextMilestone: "Phase 2 requires 85%+ local scorer accuracy"
// }
```

---

## Admin Interface Requirements

To make interview import practical, the admin interface needs:

### Interview Import UI
- [ ] Paste transcript text
- [ ] Specify participant profile
- [ ] Review AI-extracted insights
- [ ] Approve/reject/edit each insight
- [ ] Tag related profiles and categories

### Research Link Import
- [ ] Enter URL
- [ ] Specify focus areas
- [ ] Review extracted insights
- [ ] Validate against existing knowledge

### Insight Browser
- [ ] View all insights by category
- [ ] Search insights
- [ ] See which conversations validated each insight
- [ ] Edit/update insights as understanding evolves

### Training Dashboard
- [ ] Training data statistics
- [ ] Export buttons
- [ ] Phase progression indicator
- [ ] Quality metrics

---

## Security & Privacy

### Interview Data
- Strip all PII before import
- Use participant codes, not names
- Aggregate patterns, not individual stories
- Consent must be obtained for use in training

### Conversation Data
- User can opt out of training data collection
- Conversation content never leaves device (only metadata + scores)
- Export only includes anonymized examples
- No personal identifiers in training exports

### Model Training
- Training happens on secure servers
- Model weights don't contain raw data
- Fine-tuned model tested for data leakage
- Regular privacy audits

---

## Implementation Priority

1. **Now:** Continue collecting scored conversations (automatic)
2. **Next:** Build interview insight import (manual first)
3. **Then:** Build research link importer
4. **Then:** Build insight browser/admin UI
5. **Later:** Implement local scorer training
6. **Eventually:** Fine-tune local LLM

---

## Related Files

- `services/humanScoreService.ts` - Human-ness scoring
- `services/trainingDataService.ts` - Training data management (TO CREATE)
- `services/corePrincipleKernel.ts` - Principles that insights update
- `services/cognitiveProfileService.ts` - Profiles insights relate to

---

## Example: Full Interview Import Flow

```
1. Conduct user research interview
   └─> Record and transcribe

2. Load transcript into admin interface
   └─> processInterviewTranscript()

3. AI extracts potential insights
   └─> "Found 7 potential insights"

4. Review each insight:
   ┌─────────────────────────────────────────────────────────┐
   │ INSIGHT #3                                              │
   │                                                         │
   │ Category: emotional_processing                          │
   │ Title: "Validation before advice is non-negotiable"     │
   │                                                         │
   │ Insight:                                                │
   │ "User reported feeling dismissed when coach jumped      │
   │ to solutions. Direct quote: 'I just wanted to know     │
   │ it made sense to feel this way first.'"                │
   │                                                         │
   │ Coaching Implication:                                   │
   │ "Always acknowledge the emotion before offering any     │
   │ advice or solutions, regardless of how 'obvious' the   │
   │ solution seems."                                        │
   │                                                         │
   │ [APPROVE]  [EDIT]  [REJECT]                            │
   └─────────────────────────────────────────────────────────┘

5. Approved insights flow to:
   - Core beliefs (if philosophical)
   - Hard constraints (if "never do X")
   - Soft principles (if "prefer Y")
   - Coach prompt context

6. Future conversations reflect learning
```

---

This module is how Mood Leaf becomes smarter over time - not by guessing, but by learning from real humans about how real humans work.
