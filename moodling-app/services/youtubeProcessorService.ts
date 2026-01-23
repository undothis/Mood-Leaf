/**
 * YouTube Interview Processor Service
 *
 * Fetches videos from YouTube channels, extracts transcripts,
 * and uses Claude to extract human insights for training.
 *
 * Features:
 * - Fetch video list from a channel (no API key needed)
 * - Extract transcripts from auto-captions
 * - AI-powered insight extraction focusing on human emotions
 * - Batch processing with progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PROCESSING_QUEUE: 'moodleaf_youtube_queue',
  PROCESSED_VIDEOS: 'moodleaf_processed_videos',
  PENDING_INSIGHTS: 'moodleaf_youtube_pending_insights',
};

// ============================================
// TYPES
// ============================================

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  duration?: string;
}

export interface ProcessingJob {
  id: string;
  channelUrl: string;
  channelName: string;
  videosToProcess: number;
  videosProcessed: number;
  insightsFound: number;
  status: 'fetching' | 'processing' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  error?: string;
  selectedCategories: InsightExtractionCategory[];
  videos: YouTubeVideo[];
  currentVideoIndex: number;
}

export type InsightExtractionCategory =
  | 'humor_wit'
  | 'emotional_patterns'
  | 'coping_strategies'
  | 'what_helps_hurts'
  | 'real_quotes'
  | 'vulnerability'
  | 'relationship_dynamics'
  | 'self_discovery'
  | 'growth_moments'
  | 'struggle_stories';

export interface ExtractedInsight {
  id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  timestamp?: string;

  // The insight
  category: string; // Maps to training data categories
  extractionCategory: InsightExtractionCategory;
  title: string;
  insight: string;
  quotes: string[];
  coachingImplication: string;
  antiPatterns?: string[];

  // Human elements
  emotionalTone: string;
  humorLevel: 'none' | 'light' | 'moderate' | 'high';
  vulnerabilityLevel: 'surface' | 'moderate' | 'deep';

  // Status
  status: 'pending' | 'approved' | 'rejected';
  confidence: number; // 0-1, how confident AI is in this insight
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// ============================================
// EXTRACTION CATEGORIES (what to look for)
// ============================================

export const EXTRACTION_CATEGORIES: {
  value: InsightExtractionCategory;
  label: string;
  description: string;
  promptHint: string;
}[] = [
  {
    value: 'humor_wit',
    label: 'Humor & Wit',
    description: 'Funny moments, sarcasm, self-deprecating humor, comedic relief',
    promptHint: 'Look for jokes, funny observations, sarcastic remarks, comedic timing, and how humor is used to cope or connect.',
  },
  {
    value: 'emotional_patterns',
    label: 'Emotional Patterns',
    description: 'How people experience and express emotions',
    promptHint: 'Notice emotional shifts, how emotions are described, unexpected emotional responses, and emotional processing styles.',
  },
  {
    value: 'coping_strategies',
    label: 'Coping Strategies',
    description: 'Real ways people deal with challenges',
    promptHint: 'Identify actual coping mechanisms mentioned - both healthy and unhealthy, what works and what doesn\'t.',
  },
  {
    value: 'what_helps_hurts',
    label: 'What Helps vs. Hurts',
    description: 'Specific things that made it better or worse',
    promptHint: 'Find concrete examples of what helped someone feel better or what made things worse. Look for "what I wish people knew" moments.',
  },
  {
    value: 'real_quotes',
    label: 'Real Human Quotes',
    description: 'Memorable, authentic expressions',
    promptHint: 'Capture phrases that feel genuinely human - messy, contradictory, raw, or beautifully expressed.',
  },
  {
    value: 'vulnerability',
    label: 'Vulnerability Moments',
    description: 'Raw, honest admissions',
    promptHint: 'Find moments of genuine vulnerability - admitting fears, failures, insecurities, or uncomfortable truths.',
  },
  {
    value: 'relationship_dynamics',
    label: 'Relationship Dynamics',
    description: 'How connections affect wellbeing',
    promptHint: 'Notice how relationships (family, friends, romantic, professional) impact the person\'s mental state and growth.',
  },
  {
    value: 'self_discovery',
    label: 'Self-Discovery',
    description: 'Realizations about oneself',
    promptHint: 'Find "aha moments" where someone realizes something about themselves, their patterns, or their needs.',
  },
  {
    value: 'growth_moments',
    label: 'Growth Moments',
    description: 'Evidence of change and progress',
    promptHint: 'Identify moments of growth, change, or progress - even small ones. How did they get there?',
  },
  {
    value: 'struggle_stories',
    label: 'Struggle Stories',
    description: 'The messy middle of dealing with things',
    promptHint: 'Capture the in-between moments - not just the problem or solution, but the messy process of working through it.',
  },
];

// ============================================
// YOUTUBE HELPERS
// ============================================

/**
 * Extract channel ID from various YouTube URL formats
 */
