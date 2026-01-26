# Training Studio - Complete Setup Guide

This guide walks you through setting up Training Studio from scratch, including all optional Full Mode dependencies.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TRAINING STUDIO                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────────────────────────┐  │
│  │                      │         │                                          │  │
│  │   FRONTEND           │  HTTP   │              BACKEND                     │  │
│  │   (Next.js)          │◄───────►│              (FastAPI)                   │  │
│  │   Port 3000          │  REST   │              Port 8000                   │  │
│  │                      │   API   │                                          │  │
│  │  ┌────────────────┐  │         │  ┌─────────────────────────────────────┐ │  │
│  │  │ Dashboard      │  │         │  │           SERVICES                  │ │  │
│  │  │ Channels       │  │         │  │  ┌─────────────────────────────┐   │ │  │
│  │  │ Process        │  │         │  │  │ youtube.py     (yt-dlp)    │   │ │  │
│  │  │ Review         │  │         │  │  │ transcription.py (Whisper) │   │ │  │
│  │  │ Stats          │  │         │  │  │ diarization.py (pyannote)  │   │ │  │
│  │  │ Tuning         │  │         │  │  │ prosody.py     (librosa)   │   │ │  │
│  │  │ Export         │  │         │  │  │ facial.py      (py-feat)   │   │ │  │
│  │  │ Verification   │  │         │  │  │ insights.py    (Claude)    │   │ │  │
│  │  └────────────────┘  │         │  │  └─────────────────────────────┘   │ │  │
│  │                      │         │  │                                     │ │  │
│  └──────────────────────┘         │  │  ┌─────────────────────────────┐   │ │  │
│                                   │  │  │ database.py    (SQLite)    │   │ │  │
│                                   │  │  └─────────────────────────────┘   │ │  │
│                                   │  └─────────────────────────────────────┘ │  │
│                                   └──────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DEPENDENCIES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │    YouTube     │  │   Claude API   │  │  HuggingFace   │  │  Local Files   │ │
│  │   (yt-dlp)     │  │  (Anthropic)   │  │  (pyannote)    │  │  (SQLite DB)   │ │
│  │                │  │                │  │                │  │                │ │
│  │  • Videos      │  │  • Classify    │  │  • Speaker     │  │  • Channels    │ │
│  │  • Audio       │  │    interviews  │  │    models      │  │  • Videos      │ │
│  │  • Transcripts │  │  • Extract     │  │  • Diarization │  │  • Insights    │ │
│  │  • Metadata    │  │    insights    │  │    pipeline    │  │  • Jobs        │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: What Mode Do You Need?

| Mode | What It Does | Dependencies |
|------|--------------|--------------|
| **Simple Mode** | Uses YouTube's transcripts + Claude AI | yt-dlp, Claude API key |
| **Full Mode** | Local transcription, speaker ID, emotion analysis | All dependencies below |

**Recommendation**: Start with Simple Mode. It's faster and works great for most use cases.

---

## System Requirements

- **macOS** 11+ (Big Sur or later) or **Linux**
- **Python** 3.10+ (3.11 recommended)
- **Node.js** 18+
- **8GB RAM** minimum (16GB recommended for Full Mode)
- **10GB disk space** (for Whisper models and dependencies)

---

## Step 1: Install Homebrew (macOS)

If you don't have Homebrew installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Step 2: Install System Dependencies

### macOS (Homebrew)

```bash
# Core requirements
brew install python@3.11
brew install node
brew install yt-dlp
brew install ffmpeg

# Optional: For audio analysis (librosa)
brew install portaudio
brew install libsndfile

# Verify installations
python3.11 --version   # Should show Python 3.11.x
node --version         # Should show v18.x or higher
yt-dlp --version       # Should show version number
ffmpeg -version        # Should show ffmpeg version
```

### Linux (Ubuntu/Debian)

```bash
# Core requirements
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
sudo apt install nodejs npm
sudo apt install ffmpeg

# Install yt-dlp
sudo pip3 install yt-dlp

# Optional: For audio analysis
sudo apt install portaudio19-dev libsndfile1-dev
```

