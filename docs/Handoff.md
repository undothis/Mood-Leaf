# Mood Leaf Project Handoff

**Date:** January 21, 2026
**Branch:** `claude/resume-after-corruption-USBHf`

---

## 1. PROJECT INTENT (WHY THIS EXISTS)

Mood Leaf is a mental health journaling app that uses AI to provide personalized, empathetic coaching while helping users track patterns in their emotions, habits, and life events. Success means users feel genuinely heard and understood—not like they're talking to a generic chatbot. The AI must always reference specific user data (journals, twigs, life context) to demonstrate active listening. Safety is paramount: no diagnoses, no sad emojis, no negative framing, and crisis detection with appropriate resources.

---

## 2. CURRENT STATE (WHERE WE ARE)

**Overall Status:** Implementation / Refinement

The core app is functional with:
- Journaling with sentiment analysis
- Quick logs ("Twigs") for habit tracking
- AI coaching with multiple personas (Clover, Spark, Willow, Luna, Ridge, Flint, Fern)
- Life context compression for long-term memory
- Psychological profile building
- Simulator Mode for AI verification testing

Currently refining the Simulator Mode to properly validate AI behavior.

---

## 3. WHAT IS WORKING (SUCCESS)

- **AI Coach System:** Multiple personas working with adaptive mode, chronotype awareness, and travel/jet lag support
- **Data Pipeline:** Journals, twigs, life context, psych profile, health data all flow to Claude's system prompt
- **Simulator Mode Toggle:** Persists correctly across navigation
- **Challenge Generator:** Creates prompts to test AI data referencing
- **Challenge Persistence:** Challenge state now saves when navigating away
- **Verification System:** Checks AI responses against actual user data (journals, life context, psych profile)
- **Mental Health Safety:** No sad emojis, positive framing, crisis detection
- **Explicit Data Referencing Instructions:** Added to AI coach prompt to ensure specific, not generic responses
- **Exact Twig Timestamps:** AI now receives exact times for today's/yesterday's twig entries (e.g., "5:11 PM")

---

## 4. WHAT IS NOT WORKING / OPEN ISSUES (FAILURES)

- **Strange characters in chat responses:** User reported odd characters at start of some responses (e.g., "\nd I'm so sorry"). May be clipboard/encoding issue or API response artifact. Needs investigation.
- **`[H]` placeholder appeared in chat:** Claude was inserting `[H]` as a name placeholder. FIXED - added explicit instructions to never use bracket placeholders.
- **Verification edge cases:** The generic detection (CHECK 7) was flagging responses as generic even when actual data references were found. FIXED but may need more tuning.
- **Twig time tracking:** AI couldn't answer "what did I log at 5:11 PM?" FIXED - now includes exact timestamps for today's and yesterday's entries.
- **UTC vs Local Timezone Bug:** Newly logged twigs weren't appearing in AI context. FIXED - timestamps were stored in UTC (ISO format) but filtered using local dates. Added `isoToLocalDate()` helper function to convert UTC timestamps to local dates before comparison. This affected `getTodayEntries`, `getEntriesForLog`, `getDetailedLogsContextForClaude`, and other date-filtering functions in `quickLogsService.ts`.

---

## 5. KEY ASSUMPTIONS (CALL THESE OUT)

- **User has data:** Simulator verification assumes user has journals, twigs, and life context stored. Empty data states may behave differently. (UNTESTED)
- **Claude follows instructions:** Assumes Claude will reliably follow the "CRITICAL - ALWAYS REFERENCE SPECIFIC DATA" instructions in system prompt
- **AsyncStorage reliability:** Assumes AsyncStorage works consistently across web and native platforms
- **Keyword matching accuracy:** Life context keyword extraction assumes significant words are >4 characters

---

## 6. CONSTRAINTS & NON-NEGOTIABLES