export function extractChannelInfo(url: string): { type: 'channel' | 'user' | 'handle' | 'unknown'; id: string } | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle format: youtube.com/channel/UC...
    if (pathname.includes('/channel/')) {
      const match = pathname.match(/\/channel\/([^\/\?]+)/);
      if (match) return { type: 'channel', id: match[1] };
    }

    // Handle format: youtube.com/@username
    if (pathname.includes('/@')) {
      const match = pathname.match(/\/@([^\/\?]+)/);
      if (match) return { type: 'handle', id: match[1] };
    }

    // Handle format: youtube.com/user/username
    if (pathname.includes('/user/')) {
      const match = pathname.match(/\/user\/([^\/\?]+)/);
      if (match) return { type: 'user', id: match[1] };
    }

    // Handle format: youtube.com/c/channelname
    if (pathname.includes('/c/')) {
      const match = pathname.match(/\/c\/([^\/\?]+)/);
      if (match) return { type: 'handle', id: match[1] };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch video list from a YouTube channel using RSS feed
 * Note: RSS feed returns ~15 most recent videos
 * For more videos, we'll need to use alternative methods
 */
export async function fetchChannelVideos(
  channelUrl: string,
  maxVideos: number = 20
): Promise<{ videos: YouTubeVideo[]; channelName: string; error?: string }> {
  const channelInfo = extractChannelInfo(channelUrl);

  if (!channelInfo) {
    return { videos: [], channelName: '', error: 'Invalid YouTube channel URL' };
  }

  try {
    // For handles/usernames, we need to resolve to channel ID first
    // This is a simplified approach - in production you'd want more robust resolution
    let feedUrl: string;

    if (channelInfo.type === 'channel') {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelInfo.id}`;
    } else {
      // For handles, try to fetch the channel page and extract channel ID
      // For now, return an instruction to use channel ID
      return {
        videos: [],
        channelName: channelInfo.id,
        error: `For best results, please use the channel ID format. Go to the channel, click "About", then "Share Channel" to get the channel ID URL (youtube.com/channel/UC...).`,
      };
    }

    // Fetch RSS feed
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel feed: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse XML (simple regex parsing for React Native compatibility)
    const videos: YouTubeVideo[] = [];
    const channelNameMatch = xmlText.match(/<name>([^<]+)<\/name>/);
    const channelName = channelNameMatch ? channelNameMatch[1] : 'Unknown Channel';

    // Extract video entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xmlText)) !== null && videos.length < maxVideos * 2) {
      const entry = match[1];

      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

      if (videoIdMatch && titleMatch) {
        videos.push({
          videoId: videoIdMatch[1],
          title: decodeXMLEntities(titleMatch[1]),
          channelName,
          channelId: channelInfo.id,
          publishedAt: publishedMatch ? publishedMatch[1] : undefined,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoIdMatch[1]}/mqdefault.jpg`,
        });
      }
    }

    // Randomly select if we have more than needed
    const selectedVideos = selectRandomVideos(videos, maxVideos);

    return { videos: selectedVideos, channelName };
  } catch (error) {
    return {
      videos: [],
      channelName: '',
      error: error instanceof Error ? error.message : 'Failed to fetch channel videos',
    };
  }
}

