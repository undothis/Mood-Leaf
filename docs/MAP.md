# Mood Leaf Mind Architecture Map

An ASCII visualization of how the AI coach learns, adapts, and influences change.

---

## The Core Loop

```
                                    ┌─────────────────────────────────────┐
                                    │         USER'S INNER WORLD          │
                                    │                                     │
                                    │   Thoughts ─── Feelings ─── Beliefs │
                                    │        \         |         /        │
                                    │         \        |        /         │
                                    │          ▼       ▼       ▼          │
                                    │        ┌─────────────────┐          │
                                    │        │   ASPIRATION    │          │
                                    │        │  (who I want    │          │
                                    │        │   to be)        │          │
                                    │        └────────┬────────┘          │
                                    │                 │                   │
                                    │                 ▼                   │
                                    │        ┌─────────────────┐          │
                                    │        │    BEHAVIOR     │          │
                                    │        │  (what I do)    │◄─────────┼───── Gap creates growth
                                    │        └────────┬────────┘          │
                                    └─────────────────┼───────────────────┘
                                                      │
                    ══════════════════════════════════╪══════════════════════════════
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         INPUT LAYER                                          │
│                                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   MESSAGE    │  │   JOURNAL    │  │    MOOD      │  │   HEALTH     │  │   PATTERNS   │  │
│  │   (text)     │  │   (entries)  │  │   (logs)     │  │   (vitals)   │  │   (habits)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │                 │                 │          │
│         └────────────────┬┴─────────────────┴─────────────────┴─────────────────┘          │
│                          │                                                                  │
│                          ▼                                                                  │
│                 ┌─────────────────┐                                                         │
│                 │ BEHAVIORAL      │   "We see ourselves through the lens                    │
│                 │ OBSERVATION     │    of aspiration, not reality.                          │
│                 │                 │    That's why watching beats asking."                   │
│                 │ • Response length                                                         │
│                 │ • Hedging words                                                           │
│                 │ • Decisive words                                                          │
│                 │ • Mixed emotions                                                          │
│                 │ • Questions asked                                                         │
│                 └────────┬────────┘                                                         │
│                          │                                                                  │
└──────────────────────────┼──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      PROCESSING LAYER                                        │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              COGNITIVE PROFILE                                       │   │
│  │                                                                                      │   │
│  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │   │
│  │  │  How They     │   │  How They     │   │  How They     │   │  Decision     │     │   │
│  │  │  THINK        │   │  LEARN        │   │  FEEL         │   │  STYLE        │     │   │
│  │  │               │   │               │   │               │   │  (observed)   │     │   │
│  │  │ • Systems     │   │ • Visual      │   │ • Sensitive   │   │               │     │   │
│  │  │ • Stories     │   │ • Auditory    │   │ • Analytical  │   │ • Binary      │     │   │
│  │  │ • Patterns    │   │ • Kinesthetic │   │ • Action      │   │ • Nuanced     │     │   │
│  │  │ • Feelings    │   │ • Reading     │   │ • Delayed     │   │ • Contextual  │     │   │
│  │  └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘     │   │
│  │                                                                                      │   │
│  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                          │   │
│  │  │  Mental       │   │  Cognitive    │   │  Energy       │                          │   │
│  │  │  IMAGERY      │   │  RHYTHM       │   │  PATTERN      │                          │   │
│  │  │               │   │               │   │               │                          │   │
│  │  │ • Aphantasia  │   │ • Steady      │   │ • Morning     │                          │   │
│  │  │ • Typical     │   │ • Cyclical    │   │ • Night owl   │                          │   │
│  │  │ • Vivid       │   │ • Burst       │   │ • Consistent  │                          │   │
│  │  └───────────────┘   └───────────────┘   └───────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│                                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              CONTEXT INTEGRATION                                     │   │
│  │                                                                                      │   │
│  │  Memories ──► Life Context ──► Patterns ──► Accountability ──► Current State       │   │
│  │      │              │              │               │                │                │   │
│  │      └──────────────┴──────────────┴───────────────┴────────────────┘                │   │
│  │                                    │                                                 │   │
│  │                                    ▼                                                 │   │
│  │                         ┌──────────────────┐                                         │   │
│  │                         │  SYSTEM PROMPT   │                                         │   │
│  │                         │  (assembled)     │                                         │   │
│  │                         └──────────────────┘                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
└──────────────────────────────────────────────┼──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      AI RESPONSE LAYER                                       │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              COACH PERSONALITY                                       │   │
│  │                                                                                      │   │
│  │     Clover        Spark         Luna         Ridge        Willow        Fern        │   │
│  │    (friendly)   (energetic)   (calm)      (action)      (wise)       (gentle)       │   │
│  │        │            │           │            │            │            │             │   │
│  │        └────────────┴───────────┴────────────┴────────────┴────────────┘             │   │
│  │                                    │                                                 │   │
│  │                                    ▼                                                 │   │
│  │                         ┌──────────────────┐                                         │   │
│  │                         │  RESPONSE STYLE  │                                         │   │
│  │                         │                  │                                         │   │
│  │                         │ Adapted to:      │                                         │   │
│  │                         │ • Decision style │                                         │   │
│  │                         │ • Energy level   │                                         │   │
│  │                         │ • Imagery ability│                                         │   │
│  │                         │ • Time of day    │                                         │   │
│  │                         └──────────────────┘                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│                                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              RESPONSE VALIDATION                                     │   │
│  │                                                                                      │   │
│  │  Core Principles ──► Style Check ──► Tenet Validation ──► Human Score              │   │
│  │        │                  │                 │                   │                   │   │
│  │        │                  │                 │                   │                   │   │
│  │        ▼                  ▼                 ▼                   ▼                   │   │
│  │   [No harm]          [Natural]         [Ethical]          [Authentic]              │   │
│  │   [Honest]           [No jargon]       [Empowering]       [Not robotic]            │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
└──────────────────────────────────────────────┼──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       OUTPUT LAYER                                           │
│                                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │   MESSAGE    │  │   SKILL      │  │   VOICE      │  │   MEMORY     │                    │
│  │   (text)     │  │   (overlay)  │  │   (TTS)      │  │   (stored)   │                    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                 │                 │                             │
│         └─────────────────┴─────────────────┴─────────────────┘                             │
│                                    │                                                        │
└────────────────────────────────────┼────────────────────────────────────────────────────────┘
                                     │
                    ═════════════════╪═════════════════════════════════════
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   USER RECEIVES     │
                          │                     │
                          │  • Sees message     │
                          │  • Hears voice      │
                          │  • Does skill       │
                          │  • Feels understood │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   USER RESPONDS     │──────────────────┐
                          │                     │                  │
                          │  (loop continues)   │                  │
                          └─────────────────────┘                  │
                                                                   │
                                     ┌─────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │         THE FEEDBACK LOOP          │
                    │                                    │
                    │   Input ──► Process ──► Output     │
                    │     ▲                      │       │
                    │     │                      │       │
                    │     └──────────────────────┘       │
                    │                                    │
                    │   Each interaction:                │
                    │   • Updates observations           │
                    │   • Refines understanding          │
                    │   • Adapts future responses        │
                    │                                    │
                    └────────────────────────────────────┘
```

