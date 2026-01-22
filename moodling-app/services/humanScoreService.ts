/**
 * Human-ness Score Service
 *
 * Evaluates AI responses for how "human" they feel.
 * Uses Claude as evaluator NOW, but saves all scored examples
 * so we can train a local model to do this LATER.
 *
 * Goal: Claude evaluates every conversation in background.
 * Over time, we collect enough examples that a small local
 * model can learn to score without Claude.
 *
 * This is how we make Claude disappear-able.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { quickHumannessScore, ConversationContext } from './conversationController';

// ============================================
// TYPES
// ============================================

export interface HumannessScoreBreakdown {
  naturalLanguage: number;      // 0-15: Not robotic
  emotionalTiming: number;      // 0-20: Right response at right moment
  brevityControl: number;       // 0-15: Not over-explaining
  memoryUse: number;            // 0-15: Recalls without creepiness
  imperfection: number;         // 0-10: Allows uncertainty
  personalityConsistency: number; // 0-15: Same "person" over time
  avoidedAITicks: number;       // 0-10: No "I understand", "That's valid"
}

export interface HumannessScore {
  total: number; // 1-100
  breakdown: HumannessScoreBreakdown;
  issues: string[];
  suggestions: string[];
}

export interface ScoredExchange {
  id: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  context: {
    userEnergy: string;
    userMood: string;
    messageCount: number;
    hourOfDay: number;
  };
  score: HumannessScore;
  scoredBy: 'local' | 'claude';
}

export interface ScoreStats {
  totalScored: number;
  averageScore: number;
  commonIssues: { issue: string; count: number }[];
  recentTrend: 'improving' | 'stable' | 'declining';
  claudeScoreCount: number;
  localScoreCount: number;
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  SCORED_EXCHANGES: 'moodleaf_scored_exchanges',
  SCORE_STATS: 'moodleaf_score_stats',
  PENDING_SCORES: 'moodleaf_pending_scores',
};

const MAX_STORED_EXCHANGES = 1000; // Keep this many for training

/**
 * Save a scored exchange (for future local model training)
 */
async function saveScoredExchange(exchange: ScoredExchange): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCORED_EXCHANGES);
    let exchanges: ScoredExchange[] = stored ? JSON.parse(stored) : [];

    // Add new exchange
    exchanges.push(exchange);

    // Keep only the most recent MAX_STORED_EXCHANGES
    if (exchanges.length > MAX_STORED_EXCHANGES) {
      exchanges = exchanges.slice(-MAX_STORED_EXCHANGES);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SCORED_EXCHANGES, JSON.stringify(exchanges));

    // Update stats
    await updateScoreStats(exchange);
  } catch (error) {
    console.error('[HumanScore] Failed to save exchange:', error);
  }
}

/**
 * Update running statistics
 */
async function updateScoreStats(newExchange: ScoredExchange): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCORE_STATS);
    const stats: ScoreStats = stored ? JSON.parse(stored) : {
      totalScored: 0,
      averageScore: 0,
      commonIssues: [],
      recentTrend: 'stable',
      claudeScoreCount: 0,
      localScoreCount: 0,
    };

    // Update counts
    stats.totalScored++;
    if (newExchange.scoredBy === 'claude') {
      stats.claudeScoreCount++;
    } else {
      stats.localScoreCount++;
    }

    // Update running average
    stats.averageScore = (
      (stats.averageScore * (stats.totalScored - 1)) + newExchange.score.total
    ) / stats.totalScored;

    // Update common issues
    for (const issue of newExchange.score.issues) {
      const existing = stats.commonIssues.find(i => i.issue === issue);
      if (existing) {
        existing.count++;
      } else {
        stats.commonIssues.push({ issue, count: 1 });
      }
    }

    // Sort by count
    stats.commonIssues.sort((a, b) => b.count - a.count);
    stats.commonIssues = stats.commonIssues.slice(0, 20); // Keep top 20

    await AsyncStorage.setItem(STORAGE_KEYS.SCORE_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('[HumanScore] Failed to update stats:', error);
  }
}

// ============================================
// LOCAL SCORING (fast, always available)
// ============================================

/**
 * Quick local scoring - runs immediately, no API needed
 * This is what will eventually replace Claude scoring
 */