/**
 * Randomly select videos from a list
 */
function selectRandomVideos(videos: YouTubeVideo[], count: number): YouTubeVideo[] {
  if (videos.length <= count) return videos;

  const shuffled = [...videos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Decode XML entities
 */
function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Fetch transcript for a YouTube video
 * Uses a public transcript extraction approach
 */
export async function fetchVideoTranscript(
  videoId: string
): Promise<{ transcript: string; segments: TranscriptSegment[]; error?: string }> {
  try {
    // Fetch the video page to get transcript data
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();

    // Look for captions in the page data
    // YouTube embeds caption track URLs in the page
    const captionMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])/);

    if (!captionMatch) {
      // Try alternative: look for timedtext URL
      const timedTextMatch = html.match(/timedtext[^"]*lang=en[^"]*/);
      if (!timedTextMatch) {
        return {
          transcript: '',
          segments: [],
          error: 'No captions available for this video',
        };
      }
    }

    // Parse caption tracks
    let captionTracks: any[] = [];
    try {
      if (captionMatch) {
        // Clean up the JSON string
        let jsonStr = captionMatch[1];
        // Handle escaped quotes and other issues
        captionTracks = JSON.parse(jsonStr);
      }
    } catch (e) {
      // Try regex extraction as fallback
      const urlMatch = html.match(/"baseUrl":\s*"([^"]+)"/);
      if (urlMatch) {
        const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
        return await fetchTranscriptFromUrl(captionUrl);
      }

      return {
        transcript: '',
        segments: [],
        error: 'Could not parse caption data',
      };
    }

    // Find English captions (prefer manual over auto-generated)
    let captionUrl: string | null = null;

    // First try to find English manual captions
    for (const track of captionTracks) {
      if (track.languageCode === 'en' && !track.kind) {
        captionUrl = track.baseUrl;
        break;
      }
    }

    // Fall back to auto-generated English
    if (!captionUrl) {
      for (const track of captionTracks) {
        if (track.languageCode === 'en' || track.vssId?.includes('.en')) {
          captionUrl = track.baseUrl;
          break;
        }
      }
    }

    // Fall back to any available captions
    if (!captionUrl && captionTracks.length > 0) {
      captionUrl = captionTracks[0].baseUrl;
    }

    if (!captionUrl) {
      return {
        transcript: '',
        segments: [],
        error: 'No suitable captions found',
      };
    }

    return await fetchTranscriptFromUrl(captionUrl);
  } catch (error) {
    return {
      transcript: '',
      segments: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transcript',
    };
  }
}

/**
 * Fetch and parse transcript from a caption URL
 */
async function fetchTranscriptFromUrl(
  captionUrl: string
): Promise<{ transcript: string; segments: TranscriptSegment[]; error?: string }> {
  try {
    // Add format parameter for XML
    const url = captionUrl.includes('fmt=') ? captionUrl : `${captionUrl}&fmt=srv3`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }

    const xmlText = await response.text();
    const segments: TranscriptSegment[] = [];

    // Parse transcript segments
    const segmentRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = segmentRegex.exec(xmlText)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      const text = decodeXMLEntities(match[3])
        .replace(/\n/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (text) {
        segments.push({ text, start, duration });
      }
    }

    // Combine segments into full transcript
    const transcript = segments.map(s => s.text).join(' ');

    return { transcript, segments };
  } catch (error) {
    return {
      transcript: '',
      segments: [],
      error: error instanceof Error ? error.message : 'Failed to parse transcript',
    };
  }
}