---

## Philosophy Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHILOSOPHY INPUT                                           │
│                                                                                              │
│  "We see ourselves through the lens of aspiration, not reality."                            │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                      │   │
│  │                     WHAT USERS SAY          vs         WHAT USERS DO                │   │
│  │                                                                                      │   │
│  │                     "I'm decisive"          vs         Asks clarifying questions    │   │
│  │                     "I'm open-minded"       vs         Quick yes/no responses       │   │
│  │                     "I think deeply"        vs         Short, reactive messages     │   │
│  │                                                                                      │   │
│  │                              ║                                   ║                   │   │
│  │                              ║         THE GAP                   ║                   │   │
│  │                              ║    (aspiration vs reality)        ║                   │   │
│  │                              ║                                   ║                   │   │
│  │                              ▼                                   ▼                   │   │
│  │                                                                                      │   │
│  │                         ┌─────────────────────────────────┐                         │   │
│  │                         │      OBSERVATION ONLY           │                         │   │
│  │                         │                                 │                         │   │
│  │                         │   • Never ask directly          │                         │   │
│  │                         │   • Watch behavior silently     │                         │   │
│  │                         │   • No labels shown to user     │                         │   │
│  │                         │   • Just adapt naturally        │                         │   │
│  │                         └─────────────────────────────────┘                         │   │
│  │                                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
└──────────────────────────────────────────────┼──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHILOSOPHY OUTPUT                                          │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                      │   │
│  │                              NATURAL ADAPTATION                                      │   │
│  │                                                                                      │   │
│  │   User is binary thinker (observed):                                                │   │
│  │   ┌─────────────────────────────────────────────────────┐                           │   │
│  │   │ Coach: "I'd suggest trying the breathing exercise.  │                           │   │
│  │   │         It takes 4 minutes. Want to try it now?"    │                           │   │
│  │   └─────────────────────────────────────────────────────┘                           │   │
│  │                              │                                                       │   │
│  │                              │  Clear. Direct. One option.                          │   │
│  │                              │                                                       │   │
│  │   User is nuanced thinker (observed):                                               │   │
│  │   ┌─────────────────────────────────────────────────────┐                           │   │
│  │   │ Coach: "There are a few things that might help.     │                           │   │
│  │   │         Breathing could calm the nervous system,    │                           │   │
│  │   │         or journaling might help you process.       │                           │   │
│  │   │         What feels right for where you are now?"    │                           │   │
│  │   └─────────────────────────────────────────────────────┘                           │   │
│  │                              │                                                       │   │
│  │                              │  Options. Nuance. Their choice.                      │   │
│  │                              │                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
└──────────────────────────────────────────────┼──────────────────────────────────────────────┘
                                               │
                                               ▼
                                ┌───────────────────────────────┐
                                │                               │
                                │   USER FEELS UNDERSTOOD       │
                                │   (without knowing why)       │
                                │                               │
                                │   "This app just... gets me"  │
                                │                               │
                                └───────────────────────────────┘
