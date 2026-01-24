/**
 * Transcript Server for Mood Leaf
 *
 * Local server that fetches YouTube transcripts using yt-dlp.
 *
 * SETUP:
 *   1. Install yt-dlp: brew install yt-dlp
 *   2. cd transcript-server
 *   3. npm install
 *   4. npm start
 *
 * The server runs on http://localhost:3333
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const app = express();
const PORT = 3333;

// Enable CORS for the app to call this server
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcript server is running (yt-dlp)',
    endpoints: {
      transcript: 'GET /transcript?v=VIDEO_ID',
      batch: 'POST /batch-transcripts { videoIds: [...] }'
    }
  });
});

/**
 * Fetch transcript using yt-dlp
 */
async function fetchTranscriptWithYtDlp(videoId) {
  const tempDir = os.tmpdir();
  const outputBase = path.join(tempDir, `transcript_${videoId}`);

  try {
    // Use yt-dlp to download subtitles
    const cmd = `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${outputBase}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;

    console.log(`[yt-dlp] Running: yt-dlp for ${videoId}`);

    const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

    // Find the subtitle file (could be .en.vtt or .en-orig.vtt etc)
    const files = await fs.readdir(tempDir);
    const subtitleFile = files.find(f => f.startsWith(`transcript_${videoId}`) && f.endsWith('.vtt'));

    if (!subtitleFile) {
      // Check if yt-dlp said no subtitles available
      if (stdout.includes('no subtitles') || stdout.includes('There are no subtitles')) {
        return { error: 'No subtitles available for this video' };
      }
      return { error: 'Could not find subtitle file' };
    }

    const subtitlePath = path.join(tempDir, subtitleFile);
    const vttContent = await fs.readFile(subtitlePath, 'utf-8');

    // Parse VTT to plain text
    const transcript = parseVTT(vttContent);

    // Clean up temp file
    await fs.unlink(subtitlePath).catch(() => {});

    return { transcript };

  } catch (error) {
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      return { error: 'yt-dlp not installed. Run: brew install yt-dlp' };
    }
    if (error.message.includes('timeout')) {
      return { error: 'Request timed out' };
    }
    console.error(`[yt-dlp] Error:`, error.message);
    return { error: error.message };
  }
}

/**
 * Parse VTT subtitle file to plain text
 */
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const textLines = [];
  let lastText = '';

  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (line.startsWith('WEBVTT') ||
        line.includes('-->') ||
        line.trim() === '' ||
        /^\d+$/.test(line.trim()) ||
        line.startsWith('Kind:') ||
        line.startsWith('Language:')) {
      continue;
    }

    // Remove VTT formatting tags
    let text = line
      .replace(/<[^>]+>/g, '')  // Remove HTML-like tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Skip duplicates (VTT often has overlapping segments)
    if (text && text !== lastText) {
      textLines.push(text);
      lastText = text;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Fetch single transcript
app.get('/transcript', async (req, res) => {
  const videoId = req.query.v || req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing video ID. Use ?v=VIDEO_ID' });
  }

  console.log(`[Transcript] Fetching transcript for: ${videoId}`);

  const result = await fetchTranscriptWithYtDlp(videoId);

  if (result.error) {
    console.log(`[Transcript] Error: ${result.error}`);
    return res.status(404).json({ error: result.error, videoId });
  }

  console.log(`[Transcript] Success: ${result.transcript.length} chars`);

  res.json({
    videoId,
    transcript: result.transcript,
    charCount: result.transcript.length
  });
});

// Batch fetch multiple transcripts
app.post('/batch-transcripts', async (req, res) => {
  const { videoIds } = req.body;

  if (!videoIds || !Array.isArray(videoIds)) {
    return res.status(400).json({ error: 'Missing videoIds array in body' });
  }

  console.log(`[Transcript] Batch fetching ${videoIds.length} videos`);

  const results = [];

  for (const videoId of videoIds) {
    const result = await fetchTranscriptWithYtDlp(videoId);

    if (result.error) {
      results.push({ videoId, success: false, error: result.error });
      console.log(`  ✗ ${videoId}: ${result.error}`);
    } else {
      results.push({
        videoId,
        success: true,
        transcript: result.transcript,
        charCount: result.transcript.length
      });
      console.log(`  ✓ ${videoId}: ${result.transcript.length} chars`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[Transcript] Batch complete: ${successCount}/${videoIds.length} succeeded`);

  res.json({
    total: videoIds.length,
    successful: successCount,
    failed: videoIds.length - successCount,
    results
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     Mood Leaf Transcript Server (yt-dlp)               ║
║     Running on http://localhost:${PORT}                  ║
╠════════════════════════════════════════════════════════╣
║  REQUIRES: yt-dlp (brew install yt-dlp)                ║
╠════════════════════════════════════════════════════════╣
║  Endpoints:                                            ║
║    GET  /transcript?v=VIDEO_ID                         ║
║    POST /batch-transcripts                             ║
╚════════════════════════════════════════════════════════╝
  `);

  // Check if yt-dlp is installed
  exec('yt-dlp --version', (error, stdout) => {
    if (error) {
      console.log('⚠️  WARNING: yt-dlp not found!');
      console.log('   Install with: brew install yt-dlp');
      console.log('');
    } else {
      console.log(`✓ yt-dlp version: ${stdout.trim()}`);
      console.log('');
    }
  });
});