// ============================================
// INSIGHT EXTRACTION (Claude AI)
// ============================================

/**
 * Build the prompt for Claude to extract insights
 */
export function buildExtractionPrompt(
  transcript: string,
  videoTitle: string,
  channelName: string,
  categories: InsightExtractionCategory[]
): string {
  const categoryInstructions = categories
    .map(cat => {
      const catInfo = EXTRACTION_CATEGORIES.find(c => c.value === cat);
      return catInfo ? `- **${catInfo.label}**: ${catInfo.promptHint}` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `You are analyzing an interview/conversation transcript to extract insights about human nature, emotions, and behavior. These insights will be used to train an AI mental health coach to be more human and empathetic.

VIDEO: "${videoTitle}"
CHANNEL: "${channelName}"

TRANSCRIPT:
${transcript.slice(0, 15000)} ${transcript.length > 15000 ? '...[truncated]' : ''}

---

EXTRACTION CATEGORIES TO FOCUS ON:
${categoryInstructions}

---

INSTRUCTIONS:

Extract 3-7 meaningful insights from this transcript. For each insight:

1. **Be specific, not generic** - "People with anxiety often mask it with humor" is better than "Anxiety is common"
2. **Capture the human messiness** - Include contradictions, uncertainty, and complexity
3. **Find the gold in humor** - Jokes often reveal deep truths. Don't dismiss humor.
4. **Get real quotes** - Exact words matter. They're more human than paraphrases.
5. **Think like a coach** - How would knowing this help an AI coach respond better?

For each insight, provide:
- **title**: Short, memorable summary (under 10 words)
- **insight**: The actual learning (2-4 sentences)
- **quotes**: 1-3 direct quotes from the transcript that support this
- **coachingImplication**: How should a coach behave differently knowing this?
- **antiPatterns**: What should a coach NEVER do based on this?
- **emotionalTone**: The feeling of this insight (e.g., "bittersweet hope", "frustrated acceptance")
- **humorLevel**: none, light, moderate, or high
- **vulnerabilityLevel**: surface, moderate, or deep
- **category**: Map to one of: cognitive_patterns, emotional_processing, communication_needs, motivation_patterns, relationship_with_self, crisis_patterns, recovery_patterns, daily_rhythms, social_dynamics

Respond in this exact JSON format:
{
  "insights": [
    {
      "title": "...",
      "insight": "...",
      "quotes": ["...", "..."],
      "coachingImplication": "...",
      "antiPatterns": ["...", "..."],
      "emotionalTone": "...",
      "humorLevel": "light",
      "vulnerabilityLevel": "moderate",
      "category": "emotional_processing",
      "confidence": 0.85
    }
  ],
  "videoSummary": "One sentence summary of what this video is about",
  "overallTone": "The emotional tone of the conversation"
}

Be genuine. Be specific. Be human.`;
}

/**
 * Extract insights from a transcript using Claude
 */
export async function extractInsightsWithClaude(
  transcript: string,
  videoTitle: string,
  videoId: string,
  channelName: string,
  categories: InsightExtractionCategory[],
  apiKey: string
): Promise<{ insights: ExtractedInsight[]; error?: string }> {
  if (!transcript || transcript.length < 100) {
    return { insights: [], error: 'Transcript too short to analyze' };
  }

  const prompt = buildExtractionPrompt(transcript, videoTitle, channelName, categories);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in response');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error('Invalid response format');
    }

    // Transform to our format
    const insights: ExtractedInsight[] = parsed.insights.map((ins: any, index: number) => ({
      id: `insight_${videoId}_${Date.now()}_${index}`,
      videoId,
      videoTitle,
      channelName,
      category: ins.category || 'emotional_processing',
      extractionCategory: categories[0], // Primary category
      title: ins.title || 'Untitled insight',
      insight: ins.insight || '',
      quotes: ins.quotes || [],
      coachingImplication: ins.coachingImplication || '',
      antiPatterns: ins.antiPatterns || [],
      emotionalTone: ins.emotionalTone || 'neutral',
      humorLevel: ins.humorLevel || 'none',
      vulnerabilityLevel: ins.vulnerabilityLevel || 'surface',
      status: 'pending' as const,
      confidence: ins.confidence || 0.7,
    }));

    return { insights };
  } catch (error) {
    return {
      insights: [],
      error: error instanceof Error ? error.message : 'Failed to extract insights',
    };
  }
}