---

## Step 3: Backend Setup

```bash
# Navigate to backend
cd training-studio/backend

# Create virtual environment with Python 3.11
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate      # bash/zsh
# OR
source venv/bin/activate.csh  # tcsh/csh

# Upgrade pip
pip install --upgrade pip

# Install base dependencies
pip install -r requirements.txt
```

---

## Step 4: Configure API Keys

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Required: For insight extraction
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: For speaker diarization
HUGGINGFACE_TOKEN=hf_...

# Optional: Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL=base
```

### Getting API Keys

**Anthropic API Key** (Required):
1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key

**HuggingFace Token** (Optional - for speaker diarization):
1. Create account at https://huggingface.co
2. Go to https://huggingface.co/pyannote/speaker-diarization-3.1
3. Accept the terms to access the model
4. Go to https://huggingface.co/settings/tokens
5. Create a new token with "read" permissions

---

## Step 5: Install Full Mode Dependencies (Optional)

If you want to use Full Mode features (local transcription, facial analysis, etc.), install these additional packages:

### 5a. Whisper (Local Transcription)

```bash
# Make sure venv is activated
pip install openai-whisper

# Test installation
python -c "import whisper; print('Whisper installed!')"
```

**Note**: The first time you use Whisper, it will download the model (tiny=39MB, base=74MB, small=244MB, medium=769MB, large=1.5GB).

### 5b. Librosa (Audio/Prosody Analysis)

```bash
pip install librosa

# Test installation
python -c "import librosa; print('librosa installed!')"
```

### 5c. Praat/Parselmouth (Voice Quality Analysis)

```bash
pip install praat-parselmouth

# Test installation
python -c "import parselmouth; print('parselmouth installed!')"
```

### 5d. Speaker Diarization (pyannote)

Requires HuggingFace token (see Step 4).

```bash
pip install pyannote.audio

# Test installation
python -c "import pyannote.audio; print('pyannote installed!')"
```

#### What is Speaker Diarization?

**Speaker diarization** answers the question: "Who spoke when?"

In an interview video with two people (interviewer + guest), diarization identifies:
- When SPEAKER_00 (interviewer) is talking
- When SPEAKER_01 (guest/coach) is talking
- The exact timestamps for each speaker turn

```
Without Diarization:
┌─────────────────────────────────────────────────────────────┐
│ "So tell me about your approach to helping people          │
│ deal with grief. Well I think the most important thing     │
│ is to first acknowledge their pain without trying to       │
│ fix it immediately..."                                     │
└─────────────────────────────────────────────────────────────┘
(All text lumped together - who said what?)

With Diarization:
┌─────────────────────────────────────────────────────────────┐
│ INTERVIEWER: "So tell me about your approach to helping    │
│              people deal with grief."                      │
│                                                            │
│ COACH: "Well I think the most important thing is to first  │
│        acknowledge their pain without trying to fix it     │
│        immediately..."                                     │
└─────────────────────────────────────────────────────────────┘
(Clear speaker attribution)
```

#### Why is Diarization Useful for AI Training?

1. **Better Training Data Quality**
   - Separates interviewer questions from coach responses
   - Creates cleaner question→answer pairs for training
   - Helps identify who is giving the coaching advice

2. **Conversation Flow Understanding**
   - AI learns natural turn-taking patterns
   - Understands when to ask vs. when to respond
   - Models realistic therapeutic conversation dynamics

3. **Speaker Statistics**
   - Know how much each person talked (coach usually 60-70%)
   - Identify interview style (lots of questions vs. long monologues)
   - Filter out videos where the "expert" barely speaks

4. **Interviewer Identification**
   - Automatically identifies who is the interviewer (usually speaks 30-40%)
   - Helps attribute coaching insights to the right person
   - Filters out interviewer opinions from training data

#### Why is Diarization Optional?

**Simple Mode works great without it** because:
- YouTube's auto-generated transcripts often include speaker markers
- Claude can infer speaker changes from context and phrasing
- For single-speaker videos (lectures, TED talks), diarization is unnecessary

**Diarization adds complexity:**
- Requires HuggingFace account and token
- Requires accepting pyannote model terms
- Downloads large ML models (~1GB)
- Processing takes longer (adds 2-5 min per video)
- Can make errors with similar voices or overlapping speech

**When you SHOULD use diarization:**
- Processing podcast/interview content with 2+ speakers
- Need precise speaker attribution for training
- Building conversation-style training data
- Want speaker statistics (who talked more)

**When you can SKIP diarization:**
- Processing lectures, TED talks, or single-speaker content
- Using Simple Mode (YouTube transcripts + Claude)
- Just getting started and want faster processing
- Don't need precise speaker separation

### 5e. Facial Analysis (py-feat)

```bash
pip install py-feat

