# Mood Leaf - Frequently Asked Questions

## For Users

### General

**Q: What is Mood Leaf?**
A: Mood Leaf is an AI journaling and coaching app that adapts to how YOU think. Unlike other AI apps that use one-size-fits-all responses, Mood Leaf learns your unique communication style, emotional processing, and thinking patterns.

**Q: What is MoodPrint?**
A: MoodPrint is your unique fingerprint - the synthesis of how you think, feel, and communicate. It includes:
- How you process information (patterns, details, stories, feelings)
- What you've shared with the coach over time
- How you prefer to receive information
- What communication approaches work best for you

Think of it as the coach's understanding of YOU as a person, not just your problems.

**Q: Is the AI reading my mind?**
A: No. It responds to what you write and learns patterns over time. It's smart, not psychic. It uses your onboarding answers and conversation history to adapt.

**Q: Can I delete my data?**
A: Yes. Settings → Clear Data. Everything is gone - locally and irreversibly.

**Q: Is this therapy?**
A: No. Mood Leaf is a journaling companion and coaching tool. It cannot and does not replace professional mental health treatment. For mental health concerns, please see a licensed professional.

**Q: What if I'm in crisis?**
A: The app shows crisis resources automatically when it detects distress. Please call a helpline or go to emergency services for immediate help:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741

---

### The Coach

**Q: Why does the coach sometimes feel off?**
A: It's learning. Tell it "that didn't feel right" and it adapts. The more you use it, the better it gets. Your MoodPrint evolves over time.

**Q: Can I change my coach persona?**
A: Yes. Go to Coach Settings and select a different coach. Each has a distinct personality (warm, energetic, wise, mindful, action-oriented, direct, or nurturing).

**Q: What's the difference between coaches?**
A:
- **Clover** - Warm bestie for casual support
- **Spark** - Energetic hype squad for motivation
- **Willow** - Wise sage for deep reflection
- **Luna** - Mindful guide for meditation and presence
- **Ridge** - Action coach for goals and accountability
- **Flint** - Straight shooter for direct feedback
- **Fern** - Cozy blanket for gentle nurturing

