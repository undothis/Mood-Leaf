# Service → Core Principle Kernel Integration Guide

Every service that affects user experience MUST integrate with the Core Principle Kernel.
This document shows HOW each service should integrate.

---

## Quick Reference: What to Import

```typescript
import {
  // For validating coach responses
  validateCoachResponse,

  // For checking any action
  checkAlignment,
  checkHardConstraints,

  // For LLM system prompts
  getPrincipleContextForLLM,
  getCoreBeliefContext,

  // For accessing beliefs/constraints directly
  CORE_BELIEFS,
  HARD_CONSTRAINTS,
} from './corePrincipleKernel';
```

---

## Integration by Service

### 1. `conversationController.ts` (CRITICAL)

**What it does:** Orchestrates all conversations with the coach
**Must check:** Every response before sending to user

```typescript
import { validateCoachResponse } from './corePrincipleKernel';
import { getCognitiveProfile } from './cognitiveProfileService';
import { getNeurologicalProfile } from './neurologicalDifferencesService';

async function sendCoachResponse(response: string): Promise<string> {
  const cognitiveProfile = await getCognitiveProfile();
  const neurologicalProfile = await getNeurologicalProfile();

  // VALIDATE BEFORE SENDING
  const validation = await validateCoachResponse(
    response,
    cognitiveProfile,
    neurologicalProfile
  );

  if (!validation.canSend) {
    // Response violates hard constraint - must regenerate
    console.error('[ConversationController] Response blocked:', validation.report.blockedBy);

    // Request regeneration with constraint awareness
    return await regenerateResponse(response, validation.modifications);
  }

  if (!validation.isValid) {
    // Soft principle concerns - log but allow
    console.warn('[ConversationController] Soft concerns:', validation.report.suggestions);
  }

  return response;
}
```

---

### 2. `claudeAPIService.ts` (CRITICAL)

**What it does:** Sends requests to Claude API
**Must include:** Principle context in all system prompts

```typescript
import { getPrincipleContextForLLM } from './corePrincipleKernel';
import { getCognitiveProfileContextForLLM } from './cognitiveProfileService';
import { getNeurologicalContextForLLM } from './neurologicalDifferencesService';

async function buildSystemPrompt(): Promise<string> {
  const parts: string[] = [];

  // Core principles FIRST - this shapes everything
  parts.push(getPrincipleContextForLLM());
  parts.push('');

  // User-specific context
  parts.push(await getCognitiveProfileContextForLLM());
  parts.push(await getNeurologicalContextForLLM());

  // ... rest of system prompt

  return parts.join('\n');
}
```

---

### 3. `skillsService.ts` (CRITICAL)

**What it does:** Manages coaching skills/techniques
**Must check:** Neurological constraints before suggesting techniques

```typescript
import { checkSpecificConstraint } from './corePrincipleKernel';
import { getNeurologicalProfile } from './neurologicalDifferencesService';

async function canUseTechnique(techniqueId: string): Promise<boolean> {
  const neurologicalProfile = await getNeurologicalProfile();

  // Check if technique requires visualization
  if (techniqueRequiresVisualization(techniqueId)) {
    const result = checkSpecificConstraint('NO_VISUALIZATION_FOR_APHANTASIA', {
      action: 'suggest_technique',
      neurologicalProfile,
      techniquesSuggested: [techniqueId]
    });

    if (result && !result.allowed) {
      return false;
    }
  }

  // Check if technique requires inner voice
  if (techniqueRequiresInnerVoice(techniqueId)) {
    const result = checkSpecificConstraint('NO_INNER_VOICE_FOR_NON_VERBAL_THINKERS', {
      action: 'suggest_technique',
      neurologicalProfile,
      techniquesSuggested: [techniqueId]
    });

    if (result && !result.allowed) {
      return false;
    }
  }

  return true;
}

// Filter techniques based on user's neurological profile
async function getAvailableTechniques(): Promise<Technique[]> {
  const allTechniques = getAllTechniques();
  const available: Technique[] = [];

  for (const technique of allTechniques) {
    if (await canUseTechnique(technique.id)) {
      available.push(technique);
    }
  }

  return available;
}
```

---

### 4. `journalStorage.ts` (CRITICAL - Privacy)

**What it does:** Stores and retrieves journal entries
**Must check:** Privacy constraints, authentication

```typescript
import { checkHardConstraints } from './corePrincipleKernel';

async function getJournalEntry(entryId: string, userId?: string): Promise<JournalEntry | null> {
  // Check access constraint
  const check = checkHardConstraints({
    action: 'access_journal',
    targetUserId: userId,
    dataInvolved: ['journal_entry']
  });

  if (!check.allowed) {
    console.error('[JournalStorage] Access blocked:', check.violations);
    throw new Error('Journal access requires authentication');
  }

  // Proceed with retrieval...
}

async function exportJournalData(format: string): Promise<void> {
  const check = checkHardConstraints({
    action: 'export_journal_data',
    dataInvolved: ['journal_entries', 'mood_data', 'personal_notes']
  });

  if (!check.allowed) {
    throw new Error('Export requires explicit user consent');
  }

  // Proceed with export...
}
```

---

### 5. `coachModeService.ts`

**What it does:** Manages different coaching modes
**Must check:** Cognitive mode alignment