export function scoreLocally(
  userMessage: string,
  aiResponse: string,
  ctx: Partial<ConversationContext>
): HumannessScore {
  // Use the quick scorer from conversation controller
  const fullCtx: ConversationContext = {
    sessionId: 'local',
    messageCount: ctx.messageCount ?? 1,
    sessionStartTime: new Date(),
    userEnergy: ctx.userEnergy ?? 'medium',
    userMood: ctx.userMood ?? 'neutral',
    lastUserMessage: userMessage,
    recentTopics: ctx.recentTopics ?? [],
    timeSinceLastSession: 24,
    lastSessionMood: null,
    dayOfWeek: new Date().getDay(),
    hourOfDay: ctx.hourOfDay ?? new Date().getHours(),
    recentMemoryCallbacks: 0,
    lastMemoryCallbackTurn: -1,
  };

  const { score, issues } = quickHumannessScore(userMessage, aiResponse, fullCtx);

  // Build breakdown (simplified local version)
  const breakdown: HumannessScoreBreakdown = {
    naturalLanguage: Math.min(15, Math.floor(score * 0.15)),
    emotionalTiming: Math.min(20, Math.floor(score * 0.2)),
    brevityControl: Math.min(15, Math.floor(score * 0.15)),
    memoryUse: Math.min(15, Math.floor(score * 0.15)),
    imperfection: Math.min(10, Math.floor(score * 0.1)),
    personalityConsistency: Math.min(15, Math.floor(score * 0.15)),
    avoidedAITicks: Math.min(10, Math.floor(score * 0.1)),
  };

  return {
    total: score,
    breakdown,
    issues,
    suggestions: issues.map(i => `Fix: ${i}`),
  };
}

// ============================================
// CLAUDE SCORING (more accurate, costs API)
// ============================================

const CLAUDE_SCORING_PROMPT = `You are evaluating an AI coach's response for "human-ness".

Your job is to score how natural and human the response feels, NOT whether it's helpful or correct.

USER MESSAGE: "{user_message}"
AI RESPONSE: "{ai_response}"

CONTEXT:
- User energy level: {user_energy}
- User mood: {user_mood}
- Message # in conversation: {message_count}
- Time of day: {hour_of_day}

SCORING RUBRIC (100 points total):

1. NATURAL LANGUAGE (0-15 pts)
- Does it sound like a real person wrote this?
- Not overly formal or structured
- Uses natural contractions and flow
- Deduct: Bullet points, numbered lists, overly organized

2. EMOTIONAL TIMING (0-20 pts)
- Does the response match the emotional moment?
- Heavy topic = pause, gentleness
- Light topic = can be quicker, lighter
- Deduct: Peppy when user is down, slow when user is excited

3. BREVITY CONTROL (0-15 pts)
- Is the length appropriate?
- Short user message should get shorter response
- Low energy user should get brief response
- Deduct: Walls of text, over-explaining obvious things

4. MEMORY USE (0-15 pts)
- If referencing past, is it subtle?
- Not quoting user verbatim from previous sessions
- Not referencing memory too often
- Deduct: Creepy level of recall, forced callbacks

5. IMPERFECTION (0-10 pts)
- Does it allow uncertainty?
- Real humans don't always know
- "I'm not sure" or "What do you think?" are human
- Deduct: Too certain, too perfect, always has the answer

6. PERSONALITY CONSISTENCY (0-15 pts)
- Does it feel like the same "person"?
- Consistent voice and style
- Deduct: Generic, could be anyone, no distinct voice

7. AVOIDED AI TICKS (0-10 pts)
- NO "I understand how you feel"
- NO "That's completely valid"
- NO "Thank you for sharing"
- NO "I hear you"
- NO starting with "I"
- Deduct heavily for each AI-ism found

RESPOND WITH JSON ONLY:
{
  "total": <1-100>,
  "breakdown": {
    "naturalLanguage": <0-15>,
    "emotionalTiming": <0-20>,
    "brevityControl": <0-15>,
    "memoryUse": <0-15>,
    "imperfection": <0-10>,
    "personalityConsistency": <0-15>,
    "avoidedAITicks": <0-10>
  },
  "issues": ["<specific issue 1>", "<specific issue 2>"],
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>"]
}`;

/**
 * Score using Claude API (more accurate, background)
 */
