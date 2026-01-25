# Behavioral Analytics System - In-App Feature Specification

## Overview

This is the **in-app behavioral analysis system** (codenamed "Cadence") that analyzes the user's facial expressions, eye movements, and speech patterns during coaching sessions.

**This is NOT the Training Studio** (which harvests YouTube content). This feature USES the models trained by the Training Studio to interpret user behavior in real-time.

---

## 1. Facial Expression Analysis

| Feature | What It Captures | Therapeutic Use |
|---------|------------------|-----------------|
| Micro-expressions | Brief involuntary facial movements | Detect suppressed emotions |
| Baseline expressions | Resting face state | Measure deviation during topics |
| Emotion classification | Joy, sadness, anger, fear, surprise, disgust, contempt | Track emotional responses to prompts |
| Expression intensity | 0-100 scale per emotion | Measure emotional regulation |
| Congruence detection | Does expression match stated emotion? | Identify alexithymia patterns |

### Technical Approach

- On-device ML models (TensorFlow Lite / Core ML)
- 30fps analysis during video sessions
- No images leave device - only extracted metrics

---

## 2. Eye Movement Analysis

| Feature | What It Captures | Therapeutic Use |
|---------|------------------|-----------------|
| Gaze direction | Where user looks during questions | Cognitive load indicators |
| Pupil dilation | Autonomic nervous system response | Stress/arousal detection |
| Blink rate | Blinks per minute | Anxiety/dissociation markers |
| Gaze aversion | Looking away patterns | Shame/discomfort detection |
| Saccades | Rapid eye movements | Processing style indicators |

### Research Backing

- Eye contact aversion correlates with social anxiety (r=0.67) [Schneier et al., 2011]
- Pupil dilation increases 20-30% during emotional arousal [Bradley et al., 2008]
- Blink rate increases 40% under stress [Ponder & Kennedy, 1927]

---

## 3. Speech Cadence Analysis

| Feature | What It Captures | Therapeutic Use |
|---------|------------------|-----------------|
| Speaking rate | Words per minute | Anxiety (fast) / depression (slow) |
| Pause duration | Silence length/frequency | Cognitive processing, avoidance |
| Pitch variation | Fundamental frequency changes | Emotional state, flatness |
| Volume dynamics | Loudness changes | Emotional intensity |
| Speech-to-silence ratio | How much talking vs pausing | Engagement level |
| Filler words | "um", "uh", "like" frequency | Uncertainty markers |
| Response latency | Time before answering | Processing difficulty indicators |

### Research Backing

- Depressed speech is 15-30% slower with 2x longer pauses [Mundt et al., 2012]
- Anxiety increases pitch by 10-20Hz on average [Laukka et al., 2008]
- Reduced pitch variation (prosody) is a depression marker [Cummins et al., 2015]

---

## 4. Session Data Harvesting

| Data Type | What's Stored | Purpose |
|-----------|---------------|---------|
| Session transcripts | What was said (anonymized) | Pattern analysis |
| Temporal markers | When emotions peaked | Trigger identification |
| Topic-emotion maps | Which topics → which emotions | Therapy targeting |
| Progress trajectories | Metrics over time | Treatment efficacy |
| Behavioral fingerprint | Unique response patterns | Personalized coaching |

---

## Statistics & Research Backing

### Accuracy of Current Technology

| Technology | Accuracy | Source |
|------------|----------|--------|
| Facial emotion recognition | 85-95% | Affectiva, 2023 |
| Speech emotion detection | 70-80% | Schuller et al., 2021 |
| Eye tracking (mobile) | 1-2° accuracy | Apple ARKit, 2023 |
| Depression detection from voice | 80% sensitivity | Cummins et al., 2015 |
| Anxiety detection from face | 78% accuracy | Giannakakis et al., 2019 |

### Clinical Relevance