// ============================================
// PROCESSING JOB MANAGEMENT
// ============================================

/**
 * Create a new processing job
 */
export async function createProcessingJob(
  channelUrl: string,
  channelName: string,
  videos: YouTubeVideo[],
  categories: InsightExtractionCategory[]
): Promise<ProcessingJob> {
  const job: ProcessingJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    channelUrl,
    channelName,
    videosToProcess: videos.length,
    videosProcessed: 0,
    insightsFound: 0,
    status: 'processing',
    startedAt: new Date().toISOString(),
    selectedCategories: categories,
    videos,
    currentVideoIndex: 0,
  };

  // Save job
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  const jobs: ProcessingJob[] = stored ? JSON.parse(stored) : [];
  jobs.push(job);
  await AsyncStorage.setItem(STORAGE_KEYS.PROCESSING_QUEUE, JSON.stringify(jobs));

  return job;
}

/**
 * Update a processing job
 */
export async function updateProcessingJob(
  jobId: string,
  updates: Partial<ProcessingJob>
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  const jobs: ProcessingJob[] = stored ? JSON.parse(stored) : [];

  const index = jobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PROCESSING_QUEUE, JSON.stringify(jobs));
  }
}

/**
 * Get all processing jobs
 */
export async function getProcessingJobs(): Promise<ProcessingJob[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save pending insights from YouTube processing
 */
export async function savePendingInsights(insights: ExtractedInsight[]): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const existing: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const updated = [...existing, ...insights];
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(updated));
}

/**
 * Get all pending insights from YouTube processing
 */
export async function getPendingInsights(): Promise<ExtractedInsight[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Update a pending insight's status
 */
export async function updatePendingInsight(
  insightId: string,
  updates: Partial<ExtractedInsight>
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const insights: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const index = insights.findIndex(i => i.id === insightId);
  if (index !== -1) {
    insights[index] = { ...insights[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(insights));
  }
}

/**
 * Remove a pending insight
 */
export async function removePendingInsight(insightId: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const insights: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const filtered = insights.filter(i => i.id !== insightId);
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(filtered));
}

/**
 * Clear all pending insights
 */
export async function clearPendingInsights(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify([]));
}

/**
 * Mark video as processed
 */
export async function markVideoProcessed(videoId: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_VIDEOS);
  const processed: string[] = stored ? JSON.parse(stored) : [];

  if (!processed.includes(videoId)) {
    processed.push(videoId);
    await AsyncStorage.setItem(STORAGE_KEYS.PROCESSED_VIDEOS, JSON.stringify(processed));
  }
}

/**
 * Check if video was already processed
 */
export async function isVideoProcessed(videoId: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_VIDEOS);
  const processed: string[] = stored ? JSON.parse(stored) : [];
  return processed.includes(videoId);
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Channel/Video fetching
  extractChannelInfo,
  fetchChannelVideos,
  fetchVideoTranscript,

  // Insight extraction
  buildExtractionPrompt,
  extractInsightsWithClaude,

  // Job management
  createProcessingJob,
  updateProcessingJob,
  getProcessingJobs,

  // Pending insights
  savePendingInsights,
  getPendingInsights,
  updatePendingInsight,
  removePendingInsight,
  clearPendingInsights,

  // Video tracking
  markVideoProcessed,
  isVideoProcessed,

  // Constants
  EXTRACTION_CATEGORIES,
};