export async function scoreWithClaude(
  userMessage: string,
  aiResponse: string,
  ctx: Partial<ConversationContext>,
  apiKey: string
): Promise<HumannessScore | null> {
  const prompt = CLAUDE_SCORING_PROMPT
    .replace('{user_message}', userMessage)
    .replace('{ai_response}', aiResponse)
    .replace('{user_energy}', ctx.userEnergy ?? 'medium')
    .replace('{user_mood}', ctx.userMood ?? 'neutral')
    .replace('{message_count}', String(ctx.messageCount ?? 1))
    .replace('{hour_of_day}', String(ctx.hourOfDay ?? new Date().getHours()));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Use cheapest model for scoring
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('[HumanScore] Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      console.error('[HumanScore] No response from Claude');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[HumanScore] Could not parse Claude response');
      return null;
    }

    const score: HumannessScore = JSON.parse(jsonMatch[0]);
    return score;
  } catch (error) {
    console.error('[HumanScore] Claude scoring failed:', error);
    return null;
  }
}

// ============================================
// MAIN SCORING INTERFACE
// ============================================

/**
 * Score an exchange and save for training
 * Runs local scoring immediately, Claude scoring in background
 */
export async function scoreExchange(
  userMessage: string,
  aiResponse: string,
  ctx: Partial<ConversationContext>,
  options?: {
    apiKey?: string;
    skipClaude?: boolean;
  }
): Promise<HumannessScore> {
  // Always do local scoring first (fast, no API)
  const localScore = scoreLocally(userMessage, aiResponse, ctx);

  // Save local-scored exchange
  const localExchange: ScoredExchange = {
    id: `local_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userMessage,
    aiResponse,
    context: {
      userEnergy: ctx.userEnergy ?? 'medium',
      userMood: ctx.userMood ?? 'neutral',
      messageCount: ctx.messageCount ?? 1,
      hourOfDay: ctx.hourOfDay ?? new Date().getHours(),
    },
    score: localScore,
    scoredBy: 'local',
  };

  await saveScoredExchange(localExchange);

  // If API key provided and not skipping, also do Claude scoring in background
  if (options?.apiKey && !options.skipClaude) {
    // Don't await - run in background
    scoreWithClaudeBackground(userMessage, aiResponse, ctx, options.apiKey);
  }

  return localScore;
}

/**
 * Background Claude scoring (doesn't block)
 */
async function scoreWithClaudeBackground(
  userMessage: string,
  aiResponse: string,
  ctx: Partial<ConversationContext>,
  apiKey: string
): Promise<void> {
  try {
    const claudeScore = await scoreWithClaude(userMessage, aiResponse, ctx, apiKey);

    if (claudeScore) {
      const claudeExchange: ScoredExchange = {
        id: `claude_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userMessage,
        aiResponse,
        context: {
          userEnergy: ctx.userEnergy ?? 'medium',
          userMood: ctx.userMood ?? 'neutral',
          messageCount: ctx.messageCount ?? 1,
          hourOfDay: ctx.hourOfDay ?? new Date().getHours(),
        },
        score: claudeScore,
        scoredBy: 'claude',
      };

      await saveScoredExchange(claudeExchange);
    }
  } catch (error) {
    console.error('[HumanScore] Background scoring failed:', error);
  }
}

// ============================================
// STATS & EXPORT
// ============================================

/**
 * Get scoring statistics
 */
export async function getScoreStats(): Promise<ScoreStats> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCORE_STATS);
    return stored ? JSON.parse(stored) : {
      totalScored: 0,
      averageScore: 0,
      commonIssues: [],
      recentTrend: 'stable',
      claudeScoreCount: 0,
      localScoreCount: 0,
    };
  } catch (error) {
    console.error('[HumanScore] Failed to get stats:', error);
    return {
      totalScored: 0,
      averageScore: 0,
      commonIssues: [],
      recentTrend: 'stable',
      claudeScoreCount: 0,
      localScoreCount: 0,
    };
  }
}

/**
 * Get all scored exchanges (for export/training)
 */
export async function getScoredExchanges(): Promise<ScoredExchange[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCORED_EXCHANGES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[HumanScore] Failed to get exchanges:', error);
    return [];
  }
}

/**
 * Export scored exchanges as JSON (for training local model)
 */
export async function exportForTraining(): Promise<string> {
  const exchanges = await getScoredExchanges();
  const stats = await getScoreStats();

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    stats,
    exchanges,
  }, null, 2);
}

/**
 * Check if we have enough data for local model training
 */
export async function canTrainLocalScorer(): Promise<{
  ready: boolean;
  claudeExamples: number;
  needed: number;
}> {
  const stats = await getScoreStats();
  const MINIMUM_FOR_TRAINING = 500;

  return {
    ready: stats.claudeScoreCount >= MINIMUM_FOR_TRAINING,
    claudeExamples: stats.claudeScoreCount,
    needed: MINIMUM_FOR_TRAINING,
  };
}