# Test installation
python -c "import feat; print('py-feat installed!')"
```

### 5f. MediaPipe (Backup Facial Analysis)

```bash
pip install mediapipe
pip install opencv-python

# Test installation
python -c "import mediapipe; print('MediaPipe installed!')"
```

### Install All Full Mode Dependencies At Once

```bash
# One command to install everything
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python
```

---

## Step 6: Frontend Setup

```bash
# Navigate to frontend
cd training-studio/frontend

# Install dependencies
npm install

# Return to training-studio root
cd ..
```

---

## Step 7: Start Training Studio

### Option A: One-Button Start (Recommended)

```bash
cd training-studio
./start.sh
```

### Option B: Manual Start

Terminal 1 (Backend):
```bash
cd training-studio/backend
source venv/bin/activate
python main.py
```

Terminal 2 (Frontend):
```bash
cd training-studio/frontend
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Troubleshooting

### Error: "Whisper not installed"

```bash
cd training-studio/backend
source venv/bin/activate
pip install openai-whisper
```

### Error: "librosa not installed"

```bash
# macOS: Install system dependency first
brew install libsndfile

# Then install Python package
pip install librosa
```

### Error: "parselmouth not installed"

```bash
pip install praat-parselmouth
```

### Error: "py-feat not installed"

```bash
pip install py-feat
```

### Error: "MediaPipe not installed"

```bash
pip install mediapipe opencv-python
```

### Error: "No HuggingFace token"

This is a warning, not an error. Speaker diarization is optional. If you want it:

1. Get a token from https://huggingface.co/settings/tokens
2. Accept terms at https://huggingface.co/pyannote/speaker-diarization-3.1
3. Add to `.env`: `HUGGINGFACE_TOKEN=hf_...`

### Error: Torch/PyTorch installation issues

If you get errors related to torch:

```bash
# Uninstall and reinstall
pip uninstall torch torchaudio torchvision
pip install torch torchaudio
```

### Error: "Permission denied" on start.sh

```bash
chmod +x start.sh
```

### Frontend: "Module not found" errors

```bash
cd training-studio/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Verifying Your Installation

Run the backend and check the Dashboard diagnostics:

1. Start Training Studio (`./start.sh`)
2. Open http://localhost:3000
3. Look at the "System Diagnostics" panel
4. Green checkmarks = working
5. Yellow warnings = optional features disabled
6. Red errors = needs attention

### Expected Results

**Simple Mode (minimum):**
- YouTube Downloader: OK
- Claude API: Configured

**Full Mode (all features):**
- YouTube Downloader: OK
- Audio Processing (ffmpeg): OK
- Whisper Transcription: OK
- Speaker Diarization: OK
- Prosody (librosa): OK
- Voice Quality (Praat): OK
- Facial Analysis: OK
- MediaPipe: OK
- Claude API: Configured

---

## Updating Dependencies

To update all Python dependencies:

```bash
cd training-studio/backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

To update Homebrew packages:

```bash
brew update
brew upgrade yt-dlp ffmpeg
```

---