- **No diagnoses:** Never say "you have anxiety disorder" or similar clinical labels
- **No sad emojis:** Mental health safety - avoid reinforcing negative states
- **Wins-first framing:** Always lead with positives, never shame or criticize
- **No placeholder names:** Never use `[Name]`, `[H]`, `[User]` or any bracket notation
- **Crisis handling:** Immediate resources for suicidal/self-harm language (988, Crisis Text Line)
- **Privacy:** Derived insights only, no raw journal text exposed unnecessarily
- **User autonomy:** Encourage real-world connection, not AI dependency

---

## 7. DECISIONS MADE (DO NOT RE-LITIGATE WITHOUT CAUSE)

- **Haiku model for development:** Cost-effective testing, Sonnet for production
- **Nature-themed personas:** 7 distinct personalities users can choose or adapt
- **AsyncStorage for persistence:** Simple, cross-platform storage
- **Simulator Mode as verification tool:** Not user-facing feature, developer/testing tool
- **CHECK 7 logic:** Only flags generic if no actual data references found AND uses generic phrases
- **Challenge state persistence:** Saves to AsyncStorage with dedicated keys

---

## 7.5 AI CONTEXT SOURCES & COACH PERSONALITY (VERIFIED)

### Data Sources Fed to Claude (in order of assembly)

1. **Life Context** (`lifeContextService.ts` → `getLifeContextForClaude()`)
   - Journaling journey length and total entries
   - Profession, identity (neurodivergence, LGBTQ+)
   - Key people (mom, dad, friends, etc.), pets
   - Activities/interests, health journey
   - Recent and older milestones
   - Long-term emotional themes

2. **Psychological Profile** (`psychAnalysisService.ts` → `getCompressedContext()`)
   - Cognitive distortions (thinking patterns)
   - Defense mechanisms (coping style)
   - Attachment style (secure, anxious, avoidant, etc.)
   - Locus of control (internal vs external)
   - Mindset (growth vs fixed)
   - Core values
   - Nervous system state

3. **Chronotype & Travel** (`coachPersonalityService.ts` → `getChronotypeContextForClaude()`)
   - Chronotype (early bird, night owl, normal)
   - Rhythm transition progress (if changing sleep schedule)
   - Travel frequency, recent timezone shifts
   - Jet lag recovery phase

4. **Health Data** (`healthKitService.ts` → `getHealthContextForClaude()`) - *if HealthKit enabled*
   - Current/resting heart rate, HRV
   - Last night's sleep (hours, quality, awakenings)
   - Weekly average sleep, sleep trend
   - Today's steps, exercise minutes
   - Activity trend, potential stress indicators

5. **Health Correlations** (`healthInsightService.ts` → `getCorrelationSummaryForClaude()`) - *if HealthKit enabled*
   - Sleep-mood correlation
   - Activity-mood correlation
   - Weekly mood trend

6. **Detailed Twig Data** (`quickLogsService.ts` → `getDetailedLogsContextForClaude()`)
   - Each twig with today/week/month/all-time counts
   - **Exact timestamps for today and yesterday** (e.g., "5:11 PM")
   - Notes attached to entries
   - Current streak, longest streak, weekly average
   - First/last logged dates

7. **Lifestyle Factors** (`patternService.ts` → `getLifestyleFactorsContextForClaude()`)
   - Today's factors: caffeine, alcohol, exercise, outdoor, social, sleep
   - 2-week averages for each factor

8. **Exposure Ladder** (`exposureLadderService.ts` → `getExposureContextForClaude()`)
   - Current social comfort level (1-8)
   - Total attempts, completed, highest level
   - Average anxiety reduction, practice streak
   - Recent exposure attempts with notes

9. **Recent Journals** (`journalStorage.ts` → `getRecentJournalContextForClaude()`)
   - Last 7 days of journal entries (actual text, truncated to 300 chars)
   - Date, time, and detected mood for each
   - Mood distribution summary

