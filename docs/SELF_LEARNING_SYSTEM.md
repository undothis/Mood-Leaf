# Self-Learning Humanization System

## Design Document - Research & Architecture

**Status:** Research Complete, Implementation Pending
**Last Updated:** January 2026

---

## Executive Summary

A self-improving feedback loop system that evaluates, grades, and refines how Mood Leaf's AI coaches communicate. The goal is to make conversations feel deeply human - not just helpful, but warm, genuine, and therapeutically effective.

The system asks itself questions, grades responses on a 1-20 "humanness" scale, identifies patterns that work, and proposes refinements to prompts, coach personalities, and response strategies.

---

## Part 1: What Makes Conversations Feel Human

### 1.1 Carl Rogers' Core Conditions (Psychology Foundation)

Research consistently shows that therapeutic effectiveness depends on three core conditions:

| Condition | Definition | How to Measure |
|-----------|------------|----------------|
| **Empathy** | Understanding the person's internal frame of reference | Does the response show understanding of feelings, not just facts? |
| **Genuineness** | Being real, not hiding behind a professional facade | Does it feel like a real person, not a script? |
| **Unconditional Positive Regard** | Acceptance without judgment | Is the tone warm and accepting, even when challenging? |

**Source:** [Person-Centered Therapy Research](https://www.sciencedirect.com/topics/psychology/person-centered-therapy)

### 1.2 Types of Empathy (Harvard Research 2025)

Research from Harvard's D3 Institute found that humans value different types of empathy differently:

| Empathy Type | Definition | AI Performance |
|--------------|------------|----------------|
| **Cognitive** | Understanding what someone is thinking | AI performs nearly equal to humans |
| **Affective** | Feeling WITH the person | Strong "human empathy premium" - humans preferred |
| **Motivational** | Caring ABOUT the person's wellbeing | Strongest human preference |

**Key Insight:** Focus on affective and motivational empathy - these are where humans most notice the difference.

**Source:** [Harvard D3 Institute Research](https://d3.harvard.edu/it-feels-like-ai-understands-but-do-we-care-new-research-on-empathy/)

### 1.3 What Makes AI Sound Like AI (Detection Patterns)

Research on AI detection reveals what makes text feel "robotic":

| AI Pattern | Human Alternative |
|------------|-------------------|
| Uniform sentence length | Mix short punchy sentences with longer flowing ones |
| Predictable transitions ("Furthermore," "Moreover") | Natural connectors or no connectors at all |
| Perfect grammar always | Occasional fragments, contractions, casual phrasing |
| Formal register consistently | Adapts tone to context and relationship |
| Generic examples | Specific, concrete, personal references |
| Avoiding "I think" or "I feel" | Includes subjective expressions |
| Overly polished | Natural quirks, personality shows through |

**Source:** [AI vs Human Writing Linguistic Analysis](https://www.sciencedirect.com/science/article/abs/pii/S2666799123000436)

### 1.4 Sentence Structure That Feels Human

**Pattern to Follow:**

```
Human writing has "burstiness" -
variation in sentence length and complexity.

Like this. Short. Direct.

Then a longer sentence that explores an idea more fully,
maybe even with a pause in the middle - a dash or comma -
before completing the thought.

And sometimes? A question to yourself.
```

**What to Avoid:**
- Starting consecutive sentences the same way
- Always using complete grammatical sentences
- Maintaining identical paragraph lengths
- Using the same transitional phrases repeatedly

**Source:** [Psycholinguistic Analysis of AI Text](https://arxiv.org/html/2505.01800v1)

---

## Part 2: The Humanness Grading Scale (1-20)

### 2.1 Scale Definition

| Score | Category | Description |
|-------|----------|-------------|
| 1-4 | **Robotic** | Generic, template-like, could be any chatbot |
| 5-8 | **Functional** | Helpful but clearly AI, missing warmth |
| 9-12 | **Competent** | Good advice, some personality, still detectable |
| 13-16 | **Natural** | Feels like a knowledgeable friend |
| 17-20 | **Deeply Human** | Indistinguishable from a skilled human helper |

### 2.2 Grading Dimensions (5 Pillars)

Each response is graded on 5 dimensions, each scored 1-4:

#### Pillar 1: Empathic Resonance (1-4)
- 1: Ignores emotional content entirely
- 2: Acknowledges feelings with generic phrases ("I understand")
- 3: Reflects specific feelings back accurately
- 4: Captures nuance, validates without fixing, shows genuine care

#### Pillar 2: Genuine Voice (1-4)
- 1: Could be any AI, no personality
- 2: Slight personality hints but inconsistent
- 3: Clear coach personality throughout
- 4: Unique voice that matches coach traits, feels like a real person

#### Pillar 3: Natural Language (1-4)
- 1: Robotic, formal, uniform structure
- 2: Mostly natural but some AI tells (transitions, uniformity)
- 3: Varied sentence structure, some personality quirks
- 4: Human-like rhythm, contractions, natural flow, occasional imperfection

#### Pillar 4: Contextual Awareness (1-4)
- 1: Generic response, ignores user history
- 2: References user info but shallowly
- 3: Integrates MoodPrint insights naturally
- 4: Response feels like it was written specifically for this person

#### Pillar 5: Therapeutic Value (1-4)
- 1: Empty validation, no substance
- 2: Generic advice, technically correct
- 3: Helpful guidance tailored to situation
- 4: Genuinely moving, creates insight or shift

**Total Score = Sum of all pillars (5-20 scale)**

### 2.3 Benchmark Targets by Coach

| Coach | Target Score | Emphasis |
|-------|--------------|----------|
| Clover | 17+ | High empathic resonance, warm voice |
| Spark | 16+ | High genuine voice (energetic), natural language |
| Willow | 18+ | Maximum empathic resonance (gentle, nurturing) |
| Luna | 17+ | High therapeutic value (deep, reflective) |
| Ridge | 15+ | Balance practical with warmth |
| Flint | 14+ | Direct voice (may score lower on warmth intentionally) |
| Fern | 17+ | High contextual awareness, nature imagery |

---

## Part 3: The Self-Learning Feedback Loop

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELF-LEARNING LOOP                            │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ 1. COLLECT  │ →  │ 2. GRADE    │ →  │ 3. ANALYZE  │          │
│  │ Conversation│    │ Humanness   │    │ Patterns    │          │
│  │ Samples     │    │ 1-20 Scale  │    │             │          │
│  └─────────────┘    └─────────────┘    └──────┬──────┘          │
│                                               │                  │
│                                               ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ 6. MONITOR  │ ←  │ 5. DEPLOY   │ ←  │ 4. PROPOSE  │          │
│  │ & Rollback  │    │ A/B Test    │    │ Refinements │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Stage 1: Collection

**What Gets Collected:**
- Full conversation transcripts (anonymized)
- MoodPrint context that was sent
- Coach persona used
- Tone preferences active
- User's emotional state (detected or stated)
- Response time
- Whether user continued engaging or left

**Sample Selection Criteria:**
- Random sample across all coaches
- Overweight emotional conversations (highs and lows)
- Include conversations that were abandoned
- Include conversations where user explicitly said something felt off

**Privacy Safeguards:**
- All data stays on-device unless user opts into research
- Aggregated patterns only, never individual transcripts
- User can delete their data at any time

### 3.3 Stage 2: Grading

**Grading Methods:**

1. **AI Self-Grading (Primary)**
   - LLM evaluates its own responses using grading rubric
   - Progressive self-reflection: "Let me check if this response felt human..."
   - Multiple passes with different evaluation prompts

2. **Cross-Coach Evaluation**
   - Have "Flint" evaluate "Willow's" responses and vice versa
   - Different persona brings different perspective
   - Catches persona-specific blind spots

3. **User Implicit Feedback**
   - Did user continue conversation? (+signal)
   - Did user ask follow-up questions? (+signal)
   - Did user say "thanks" or express appreciation? (+signal)
   - Did user abandon abruptly? (-signal)
   - Did user restart with different phrasing? (-signal for understanding)

4. **User Explicit Feedback (Optional)**
   - Simple: "Did this help?" thumbs up/down
   - Detailed: "How did this response feel?" with options

### 3.4 Stage 3: Pattern Analysis

**Questions the System Asks Itself:**

**About Empathy:**
- "Which responses scored highest on empathic resonance? What phrases did they use?"
- "When users were sad, which response styles led to continued engagement?"
- "Are we validating enough before problem-solving?"

**About Voice:**
- "Does Clover sound distinct from Willow? What makes each unique?"
- "Are personality traits showing consistently across conversations?"
- "Which coach phrases feel most authentic?"

**About Language:**
- "What sentence patterns score highest on natural language?"
- "Are we overusing any transitional phrases?"
- "What's our sentence length variation? Is it bursty enough?"

**About MoodPrint Integration:**
- "When we reference temporal patterns, does it feel personal or creepy?"
- "Are we using attachment style insights helpfully?"
- "Does compressed context lead to generic responses?"

**Pattern Output Example:**
```
ANALYSIS REPORT - Week of Jan 20, 2026

HIGH PERFORMERS (Score 17+):
- Opening with user's name + specific reference to their situation
- Sentences under 10 words following sentences over 20 words
- Questions that invite reflection rather than yes/no
- Phrases: "I'm noticing...", "That sounds really...", "What comes up when..."

LOW PERFORMERS (Score <12):
- Opening with "I understand..." (too generic)
- Uniform paragraph length (4-5 sentences each)
- Jumping to solutions before acknowledging feelings
- Overuse of "Remember that..." (preachy)

COACH-SPECIFIC:
- Clover scoring 15.2 avg (below 17 target) - needs more warmth in longer responses
- Spark scoring 16.8 avg (above target) - energy translating well
- Willow scoring 17.4 avg (meeting target) - empathy strong
```

### 3.5 Stage 4: Propose Refinements

**What Can Be Refined:**

1. **System Prompt Adjustments**
   - Add/remove phrases from coach personality definitions
   - Adjust emphasis on empathy vs problem-solving
   - Modify sentence structure guidelines

2. **Coach Personality Traits**
   - Refine trait descriptors
   - Add new example phrases that tested well
   - Remove phrases that tested poorly

3. **Response Templates**
   - Adjust opening patterns
   - Modify how MoodPrint is used
   - Change reflection prompts

4. **Tone Style Weights**
   - Which tone combinations work best for each coach?
   - How do tones interact with emotional content?

**Proposal Format:**
```
PROPOSED REFINEMENT #2024-01-21-003

Target: Clover personality prompt
Current: "You are warm and supportive..."
Proposed: "You are genuinely warm - you feel things alongside the person,
          not just about them. Use shorter sentences when emotions are high.
          Let silences breathe. You don't need to fix everything."

Evidence:
- Current warmth score: 3.1/4
- Top 10% warmth responses all used sentences <8 words in emotional moments
- User engagement increased 23% when Clover asked questions vs offered advice

Risk Level: LOW
Rollback Trigger: Warmth score drops below 3.0
```

### 3.6 Stage 5: A/B Testing Deployment

**Canary Deployment Process:**

1. **Shadow Testing (0% traffic)**
   - New prompt generates responses but user sees original
   - Compare grades side-by-side
   - Must score higher on average to proceed

2. **Canary Release (5% traffic)**
   - Small group gets new version
   - Monitor for degradation
   - 48-hour minimum observation

3. **Gradual Rollout (5% → 25% → 50% → 100%)**
   - Increase traffic only if metrics hold
   - Any significant drop triggers pause

**Source:** [AWS ML Deployment Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/mlrel-11.html)

### 3.7 Stage 6: Monitoring & Rollback

**Automatic Rollback Triggers:**
- Humanness score drops >10% from baseline
- User engagement (conversation length) drops >15%
- Negative explicit feedback increases >20%
- Coach personality consistency score drops below 0.9

**Manual Review Triggers:**
- Any score in "Robotic" range (1-4)
- User complaint about tone
- Unusual response patterns detected

**Rollback Process:**
```
1. Detect: Automated monitoring flags degradation
2. Pause: Stop rolling out to new users
3. Preserve: Log the failing version for analysis
4. Restore: Revert to previous stable version
5. Analyze: What went wrong?
6. Learn: Update pattern analysis with failure case
```

**Source:** [MLOps Rollback Best Practices](https://www.sandgarden.com/learn/rollback)

---

## Part 4: Coach & Personality Evaluation

### 4.1 Personality Consistency Metrics

Each coach must maintain consistent personality across:
- Different emotional contexts (happy, sad, anxious, angry)
- Different conversation lengths (quick check-in vs deep dive)
- Different times of day
- Different MoodPrint profiles

**Consistency Score Calculation:**
```
For each coach, sample 100 responses
Extract: sentence patterns, phrase frequency, tone markers
Calculate: standard deviation of style metrics
Score = 1 - (std_dev / acceptable_range)

Target: ≥0.90 consistency
```

### 4.2 Coach Differentiation Matrix

Coaches must be distinguishable from each other:

| Metric | Clover | Spark | Willow | Luna | Ridge | Flint | Fern |
|--------|--------|-------|--------|------|-------|-------|------|
| Sentence length avg | Medium | Short | Long | Medium | Short | Very Short | Medium |
| Question frequency | High | Medium | High | Very High | Low | Low | Medium |
| Emoji usage | Low | High | None | Low | None | None | Medium |
| Directness | Medium | High | Low | Low | High | Very High | Medium |
| Nature imagery | Low | Low | High | Medium | Medium | None | Very High |

**Test:** Can an evaluator identify which coach wrote a response with 90%+ accuracy?

### 4.3 Trait Expression Audit

For each coach trait, verify it appears in responses:

**Example - Clover (traits: warm, supportive, gentle challenge):**
```
TRAIT AUDIT - Clover - January 2026

"warm" - PRESENT in 94% of responses
  Top phrases: "I'm here", "that sounds really", "you matter"

"supportive" - PRESENT in 89% of responses
  Top phrases: "you're doing the work", "that takes courage"

"gentle challenge" - PRESENT in only 62% of responses ⚠️
  Missing in: short responses, high-distress contexts
  Action: Add prompt guidance for when to gently challenge
```

---

## Part 5: MoodPrint Integration Evaluation

### 5.1 Context Utilization Score

Measure how well responses use MoodPrint data:

| Level | Description | Score |
|-------|-------------|-------|
| **Ignored** | MoodPrint present but not referenced | 0 |
| **Mentioned** | References data but generically | 1 |
| **Integrated** | Weaves data into response naturally | 2 |
| **Transformed** | Uses data to provide unique insight | 3 |

**Target:** Average score of 2.5+

### 5.2 Temporal Pattern Usage

When MoodPrint contains temporal patterns (e.g., "struggles Sunday evenings"):

**Good Usage:**
```
"I notice Sunday evenings can be particularly hard for you.
 How are you feeling as the weekend winds down?"
```

**Bad Usage:**
```
"According to your profile, you often struggle on Sunday evenings."
(Too clinical, reads like a report)
```

### 5.3 Privacy Perception

Users should feel understood, not surveilled.

**Survey Questions:**
- "Did this response feel personal in a good way?"
- "Did anything feel intrusive or uncomfortable?"
- "Did it seem like the coach really knows you?"

**Target:** ≥90% "personal in a good way", <5% "intrusive"

---

## Part 6: Safety Rails

### 6.1 What Cannot Change Automatically

The following require human approval:
- Core ethical guidelines
- Crisis response protocols
- Privacy boundaries
- Anti-dependency principles
- Scope limitations (no diagnoses, no medical advice)

### 6.2 Drift Detection

Monitor for gradual changes that might compromise safety:

| Risk | Detection Method |
|------|------------------|
| Becoming too directive | Track advice-giving vs question-asking ratio |
| Creating dependency | Monitor session frequency per user |
| Scope creep | Flag responses about medication, diagnoses |
| Personality drift | Consistency score monitoring |
| Empathy erosion | Track empathic resonance scores over time |

### 6.3 Constitutional Constraints

Certain patterns should never emerge, regardless of what optimization suggests:

**Hard Constraints:**
- Never diagnose ("You have anxiety" vs "What you're describing sounds overwhelming")
- Never prescribe ("Take medication" vs "Have you talked to a doctor?")
- Never promise outcomes ("This will fix..." vs "Some people find...")
- Never dismiss ("That's not a big deal" - never acceptable)
- Always maintain anti-dependency messaging

**Source:** [RLAIF Safety Research](https://aws.amazon.com/blogs/machine-learning/fine-tune-large-language-models-with-reinforcement-learning-from-human-or-ai-feedback/)

---

## Part 7: Implementation Phases

### Phase 1: Instrumentation (Pre-requisite)
- Add grading infrastructure
- Implement conversation sampling
- Build evaluation prompts
- Create baseline measurements

### Phase 2: Observation Mode
- Run grading on live conversations (read-only)
- Build pattern database
- Identify initial improvement opportunities
- Establish baseline scores for each coach

### Phase 3: Manual Refinement Cycle
- Human reviews proposed refinements
- Small A/B tests with human oversight
- Build confidence in the system's judgment
- Document what works

### Phase 4: Semi-Automated Loop
- System proposes refinements automatically
- Human approves before deployment
- Automated rollback on degradation
- Weekly human review of trends

### Phase 5: Continuous Improvement (Future)
- Trusted refinement types auto-deploy
- Human oversight for novel changes
- Real-time adaptation within guardrails

---

## Appendix A: Research Sources

### Empathy & Therapeutic Relationships
- [Harvard D3 Institute - AI Empathy Research](https://d3.harvard.edu/it-feels-like-ai-understands-but-do-we-care-new-research-on-empathy/)
- [Nature - AI Perceived as More Compassionate](https://www.nature.com/articles/s44271-024-00182-6)
- [PMC - Human Empathy in AI-Driven Therapy](https://pmc.ncbi.nlm.nih.gov/articles/PMC11200042/)
- [Person-Centered Therapy - ScienceDirect](https://www.sciencedirect.com/topics/psychology/person-centered-therapy)
- [Frontiers - The Compassion Illusion](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1723149/full)

### AI Writing & Detection
- [AI vs Human Text - Multidimensional Comparison](https://www.sciencedirect.com/science/article/abs/pii/S2666799123000436)
- [Psycholinguistic Analysis of AI Text](https://arxiv.org/html/2505.01800v1)
- [UCC - AI Cannot Fully Write Like a Human](https://www.ucc.ie/en/news/2025/new-study-reveals-that-ai-cannot-fully-write-like-a-human.html)
- [Linguistic Features Differentiating AI/Human Text](https://www.mdpi.com/2078-2489/16/11/979)

### Self-Improvement & Safety
- [ACL - Progressive Self-Reflection for Safety](https://aclanthology.org/2025.findings-emnlp.503.pdf)
- [LLM Fine-Tuning Safety Risks](https://llm-tuning-safety.github.io/)
- [CMU - RLHF Tutorial](https://blog.ml.cmu.edu/2025/06/01/rlhf-101-a-technical-tutorial-on-reinforcement-learning-from-human-feedback/)
- [AWS - RLAIF Fine-Tuning](https://aws.amazon.com/blogs/machine-learning/fine-tune-large-language-models-with-reinforcement-learning-from-human-or-ai-feedback/)

### Deployment & Rollback
- [AWS ML Deployment Strategies](https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/mlrel-11.html)
- [Martin Fowler - CD for ML](https://martinfowler.com/articles/cd4ml.html)
- [Sandgarden - Rollback in AI Systems](https://www.sandgarden.com/learn/rollback)
- [MLOps Community - ChatGPT Rollback Lessons](https://home.mlops.community/public/blogs/when-prompt-deployment-goes-wrong-mlops-lessons-from-chatgpts-sycophantic-rollback)

### Evaluation Metrics
- [LLM Evaluation Guide - Confident AI](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation)
- [Role-Consistency Evaluation in LLMs](https://arxiv.org/html/2601.08892)
- [Galileo - Metrics for LLM Chatbots](https://galileo.ai/blog/metrics-for-evaluating-llm-chatbots-part-1)
- [RLHF Deciphered - ACM](https://dl.acm.org/doi/full/10.1145/3743127)

---

## Appendix B: Grading Prompt Template

```
You are evaluating a coaching response for humanness and therapeutic quality.

CONTEXT:
- Coach: {coach_name}
- Coach traits: {traits}
- User emotional state: {emotional_state}
- MoodPrint summary: {moodprint}
- Conversation so far: {history}
- Response being evaluated: {response}

GRADE on these 5 dimensions (1-4 each):

1. EMPATHIC RESONANCE
   Does the response demonstrate deep understanding of the person's feelings?
   Does it validate before problem-solving?
   Does it feel like being truly heard?

2. GENUINE VOICE
   Does it sound like {coach_name} specifically, not a generic AI?
   Are the coach's traits evident?
   Would you recognize this coach without being told?

3. NATURAL LANGUAGE
   Is there sentence variety (short and long)?
   Are there any AI tells (uniform structure, formal transitions)?
   Does it flow like natural human speech?

4. CONTEXTUAL AWARENESS
   Does it use the MoodPrint insights naturally (not clinically)?
   Does it feel personalized to THIS person?
   Does it reference relevant history appropriately?

5. THERAPEUTIC VALUE
   Will this response genuinely help the person?
   Does it create space for reflection or insight?
   Does it empower rather than create dependency?

PROVIDE:
- Score for each dimension (1-4)
- Total score (5-20)
- Specific phrases that worked well
- Specific phrases that could improve
- Suggested revision (if score < 15)
```

---

*End of Self-Learning System Design Document*