## Uninstalling

To completely remove Training Studio dependencies:

```bash
# Remove virtual environment
cd training-studio/backend
rm -rf venv

# Remove node modules
cd ../frontend
rm -rf node_modules

# Optionally remove Homebrew packages
brew uninstall yt-dlp ffmpeg portaudio libsndfile
```

---

---

## Processing Flow Diagrams

### Simple Mode Flow (Recommended for Getting Started)

Simple Mode uses YouTube's auto-generated transcripts and Claude for insight extraction.
No local ML models required - fast and reliable.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SIMPLE MODE PROCESSING FLOW                            │
└─────────────────────────────────────────────────────────────────────────────────┘

     USER                    FRONTEND                   BACKEND                 EXTERNAL
       │                        │                          │                       │
       │  1. Paste YouTube URL  │                          │                       │
       │───────────────────────►│                          │                       │
       │                        │  2. POST /process/simple │                       │
       │                        │─────────────────────────►│                       │
       │                        │                          │                       │
       │                        │                          │  3. Get video info    │
       │                        │                          │──────────────────────►│ YouTube
       │                        │                          │◄──────────────────────│
       │                        │                          │                       │
       │                        │                          │  4. Fetch transcript  │
       │                        │                          │──────────────────────►│ YouTube
       │                        │                          │◄──────────────────────│
       │                        │                          │                       │
       │                        │                          │  5. Extract insights  │
       │                        │                          │──────────────────────►│ Claude API
       │                        │                          │◄──────────────────────│
       │                        │                          │                       │
       │                        │                          │  6. Save to SQLite    │
       │                        │                          │───────┐               │
       │                        │                          │◄──────┘               │
       │                        │                          │                       │
       │                        │  7. Return insights      │                       │
       │                        │◄─────────────────────────│                       │
       │  8. Display results    │                          │                       │
       │◄───────────────────────│                          │                       │
       │                        │                          │                       │


SIMPLE MODE - WHAT EACH COMPONENT DOES:

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    yt-dlp       │     │    YouTube      │     │   Claude API    │
│                 │     │   Transcript    │     │                 │
│ • Get video     │────►│                 │────►│ • Classify      │
│   metadata      │     │ • Auto-captions │     │   interview     │
│ • Validate URL  │     │ • Timestamps    │     │ • Extract       │
│                 │     │                 │     │   insights      │
└─────────────────┘     └─────────────────┘     │ • Score quality │
                                                └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │    SQLite DB    │
                                                │                 │
                                                │ • Store insights│
                                                │ • Track videos  │
                                                │ • Export data   │
                                                └─────────────────┘