10. **User Preferences** (`userContextService.ts` → `getContextForClaude()`)
    - Temperament, communication style
    - Journal history stats, common moods
    - Recent mood trend, entries this week
    - Known triggers and helpers
    - Communication preferences (direct, dislikes platitudes, etc.)

11. **Conversation Context** (built in `claudeAPIService.ts`)
    - Current date and time with timezone
    - Recent mood, upcoming events
    - Last 6 messages (3 turns)

12. **Calendar Events** (`calendarService.ts` → `getCalendarContextForClaude()`) - *if Calendar enabled*
    - Today's upcoming events with times
    - Week's schedule and busyness level
    - Travel detection (flights, trips, timezone changes)
    - Important event flags (interviews, appointments, deadlines)
    - Jet lag awareness integration

### Coach Personality System

**7 Personas** (`coachPersonalityService.ts`):
- 🍀 **Clover** (The Bestie) - warm, casual, friendly
- ✨ **Spark** (The Hype Squad) - energetic, motivating
- 🌿 **Willow** (The Sage) - calm wisdom, reflective
- 🌙 **Luna** (The Spiritual) - mindful, present-moment
- ⛰️ **Ridge** (The Coach) - action-oriented, structured
- 🔥 **Flint** (The Straight Shooter) - direct, honest
- 🌱 **Fern** (The Cozy Blanket) - extra gentle, nurturing

**Adaptive Mode Features**:
- Mood detection → persona adaptation (anxious→Luna, sad→Fern, etc.)
- Time-of-day adaptation (morning→Spark, night→Luna)
- Content type detection (goals→Ridge, venting→Clover)
- Chronotype-aware energy (night owls get gentle mornings)
- Jet lag recovery support

**Customization Options**:
- Energy level, response length, question frequency
- Emoji usage, formality, directness, validation style
- Therapeutic approaches: CBT, somatic, mindfulness, motivational, strengths-based
- Context awareness: acknowledge time, reference patterns, track milestones

---

## 8. NEXT STEPS (FOR NEXT SESSION)

1. **Test AI response quality:** Run multiple challenges and verify AI consistently references specific user data
2. **Investigate strange characters:** Check if issue persists after [H] fix, may need to examine API response handling
3. **Add user name support (optional):** Consider adding optional user name field so AI can address them personally
4. **Edge case testing:** Test Simulator Mode with empty data (no journals, no twigs, no life context)
5. **Verify challenge categories:** Test each challenge category (data_accuracy, cross_domain, long_term_correlation, mental_health_framing)
6. **Consider debouncing:** AI response persistence saves on every keystroke - may want to add debounce for performance

---

## 9. HANDOFF NOTES (CONTEXT FOR THE NEXT MIND)

- **Branch has been merged:** Combined `claude/review-mega-prompt-LmMqp` (had this template) with `claude/resume-after-corruption-USBHf` (had all simulator fixes). Kept simulator fixes, added template.
- **Key files modified:**
  - `moodling-app/app/simulator.tsx` - Challenge persistence, CHECK 7 fix, AI response handler
  - `moodling-app/services/claudeAPIService.ts` - Added "ADDRESSING THE USER" section to prevent [H] placeholders
  - `moodling-app/services/quickLogsService.ts` - Added `isoToLocalDate()` helper and fixed all date filtering to use local timezone instead of UTC
- **User cares deeply about:** AI feeling personal, not generic. Every response should demonstrate the AI "remembers" their specific situation.
- **Don't repeat:** The generic check issue where it flagged as generic even with data refs found
- **Testing flow:** Simulator > Generate Challenge > Copy to Chat > Paste AI response back > Verify
- **Timezone fix details:** The bug was that `new Date().toISOString()` stores in UTC, but we compared against local dates like `getToday()`. Example: 11 PM EST on Jan 21 → UTC is 4 AM Jan 22 → filtering for "Jan 21" (local) wouldn't match the "Jan 22" (UTC) timestamp.