```

---

## How Change Happens

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE CHANGE MODEL                                           │
│                                                                                              │
│   Not: "You should change"                                                                  │
│   But: "Here's a mirror. Here's support. Here's a tool."                                    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                      │   │
│  │     AWARENESS                  ACTION                    INTEGRATION                 │   │
│  │         │                         │                           │                      │   │
│  │         ▼                         ▼                           ▼                      │   │
│  │  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐                │   │
│  │  │ Journal     │           │ Skills      │           │ Patterns    │                │   │
│  │  │ Mood logs   │    ──►    │ Breathing   │    ──►    │ Memory      │                │   │
│  │  │ Reflection  │           │ Grounding   │           │ Progress    │                │   │
│  │  │ Coach chat  │           │ CBT/DBT     │           │ Celebration │                │   │
│  │  └─────────────┘           └─────────────┘           └─────────────┘                │   │
│  │                                                                                      │   │
│  │         │                         │                           │                      │   │
│  │         │                         │                           │                      │   │
│  │         └─────────────────────────┴───────────────────────────┘                      │   │
│  │                                   │                                                  │   │
│  │                                   ▼                                                  │   │
│  │                        ┌───────────────────┐                                         │   │
│  │                        │                   │                                         │   │
│  │                        │   SMALL SHIFTS    │                                         │   │
│  │                        │   OVER TIME       │                                         │   │
│  │                        │                   │                                         │   │
│  │                        │   Not revolution  │                                         │   │
│  │                        │   Evolution       │                                         │   │
│  │                        │                   │                                         │   │
│  │                        └───────────────────┘                                         │   │
│  │                                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Values Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CORE VALUES                                               │
│                                                                                              │
│                              (Built into every response)                                     │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                      │   │
│  │      HONESTY                 AUTONOMY                 EMPOWERMENT                   │   │
│  │         │                       │                          │                         │   │
│  │         ▼                       ▼                          ▼                         │   │
│  │  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐                    │   │
│  │  │ Tell truth  │         │ User leads  │         │ Build skill │                    │   │
│  │  │ Not what    │         │ Not coach   │         │ Not         │                    │   │
│  │  │ they want   │         │ Coach       │         │ dependency  │                    │   │
│  │  │ to hear     │         │ supports    │         │             │                    │   │
│  │  └─────────────┘         └─────────────┘         └─────────────┘                    │   │
│  │                                                                                      │   │
│  │      SAFETY                  PRIVACY                  HUMANITY                       │   │
│  │         │                       │                          │                         │   │
│  │         ▼                       ▼                          ▼                         │   │
│  │  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐                    │   │
│  │  │ Crisis      │         │ Data stays  │         │ Not a       │                    │   │
│  │  │ detection   │         │ on device   │         │ replacement │                    │   │
│  │  │ Resources   │         │ User        │         │ for human   │                    │   │
│  │  │ available   │         │ controls    │         │ connection  │                    │   │
│  │  └─────────────┘         └─────────────┘         └─────────────┘                    │   │
│  │                                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│                                              ▼                                              │
│                               ┌───────────────────────────────┐                             │
│                               │                               │                             │
│                               │   VALIDATED EVERY RESPONSE    │                             │
│                               │                               │                             │
│                               │   corePrincipleKernel         │                             │
│                               │   checkSafeguards()           │                             │
│                               │   validateTenets()            │                             │
│                               │                               │                             │
│                               └───────────────────────────────┘                             │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Access Registry Gate

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ACCESS CONTROL                                            │
│                                                                                              │
│                         WHITELIST: If not here, AI cannot access                            │
│                                                                                              │
│  ┌───────────────────────────────────┐     ┌───────────────────────────────────┐           │
│  │           ALLOWED                 │     │           BLOCKED                  │           │
│  │                                   │     │                                    │           │
│  │  ✓ Tone preferences               │     │  ✗ Raw journal content             │           │
│  │  ✓ Cognitive profile              │     │  ✗ API keys                        │           │
│  │  ✓ Memories (summarized)          │     │  ✗ Location data                   │           │
│  │  ✓ Life context                   │     │  ✗ Contacts                        │           │
│  │  ✓ Journal (summaries)            │     │  ✗ Photos                          │           │
│  │  ✓ Mood/energy patterns           │     │  ✗ Delete data action              │           │
│  │  ✓ Health data (if enabled)       │     │  ✗ Make purchase action            │           │
│  │  ✓ Skill overlay trigger          │     │  ✗ Modify settings action          │           │
│  │                                   │     │  ✗ Share externally action         │           │
│  │                                   │     │                                    │           │
│  │        coachAccessRegistry        │     │     Developer toggles available    │           │
│  │                                   │     │                                    │           │
│  └───────────────────────────────────┘     └───────────────────────────────────┘           │
│                                                                                              │
│                                    ┌─────────────┐                                          │
│                                    │             │                                          │
│                                    │  ADMIN UI   │                                          │
│                                    │             │                                          │
│                                    │  Settings   │                                          │
│                                    │  Developer  │                                          │
│                                    │  AI Access  │                                          │
│                                    │  Registry   │                                          │
│                                    │             │                                          │
│                                    └─────────────┘                                          │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Complete Picture

```
                         ┌─────────────────────────────────┐
                         │           USER                  │
                         │                                 │
                         │   Aspirations ≠ Reality         │
                         │   (and that's okay)             │
                         │                                 │
                         └────────────┬────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────────────┐
                         │         OBSERVATION             │
                         │                                 │
                         │   Watch, don't ask              │
                         │   Behavior reveals truth        │
                         │                                 │
                         └────────────┬────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────────────┐
                         │         ADAPTATION              │
                         │                                 │
                         │   Coach molds to user           │
                         │   Not user to coach             │
                         │                                 │
                         └────────────┬────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────────────┐
                         │         RESPONSE                │
                         │                                 │
                         │   Validated against values      │
                         │   Natural, not robotic          │
                         │                                 │
                         └────────────┬────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────────────┐
                         │         LEARNING                │
                         │                                 │
                         │   Each interaction refines      │
                         │   understanding                 │
                         │                                 │
                         └────────────┬────────────────────┘
                                      │
                                      │
                                      ▼
                              ┌───────────────┐
                              │               │
                              │   LOOP        │
                              │   FOREVER     │
                              │               │
                              └───────────────┘


                    "The goal is not to change the user.
                     The goal is to help the user become
                     more of who they already are."
```

---

*Last updated: January 2026*