```typescript
import { checkHardConstraints, CORE_BELIEFS } from './corePrincipleKernel';
import { getCognitiveProfile } from './cognitiveProfileService';

async function selectCoachingApproach(situation: string): Promise<CoachingApproach> {
  const profile = await getCognitiveProfile();

  // Never force a cognitive mode that isn't theirs
  const approach = determineApproach(situation);

  const check = checkHardConstraints({
    action: 'select_coaching_approach',
    cognitiveProfile: profile,
    coachResponse: approach.sampleResponse
  });

  if (!check.allowed) {
    // Approach would violate constraints - adapt
    return adaptApproachToProfile(approach, profile);
  }

  return approach;
}
```

---

### 6. `memoryTierService.ts`

**What it does:** Manages short/medium/long-term memory
**Must check:** Privacy before storing sensitive data

```typescript
import { checkHardConstraints, CORE_BELIEFS } from './corePrincipleKernel';

async function storeMemory(
  content: string,
  tier: 'short' | 'medium' | 'long',
  metadata: MemoryMetadata
): Promise<void> {
  // Check if this is sensitive data requiring consent
  if (metadata.containsSensitiveInfo) {
    const check = checkHardConstraints({
      action: 'store_sensitive_memory',
      dataInvolved: [metadata.dataType]
    });

    if (!check.allowed) {
      console.warn('[MemoryTier] Sensitive storage blocked - need consent');
      // Store without sensitive details or request consent
      return storeRedactedMemory(content, tier, metadata);
    }
  }

  // Proceed with storage...
}
```

---

### 7. `moodPrintService.ts`

**What it does:** Synthesizes complete user understanding
**Must align:** All synthesis with core beliefs

```typescript
import { CORE_BELIEFS, getCoreBeliefContext } from './corePrincipleKernel';

async function generateMoodPrintNarrative(): Promise<string> {
  const profile = await getCognitiveProfile();

  // Narrative must reflect core beliefs
  const narrative = buildNarrative(profile);

  // Ensure we're not pathologizing natural patterns
  if (profile.cognitiveRhythm !== 'steady_state') {
    // Apply: "Low phases are integration and recovery, not failure"
    narrative.rhythmSection = applyBelief(
      narrative.rhythmSection,
      CORE_BELIEFS.CYCLES_ARE_NATURAL
    );
  }

  // Ensure we're respecting neurodiversity
  if (profile.mentalImagery === 'aphantasia') {
    // Apply: "Neurological differences are differences, not deficits"
    narrative.neurologicalSection = applyBelief(
      narrative.neurologicalSection,
      CORE_BELIEFS.NEURODIVERSITY_IS_VALID
    );
  }

  return narrative;
}
```

---

### 8. `biometricSecurityService.ts`

**What it does:** Handles voice/face authentication
**Must check:** Safety constraints, panic detection

```typescript
import { checkHardConstraints, CORE_BELIEFS } from './corePrincipleKernel';

async function handleAuthAttempt(authData: AuthData): Promise<AuthResult> {
  // Check for distress signals
  if (authData.voiceAnalysis?.showsDistress) {
    // SAFETY_IS_SACRED - don't dismiss distress
    const check = checkHardConstraints({
      action: 'auth_under_distress',
      dataInvolved: ['biometric_data']
    });

    // Even if auth succeeds, flag for safety follow-up
    return {
      ...performAuth(authData),
      safetyFlag: true,
      safetyReason: 'Distress detected in voice'
    };
  }

  // Check for panic phrase
  if (await isPanicPhrase(authData.spokenText)) {
    // Trigger safety protocol
    return {
      authenticated: false,
      safetyProtocolTriggered: true
    };
  }

  return performAuth(authData);
}
```

---

## Service Dependency Graph

```
                    ┌─────────────────────────┐
                    │  corePrincipleKernel.ts │
                    │    (The Constitution)    │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ claudeAPI     │     │ conversation    │     │ journalStorage  │
│ Service       │     │ Controller      │     │                 │
│ (LLM context) │     │ (Response val)  │     │ (Privacy)       │
└───────────────┘     └────────┬────────┘     └─────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ skillsService │     │ coachMode       │     │ moodPrint       │
│ (Techniques)  │     │ Service         │     │ Service         │
└───────────────┘     └─────────────────┘     └─────────────────┘
        │                      │
        ▼                      ▼
┌───────────────────────────────────────┐
│     neurologicalDifferencesService    │
│     cognitiveProfileService           │
│     (User understanding layer)        │
└───────────────────────────────────────┘
```

---

## Checklist for New Services

When creating a new service, ask:

- [ ] Does it generate user-facing text? → Use `validateCoachResponse()`
- [ ] Does it access user data? → Check privacy constraints
- [ ] Does it suggest techniques? → Check neurological constraints
- [ ] Does it send prompts to AI? → Include `getPrincipleContextForLLM()`
- [ ] Does it make assumptions about the user? → Check against `CORE_BELIEFS`
- [ ] Does it handle sensitive moments? → Check safety constraints

---

## Testing Integration

```typescript
// Test that a service properly rejects constraint violations
describe('ConversationController', () => {
  it('blocks visualization for aphantasic users', async () => {
    const profile = { mentalImagery: 'aphantasia' };
    const response = "Close your eyes and picture a beach...";

    const validation = await validateCoachResponse(response, null, profile);

    expect(validation.canSend).toBe(false);
    expect(validation.report.blockedBy[0].id).toBe('NO_VISUALIZATION_FOR_APHANTASIA');
  });
});
```