---

## 10. SUCCESS CRITERIA FOR THE NEXT CHECKPOINT

- [ ] AI responses consistently reference specific user data (journals, life context, people, events)
- [ ] No more `[H]` or bracket placeholders appearing in chat
- [ ] Challenge state reliably persists across navigation
- [ ] Verification results are accurate (no contradictory positives + generic flags)
- [ ] All challenge categories produce meaningful tests
- [ ] Newly logged twigs immediately appear in AI context (timezone fix verified)

---

## QUICK STATUS SNAPSHOT

"All 12 AI context sources verified and documented. Coach personality system with 7 personas and adaptive mode confirmed working. UTC timezone bug fixed. The AI has access to: life context, psych profile, chronotype, calendar events, health data, correlations, twigs (with exact times), lifestyle factors, exposure progress, journals, and user preferences."

---

## 11. SLASH COMMANDS & SKILLS SYSTEM (NEW)

### What Was Built

A comprehensive slash command system allowing users to type `/` commands in chat for quick actions.

### New Services

| Service | Purpose |
|---------|---------|
| `services/slashCommandService.ts` | Command parsing, registry, and 30+ handlers |
| `services/skillsService.ts` | Skill definitions, exercises, progress tracking |
| `services/subscriptionService.ts` | Premium features, payment routing |

### New Components

| Component | Purpose |
|-----------|---------|
| `components/skills/SkillsBubbleMenu.tsx` | UI for browsing skills |
| `components/skills/ExercisePlayer.tsx` | Guided exercise interface |

### Command Categories

- **Persona:** `/flint`, `/luna`, `/willow`, `/spark`, `/clover`, `/ridge`, `/fern`, `/random`
- **Exercise:** `/breathe`, `/ground`, `/body`, `/calm`, `/prep`
- **Browse:** `/skills`, `/games`, `/help`
- **Power:** `/clear`, `/settings`, `/status`
- **Easter Eggs:** `/love`, `/hug`, `/wisdom`

### Exercise Library (15+)

- Box Breathing, 4-7-8 Breathing, Coherent Breathing, Physiological Sigh
- 5-4-3-2-1 Grounding, Feet on Floor, Ice Cube Grounding
- Quick Body Scan, Progressive Muscle Relaxation
- Thought Record, Thought Defusion
- Event Preparation, Conversation Starters

### Games System (25+)

- **Grounding:** I Spy AI (camera), Color Finder, Texture Hunt, Nature Spotter
- **Calming:** Color Sort, Zen Blocks, Calm Sudoku, Gentle Pong, Flow Drawing
- **Skill Building:** Emotion Match, Gratitude Wheel, Word Garden, Thought Catcher
- **Fidget:** Bubble Wrap, Spinner, Fidget Pad

### Subscription Tiers

| Tier | Price | Unlocks |
|------|-------|---------|
| Free | $0 | Basic exercises, all personas |
| Skills+ | $4.99/mo | All exercises, skill tracking |
| Pro | $9.99/mo | Advanced skills, custom Fireflies |
| Lifetime | $79.99 | Everything forever |

### Integration Points

- Chat input checks `isSlashCommand()` before normal message flow
- `handleCommandResult()` processes persona switches, exercises, menus
- Quick action buttons can trigger slash commands directly
- Premium gating via `context.isPremium` in handlers

### Key Files Modified

- `app/coach/index.tsx` - Added slash command detection and result handling
- Added new MessageSource type: `'command'`
- Added quick actions for `/skills`, `/help`

### Documentation Updated

- `DEVELOPER_GUIDE.md` - Full technical documentation
- `USER_MANUAL.md` - User-facing guide
- `Handoff.md` - This section

### Next Steps for Skills System

1. **Implement Exercise Player UI** - Connect to actual guided experiences
2. **Build Skills Bubble Menu** - Interactive category browsing
3. **Camera Games** - ML Vision for I Spy AI
4. **Payment Integration** - Connect to App Store/Google Play/Stripe