```

### Full Mode Flow (Advanced - All Features)

Full Mode downloads media locally and runs ML models for deeper analysis.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FULL MODE PROCESSING FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌────────────────────┐
                              │   YouTube Video    │
                              │   (User Input)     │
                              └─────────┬──────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: DOWNLOAD (youtube.py + yt-dlp)                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ • Download video file (mp4) ──► For facial analysis                       │  │
│  │ • Download audio file (wav) ──► For transcription + prosody               │  │
│  │ • Fetch metadata (title, channel, duration)                               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│  STEP 2: TRANSCRIBE                   │ │  STEP 5: FACIAL ANALYSIS              │
│  (transcription.py + Whisper)         │ │  (facial.py + py-feat/MediaPipe)      │
│  ┌─────────────────────────────────┐  │ │  ┌─────────────────────────────────┐  │
│  │ • Convert speech to text        │  │ │  │ • Detect faces in frames        │  │
│  │ • Word-level timestamps         │  │ │  │ • Recognize emotions            │  │
│  │ • Multiple languages            │  │ │  │ • Track facial action units     │  │
│  └─────────────────────────────────┘  │ │  │ • Detect incongruence           │  │
└───────────────────────────────────────┘ │  └─────────────────────────────────┘  │
                        │                 └───────────────────────────────────────┘
                        ▼                               │
┌───────────────────────────────────────┐               │
│  STEP 3: SPEAKER DIARIZATION          │               │
│  (diarization.py + pyannote)          │               │
│  ┌─────────────────────────────────┐  │               │
│  │ • Identify who spoke when       │  │               │
│  │ • Separate interviewer/guest    │  │               │
│  │ • Calculate speaking statistics │  │               │
│  └─────────────────────────────────┘  │               │
└───────────────────────────────────────┘               │
                        │                               │
                        ▼                               │
┌───────────────────────────────────────┐               │
│  STEP 4: PROSODY ANALYSIS             │               │
│  (prosody.py + librosa/parselmouth)   │               │
│  ┌─────────────────────────────────┐  │               │
│  │ • Extract pitch patterns        │  │               │
│  │ • Analyze speech rhythm         │  │               │
│  │ • Detect pauses and hesitations │  │               │
│  │ • Voice quality metrics         │  │               │
│  │ • Detect distress markers       │  │               │
│  │ • Calculate aliveness scores    │  │               │
│  └─────────────────────────────────┘  │               │
└───────────────────────────────────────┘               │
                        │                               │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: INTERVIEW CLASSIFICATION (insights.py + Claude API)                    │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ • Identify interview type (therapy, coaching, grief, etc.)                │  │
│  │ • Detect therapeutic approaches used (CBT, DBT, MI, etc.)                 │  │
│  │ • Assess content suitability for training                                 │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: INSIGHT EXTRACTION (insights.py + Claude API)                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ INPUTS:                           OUTPUTS:                                │  │
│  │ • Transcript + timestamps         • Extracted insights (10-30 per video)  │  │
│  │ • Speaker diarization             • Quality scores (0-100)                │  │
│  │ • Prosody analysis                • Safety scores                         │  │
│  │ • Facial emotions                 • Coaching implications                 │  │
│  │ • Video metadata                  • Categories (grief, anxiety, etc.)     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 8: SAVE TO DATABASE (database.py + SQLite)                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ • Store all extracted insights                                            │  │
│  │ • Track processing jobs                                                   │  │
│  │ • Link insights to source videos/channels                                 │  │
│  │ • Enable review, tuning, and export                                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Export Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA EXPORT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   REVIEW PAGE   │     │   TUNING PAGE   │     │  EXPORT PAGE    │
│                 │     │                 │     │                 │
│ • Approve/reject│────►│ • Adjust weights│────►│ • Select format │
│   insights      │     │ • Exclude       │     │ • Download file │
│ • Quality filter│     │   channels      │     │                 │
│                 │     │ • Check balance │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                              ┌─────────────────────────────────────────┐
                              │           EXPORT FORMATS                 │
                              ├─────────────────────────────────────────┤
                              │                                         │
                              │  ChatML (Llama 3+, OpenAI)              │
                              │  ┌───────────────────────────────────┐  │
                              │  │ {"messages": [                    │  │
                              │  │   {"role": "system", "content":..}│  │
                              │  │   {"role": "user", "content":...} │  │
                              │  │   {"role": "assistant",...}       │  │
                              │  │ ]}                                │  │
                              │  └───────────────────────────────────┘  │
                              │                                         │
                              │  ShareGPT (Unsloth)                     │
                              │  ┌───────────────────────────────────┐  │
                              │  │ {"conversations": [               │  │
                              │  │   {"from": "human", "value":...}  │  │
                              │  │   {"from": "gpt", "value":...}    │  │
                              │  │ ]}                                │  │
                              │  └───────────────────────────────────┘  │
                              │                                         │
                              │  Alpaca, JSONL, Raw...                  │
                              └─────────────────────────────────────────┘
                                                         │
                                                         ▼
                              ┌─────────────────────────────────────────┐
                              │           FINE-TUNING                   │
                              │                                         │
                              │  Export ──► Unsloth/LoRA ──► Your Model │
                              │                                         │
                              └─────────────────────────────────────────┘
```

### Component Interaction Matrix