**Q: How does the coach adapt to me?**
A: The coach learns:
- Your energy level (won't bombard you with questions when tired)
- Your processing style (uses metaphors if you think in stories)
- Your emotional needs (validates first if you're a feelings-first person)
- Your communication preference (brief vs detailed responses)

---

### Privacy

**Q: Where is my data stored?**
A: All data stays on YOUR device:
- Journal entries
- Your MoodPrint (cognitive profile)
- Conversation history
- Memory of what you've shared

**Q: What goes to the AI?**
A: Only what's needed to generate responses:
- Your messages
- Context about your patterns (anonymized)
- NOT your name or identifiable information

**Q: Do you sell my data?**
A: No. Never. We don't sell data, don't train AI on your journals without consent, and don't share with third parties.

**Q: Can I export my data?**
A: Yes. You can export your memory and MoodPrint as JSON through the app settings.

---

### Technical

**Q: Do I need an API key?**
A: Yes, for the AI coach features. You need a Claude API key from console.anthropic.com. The coach won't work without it.

**Q: Why does the coach need my API key?**
A: Mood Leaf is designed for privacy. YOUR key means:
- We never see your conversations
- Your data stays between you and Claude
- No middleman servers storing your journals

**Q: What about Text-to-Speech?**
A: TTS is optional. If you want the coach to speak responses, you need a Google Cloud TTS API key. Without it, you just get text.

**Q: Does the app work offline?**
A: Journaling works offline. The AI coach needs internet to reach Claude. In the future, local LLM support (Ollama) may enable offline chat.

---

## For Developers

### Architecture

**Q: What is MoodPrint technically?**
A: MoodPrint (`moodPrintService.ts`) is the synthesis layer that combines:
- `CognitiveProfile` from `cognitiveProfileService.ts`
- Memory from `memoryTierService.ts` (short/mid/long term)
- Conversation patterns from `conversationController.ts`
- Quality metrics from `humanScoreService.ts`

```typescript
const moodPrint = await getMoodPrint();
const summary = await getMoodPrintSummary();
const context = await getMoodPrintContextForLLM();
```

**Q: How do the services interact?**
A:
```
User Message
    ↓
claudeAPIService.ts (orchestrator)
    ├── cognitiveProfileService.ts → How they think
    ├── memoryTierService.ts → What we know
    ├── conversationController.ts → How to respond
    └── humanScoreService.ts → Score after response
    ↓
MoodPrint context → Claude API
    ↓
Response scored, memory updated
```

**Q: Why a three-tier memory system?**
A:
- **Short-term**: Last 20 messages, current mood - for immediate context
- **Mid-term**: Weekly summaries - for patterns without token cost
- **Long-term**: Core identity - permanent, rarely changes

This mimics human memory and reduces context window usage.

**Q: What's the Human Score Service for?**
A: It scores every AI response for "human-ness" (0-100). Two purposes:
1. **Improve now**: Identify common issues in responses
2. **Independence later**: Collect training data for local scorer

After 500+ Claude-scored examples, we can train a local scorer and remove Claude dependency.

**Q: How does the Conversation Controller work?**
A: It's a rules layer ABOVE the LLM that:
- Detects user energy/mood
- Generates response directives (timing, length, tone)
- Blocks AI-isms ("I understand how you feel")
- Integrates cognitive adaptations (use metaphors, validate first)

The LLM doesn't decide these rules - we tell it what to do.

---

### Extending the System

**Q: How do I add a new cognitive dimension?**
A:
1. Add type to `cognitiveProfileService.ts`
2. Add to `CognitiveProfile` interface
3. Add onboarding question to `ONBOARDING_QUESTIONS`
4. Add to `getCoachAdaptations()` if it affects responses
5. Add to `getCognitiveProfileContextForLLM()`

**Q: How do I add a new conversation rule?**
A:
1. Add to `ResponseDirectives` interface
2. Add logic in `generateResponseDirectives()`
3. Add prompt text in `buildPromptModifiers()`

**Q: How do I add local LLM support?**
A:
1. All services work unchanged (LLM-agnostic)
2. Create `localLLMService.ts`
3. Swap calls in `claudeAPIService.ts`
4. Note: Need MORE compression for smaller context windows
5. Claude becomes evaluator-only, then optional

---

### Design Decisions

**Q: Why no MBTI/personality labels?**
A: Labels feel like boxes. We describe behaviors, not types:
- Say "You think in patterns" not "You're an INTJ"
- Say "Emotions come first for you" not "You're a Feeler"
- No clinical labels unless user uses them first

**Q: Why is validation vs solutions a spectrum?**
A: The stereotype is women want to be heard, men want solutions. But:
- It's actually a spectrum in everyone
- We weight it per-person (e.g., 70% validation, 30% solutions)
- It can change based on context (crisis = more validation)

**Q: Why score every response?**
A: Three reasons:
1. Identify what's not working (generic openers, too verbose)
2. Learn what DOES work for this user
3. Collect training data for future local scorer

**Q: Why keep cognitive profile separate from other services?**
A: Granular control. The cognitive profile is:
- Discovered through onboarding (separate flow)
- Relatively stable (changes slowly)
- Used by multiple services
- Potentially shareable/exportable

Lumping it in would make it harder to modify independently.

---

### Debugging

**Q: How do I see the current MoodPrint?**
A:
```typescript
import { debugMoodPrint } from './services/moodPrintService';
await debugMoodPrint();
```

**Q: How do I check scoring stats?**
A:
```typescript
import { getScoreStats } from './services/humanScoreService';
const stats = await getScoreStats();
console.log(stats.averageScore, stats.commonIssues);
```

**Q: How do I test conversation rules?**
A:
```typescript
import { buildConversationContext, generateResponseDirectives } from './services/conversationController';
const ctx = await buildConversationContext('test', [], 'I feel tired');
const directives = await generateResponseDirectives(ctx);
console.log(directives); // tone='gentle', maxLength='brief'
```

**Q: How do I export training data?**
A:
```typescript
import { exportForTraining } from './services/humanScoreService';
const data = await exportForTraining();
// JSON with all scored exchanges
```

---

## Contact & Support

- **Issues**: https://github.com/anthropics/claude-code/issues
- **Documentation**: `/docs/` folder in the project
- **Architecture**: `HYBRID_AI_ARCHITECTURE.md`
- **Development**: `DEVELOPMENT_GUIDE.md`
- **Handoff**: `HANDOFF.md`

---

*Last updated: January 2026*