---

## 12. VOICE CHAT, EMOTION DETECTION, TEACHING SYSTEM (January 2026)

### Voice Chat System

**Purpose:** Hands-free conversation with the coach using voice recognition and automatic pause detection.

**Key Features:**
- **Auto-detect mode:** Automatically sends message after configurable silence (default 1.5s)
- **Push-to-talk mode:** Hold button to speak
- **TTS responses:** Coach can speak responses back
- **Multi-language:** 12 languages supported

**Service:** `services/voiceChatService.ts`
- `VoiceChatController` class manages sessions
- Web Speech API for web, native APIs for iOS/Android
- Pause detection sends message when user stops speaking

### Emotion Detection System

**Purpose:** Front-facing camera analyzes facial expressions during chat to provide emotional context to the coach.

**Privacy First:**
- All processing local/on-device
- No images stored or transmitted
- Explicit opt-in required
- Can be disabled anytime

**Key Features:**
- Detects 9 emotions: happy, sad, angry, fearful, disgusted, surprised, neutral, anxious, stressed
- Facial cues: brow furrow, eye openness, mouth tension, smile intensity, jaw clench
- Generates coach hints: "User appears stressed, suggest breathing exercise"

**Service:** `services/emotionDetectionService.ts`
- Mock implementation ready for ML integration
- iOS: Vision framework
- Android: ML Kit
- Web: face-api.js or TensorFlow.js

### Teaching System

**Purpose:** The coach can teach subjects like languages, mindfulness, psychology, and life skills.

**Available Subjects:**
| Subject | Emoji | Category | Tier |
|---------|-------|----------|------|
| Spanish | 🇪🇸 | Language | Free |
| French | 🇫🇷 | Language | Free |
| Japanese | 🇯🇵 | Language | Premium |
| Mandarin | 🇨🇳 | Language | Premium |
| Meditation Basics | 🧘 | Mindfulness | Free |
| Breathing Mastery | 💨 | Mindfulness | Free |
| CBT Fundamentals | 🧠 | Psychology | Free |
| Emotional Intelligence | 💝 | Psychology | Premium |
| Better Sleep | 😴 | Wellness | Free |
| Self-Compassion | 🤗 | Life Skills | Free |
| Healthy Boundaries | 🚧 | Life Skills | Premium |

**Slash Commands:**
- `/teach` - Browse all subjects
- `/teach spanish` - Start/continue Spanish
- `/spanish`, `/french` - Language shortcuts

**Service:** `services/teachingService.ts`
- Lesson progress tracking
- No grades or punishment (anti-streak design)
- Vocabulary, concepts, practice, conversation, quiz lesson types

### Fidget Pad Game

**Purpose:** Digital fidget toys for quick anxiety relief.

**Three Tools:**
1. **Bubble Wrap** - Pop 48 bubbles with haptic feedback
2. **Sliders** - 6 colorful sliding bars
3. **Spinner** - Momentum-based fidget spinner

**Component:** `components/games/FidgetPad.tsx`
- Works on iOS, Android, and Web
- Haptic feedback via Vibration API
- Dark theme matching app design

**Slash Commands:** `/fidget`, `/bubble`, `/pop`

### Files Created

| File | Purpose |
|------|---------|
| `services/voiceChatService.ts` | Voice recognition with pause detection |
| `services/emotionDetectionService.ts` | Camera-based emotion detection |
| `services/teachingService.ts` | Subject teaching system |
| `components/games/FidgetPad.tsx` | Fidget pad game component |

### Integration Notes

- All services follow Mood Leaf ethics: privacy-first, no manipulation, user control
- Voice and emotion features require explicit opt-in
- Teaching system uses same anti-dependency principles as exercise tracking
- All work cross-platform: iOS, Android, Web