- 83% of therapists say non-verbal cues are "extremely important" [APA Survey, 2019]
- 60% of emotional communication is non-verbal [Mehrabian, 1971]
- Mood tracking apps with biometrics show 40% better engagement [Mohr et al., 2017]

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ON-DEVICE PROCESSING                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Camera    │  │ Microphone  │  │   Session Context   │  │
│  │   Stream    │  │   Stream    │  │   (Coach Chat)      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         ▼                ▼                     ▼             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Face/Eye ML │  │  Audio ML   │  │  Topic Classifier   │  │
│  │   Model     │  │   Model     │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┴─────────────────────┘             │
│                          │                                   │
│                          ▼                                   │
│              ┌─────────────────────┐                        │
│              │  Behavioral Metrics │                        │
│              │  (Numbers Only -    │                        │
│              │   No Raw Data)      │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│                         ▼                                   │
│              ┌─────────────────────┐                        │
│              │  Local SQLite DB    │                        │
│              │  (Encrypted)        │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼ (Optional, with consent)
              ┌─────────────────────┐
              │  Anonymized Export  │
              │  for Research       │
              └─────────────────────┘
```

---

## Why Build Within Mood Leaf (Not Separate App)

### Pros of Integration

- **Context is everything** - Facial/voice data is only useful WITH the conversation context
- **Single source of truth** - All user data in one place, better insights
- **Lower friction** - Users already have the app, no second download
- **Unified privacy model** - One consent flow, one data policy
- **Cross-feature synergy** - Coach can reference behavioral patterns, games can adapt to stress levels
- **Existing trust** - Users already trust Mood Leaf with sensitive data

### Mitigations for Concerns

- Download ML models on-demand (not bundled with app)
- Video analysis only during explicit sessions (not passive)
- Clear feature toggling in settings

---

## File Structure

```
/app/cadence/                  # New route group
  index.tsx                    # Cadence dashboard
  session.tsx                  # Active recording session
  insights.tsx                 # Historical analysis
  settings.tsx                 # What to track, consent

/services/
  cadenceService.ts            # Core orchestration
  facialAnalysisService.ts     # Face/eye ML
  voiceAnalysisService.ts      # Speech pattern ML
  behavioralMetricsService.ts  # Aggregation & storage
```

---

## Key Privacy Principles

1. **Explicit opt-in** - Never passive, always user-initiated
2. **No raw storage** - Only derived metrics, never video/audio files
3. **On-device ML** - Nothing goes to cloud unless explicitly exported
4. **Granular controls** - User can enable face but not voice, etc.
5. **Data expiry** - Auto-delete after configurable period
6. **Export/delete** - Full data portability

---

## Implementation Phases

| Phase | Features | Effort |
|-------|----------|--------|
| Phase 1 | Voice cadence only (easiest) - pitch, speed, pauses | 2-3 weeks |
| Phase 2 | Facial expression basics - 7 emotions | 3-4 weeks |
| Phase 3 | Eye tracking (iOS only initially via ARKit) | 2-3 weeks |
| Phase 4 | Integrated insights dashboard | 2 weeks |
| Phase 5 | AI coach integration - coach references patterns | 1-2 weeks |

---

## Relationship to Training Studio

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW THEY CONNECT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TRAINING STUDIO                    MOOD LEAF APP              │
│   (Separate build)                   (This feature)             │
│                                                                  │
│   ┌─────────────────┐               ┌─────────────────┐         │
│   │ YouTube Videos  │               │  User's Camera  │         │
│   │ (1000s of hours)│               │  (Real-time)    │         │
│   └────────┬────────┘               └────────┬────────┘         │
│            │                                  │                  │
│            ▼                                  ▼                  │
│   ┌─────────────────┐               ┌─────────────────┐         │
│   │ Extract prosody │               │ Same ML models  │         │
│   │ facial patterns │               │ analyze user    │         │
│   │ aliveness cues  │               │ in real-time    │         │
│   └────────┬────────┘               └────────┬────────┘         │
│            │                                  │                  │
│            ▼                                  ▼                  │
│   ┌─────────────────┐               ┌─────────────────┐         │
│   │ Train Llama     │──────────────▶│ Llama responds  │         │
│   │ fine-tune       │   (model)     │ with aliveness  │         │
│   └─────────────────┘               └─────────────────┘         │
│                                              │                   │
│                                              ▼                   │
│                                     ┌─────────────────┐         │
│                                     │ Coach adapts to │         │
│                                     │ user's emotional│         │
│                                     │ state in moment │         │
│                                     └─────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Training Studio** = Creates the intelligence (train models on YouTube data)
**Cadence Feature** = Uses the intelligence (apply models to user in real-time)

---

*Document Version: 1.0*
*Created: January 2025*
*Status: Feature specification for in-app behavioral analysis*