| Component | Depends On | Provides To | Required? |
|-----------|-----------|-------------|-----------|
| **yt-dlp** | - | youtube.py | Yes |
| **ffmpeg** | - | transcription, prosody | Full Mode |
| **Whisper** | ffmpeg | transcription.py | Full Mode |
| **pyannote** | HuggingFace token | diarization.py | Optional |
| **librosa** | ffmpeg, portaudio | prosody.py | Optional |
| **parselmouth** | - | prosody.py (voice quality) | Optional |
| **py-feat** | - | facial.py | Optional |
| **MediaPipe** | opencv | facial.py (backup) | Optional |
| **Claude API** | API key | insights.py | Yes |
| **SQLite** | - | database.py | Yes (auto) |

---

---

## Common Issues & Solutions

### "pip: Command not found" or "source: No such file"

**Problem**: You're not in the right directory or haven't activated the virtual environment.

**Solution**: You MUST be in `training-studio/backend` (not `training-studio`):

```bash
# WRONG - you're in the wrong directory
cd training-studio
pip install ...  # FAILS - pip not found

# CORRECT - go to backend first
cd training-studio/backend
source venv/bin/activate   # bash/zsh
pip install ...            # WORKS
```

### tcsh/csh Users (% prompt)

If your terminal prompt ends with `%`, you're using tcsh. Use these commands:

```tcsh
# Navigate to backend
cd training-studio/backend

# Activate venv (note the .csh extension)
source venv/bin/activate.csh

# Now pip works
pip install openai-whisper librosa praat-parselmouth py-feat mediapipe opencv-python
```

### "venv/bin/activate: No such file or directory"

**Problem**: The virtual environment doesn't exist yet, or you're in the wrong directory.

**Solution**: Create the venv first:

```bash
# Make sure you're in the backend directory
cd training-studio/backend

# Create the virtual environment
python3.11 -m venv venv

# Now activate it
source venv/bin/activate      # bash/zsh
source venv/bin/activate.csh  # tcsh/csh
```

### "python3.11: command not found"

**Solution**: Install Python via Homebrew:

```bash
brew install python@3.11
```

Then use `python3.11` instead of `python3`.

---

## Summary: Complete Install Commands

### For bash/zsh users:

```bash
# 1. Homebrew dependencies (macOS)
brew install python@3.11 node yt-dlp ffmpeg portaudio libsndfile

# 2. Backend setup - IMPORTANT: go to backend directory first!
cd training-studio/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Install Full Mode dependencies (optional)
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python

# 4. Configure API keys (or use the UI instead)
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and optionally HUGGINGFACE_TOKEN
# OR just use the sidebar in the UI to enter keys

# 5. Frontend setup
cd ../frontend
npm install

# 6. Start
cd ..
./start.sh
```

### For tcsh/csh users (% prompt):

```tcsh
# 1. Homebrew dependencies (macOS)
brew install python@3.11 node yt-dlp ffmpeg portaudio libsndfile

# 2. Backend setup - IMPORTANT: go to backend directory first!
cd training-studio/backend
python3.11 -m venv venv
source venv/bin/activate.csh
pip install --upgrade pip
pip install -r requirements.txt

# 3. Install Full Mode dependencies (optional)
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python

# 4. Configure API keys (or use the UI instead)
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and optionally HUGGINGFACE_TOKEN
# OR just use the sidebar in the UI to enter keys

# 5. Frontend setup
cd ../frontend
npm install

# 6. Start
cd ..
source start.csh
```

---

## Configuring API Keys via UI

You can now configure API keys directly in the Training Studio UI instead of editing `.env`:

1. Start Training Studio (`./start.sh` or `source start.csh`)
2. Open http://localhost:3000
3. In the sidebar, you'll see:
   - **Claude API Key** (required) - Click to enter your Anthropic API key
   - **HuggingFace Token** (optional) - Click to enter for speaker diarization

The UI configuration is stored in memory and resets when the backend restarts. For permanent storage, use the `.env` file.
