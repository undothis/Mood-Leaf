# Training Studio - Complete Installation Guide

**For beginners with no technical experience.**

This guide will walk you through every step. Follow it exactly and you'll have Training Studio running.

---

## Before You Start: What Are We Installing?

Training Studio has several parts that work together:

| Component | What It Does | Why You Need It |
|-----------|--------------|-----------------|
| **Homebrew** | A tool that installs other tools on Mac | Makes installation easy |
| **Python** | Programming language | Runs the backend server |
| **Node.js** | JavaScript runtime | Runs the frontend website |
| **yt-dlp** | YouTube downloader | Gets video transcripts |
| **ffmpeg** | Audio/video processor | Converts media files |
| **pip packages** | Python libraries | Powers AI features (Whisper, facial analysis, etc.) |

---

## Step 1: Open Terminal

Terminal is an app on your Mac that lets you type commands.

**How to open it:**
1. Press `Command + Space` (opens Spotlight search)
2. Type `Terminal`
3. Press `Enter`

You'll see a window with text. This is where you'll type all the commands.

**What shell are you using?**

Look at your prompt (the text before your cursor):
- If it ends with `$` → You're using **bash** or **zsh** (most common)
- If it ends with `%` → You're using **tcsh** (older Macs, some universities)

**Write down which one you have.** The commands are slightly different.

---

## Step 2: Install Homebrew

Homebrew is a tool that installs other tools. Think of it like an App Store for developer tools.

**Copy and paste this entire command into Terminal, then press Enter:**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**What happens:**
- It will ask for your Mac password (you won't see it as you type - that's normal)
- It will download and install Homebrew
- This takes 2-5 minutes

**If it says "Homebrew is already installed"** → Great! Skip to Step 3.

**After installation, you may see instructions to run additional commands.** If Homebrew tells you to run commands like `eval "$(/opt/homebrew/bin/brew shellenv)"`, copy and run those too.

---

## Step 3: Install System Tools with Homebrew

Now we'll install Python, Node.js, and other tools.

**Copy and paste this command:**

```bash
brew install python@3.11 node yt-dlp ffmpeg portaudio libsndfile
```

**What each part does:**
- `python@3.11` - The programming language (version 3.11)
- `node` - JavaScript runtime for the website
- `yt-dlp` - Downloads YouTube transcripts
- `ffmpeg` - Processes audio/video files
- `portaudio` - Audio support for voice analysis
- `libsndfile` - Reads audio file formats

**This takes 5-15 minutes.** You'll see lots of text scrolling - that's normal.

---

## Step 4: Fix the Python Path (IMPORTANT!)

After Homebrew installs Python, your Mac doesn't automatically know where to find it. We need to tell it.

### For bash/zsh users ($ prompt):

**Run these two commands one at a time:**

```bash
echo 'export PATH="/opt/homebrew/opt/python@3.11/libexec/bin:$PATH"' >> ~/.zshrc
```

```bash
source ~/.zshrc
```

### For tcsh users (% prompt):

**Run these two commands one at a time:**

```tcsh
echo 'set path = (/opt/homebrew/opt/python@3.11/libexec/bin $path)' >> ~/.tcshrc
```

```tcsh
source ~/.tcshrc
```

**What this does:** Tells your Mac where to find the Python we just installed.

### Verify Python works:

```bash
python3.11 --version
```

**You should see:** `Python 3.11.x` (x can be any number)

**If you see "command not found":**
- Close Terminal completely (Command + Q)
- Open Terminal again
- Try the command again

---

## Step 5: Navigate to the Project Folder

Now we need to go to where Training Studio lives on your computer.

**First, find out where your project is:**
- Open Finder
- Navigate to where you downloaded/cloned the project
- You should see a folder called `Mood-Leaf` (or similar)
- Inside it should be `training-studio`

**Common locations:**
- `~/GitHub/Mood-Leaf/training-studio`
- `~/Documents/Mood-Leaf/training-studio`
- `~/Downloads/Mood-Leaf/training-studio`

**In Terminal, navigate there. Replace the path with YOUR actual path:**

```bash
cd ~/GitHub/Mood-Leaf/training-studio
```

**To check you're in the right place:**

```bash
ls
```

**You should see these folders:**
```
backend/
frontend/
docs/
start.sh
start.csh
README.md
```

If you don't see these, you're in the wrong folder. Use `cd` to navigate to the correct location.

---

## Step 6: Set Up the Backend (Python Server)

The backend is the "brain" - it does all the AI processing.

### 6a. Go into the backend folder

**THIS IS CRITICAL - you MUST be in the backend folder:**

```bash
cd backend
```

**Verify you're in the right place:**

```bash
pwd
```

**Should show something like:** `/Users/yourname/GitHub/Mood-Leaf/training-studio/backend`

The path MUST end with `/backend`. If it doesn't, the next steps will fail.

### 6b. Create a Virtual Environment

A virtual environment is like a separate room for Python packages, so they don't interfere with other projects.

```bash
python3.11 -m venv venv
```

**What this does:** Creates a folder called `venv` with a private Python installation.

**If you get "python3.11: command not found":**
- Go back to Step 4 and fix the Python path
- Or try using the full path: `/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv`

### 6c. Activate the Virtual Environment

This "enters" the virtual environment so packages install in the right place.

**For bash/zsh users ($ prompt):**

```bash
source venv/bin/activate
```

**For tcsh users (% prompt):**

```tcsh
source venv/bin/activate.csh
```

**How to know it worked:** Your prompt should now start with `(venv)`:
- Before: `yourname@MacBook backend $`
- After: `(venv) yourname@MacBook backend $`

**If you see "(venv)" at the start of your prompt, you're good!**

### 6d. Upgrade pip

pip is Python's package installer. Let's make sure it's up to date.

```bash
pip install --upgrade pip
```

### 6e. Install Required Python Packages

```bash
pip install -r requirements.txt
```

**What this does:** Installs all the basic packages Training Studio needs.

**This takes 2-5 minutes.** You'll see packages downloading and installing.

### 6f. Install Full Mode Packages (Optional but Recommended)

These packages enable advanced features like local transcription and facial analysis.

```bash
pip install openai-whisper librosa praat-parselmouth py-feat mediapipe opencv-python
```

**What each package does:**
- `openai-whisper` - Transcribes speech to text locally (no internet needed)
- `librosa` - Analyzes voice patterns (pitch, rhythm, pauses)
- `praat-parselmouth` - Analyzes voice quality
- `py-feat` - Detects facial expressions
- `mediapipe` - Backup facial detection
- `opencv-python` - Processes video frames

**This takes 10-20 minutes** because some packages are large (several GB).

---

## Step 7: Set Up the Frontend (Website)

The frontend is the website you'll interact with.

### 7a. Go to the frontend folder

First, go back up one folder, then into frontend:

```bash
cd ../frontend
```

**Verify you're in the right place:**

```bash
pwd
```

**Should end with:** `/training-studio/frontend`

### 7b. Install JavaScript Packages

```bash
npm install
```

**What this does:** Downloads all the website code packages.

**This takes 2-5 minutes.**

---

## Step 8: Start Training Studio

Now let's start the application!

### 8a. Go back to the main training-studio folder

```bash
cd ..
```

**Verify:**

```bash
pwd
```

**Should end with:** `/training-studio` (NOT `/training-studio/backend` or `/training-studio/frontend`)

### 8b. Start the application

**For bash/zsh users ($ prompt):**

```bash
./start.sh
```

**For tcsh users (% prompt):**

```tcsh
source start.csh
```

**What happens:**
- The backend server starts on port 8000
- The frontend server starts on port 3000
- Your web browser should open automatically

**If browser doesn't open automatically:**
Open your browser and go to: http://localhost:3000

---

## Step 9: Configure API Keys

Training Studio needs API keys to work. You can enter them in the website.

### 9a. Get a Claude API Key (Required)

1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-`)

### 9b. Enter the Key in Training Studio

1. Look at the left sidebar of Training Studio
2. Find "Claude API Key"
3. Click on it
4. Paste your key
5. Click "Save"

**The indicator should turn green** when configured correctly.

### 9c. HuggingFace Token (Optional)

This is only needed if you want speaker diarization (identifying who said what in interviews).

1. Go to https://huggingface.co
2. Create an account
3. Go to https://huggingface.co/settings/tokens
4. Create a new token
5. Also accept the terms at https://huggingface.co/pyannote/speaker-diarization-3.1

Then enter the token in Training Studio's sidebar under "HuggingFace Token".

---

## Troubleshooting

### "command not found"

**Problem:** Terminal doesn't recognize a command.

**Solutions:**
1. Check for typos
2. Make sure you installed the tool (Step 3)
3. Restart Terminal (Command + Q, then reopen)
4. Check your PATH (Step 4)

### "No such file or directory"

**Problem:** You're in the wrong folder.

**Solution:**
1. Run `pwd` to see where you are
2. Run `ls` to see what's in the current folder
3. Use `cd` to navigate to the correct folder

### "pip: command not found"

**Problem:** You're not in the backend folder, or venv isn't activated.

**Solution:**
1. Navigate to backend: `cd ~/GitHub/Mood-Leaf/training-studio/backend`
2. Activate venv: `source venv/bin/activate` (or `.csh` for tcsh)
3. Now pip should work

### "python3.11: command not found"

**Problem:** Python path isn't set up.

**Solutions:**
1. Try Step 4 again
2. Use the full path: `/opt/homebrew/opt/python@3.11/bin/python3.11`

### "venv/bin/activate: No such file or directory"

**Problem:** The virtual environment doesn't exist yet.

**Solution:**
1. Make sure you're in the backend folder: `cd ~/GitHub/Mood-Leaf/training-studio/backend`
2. Create the venv: `python3.11 -m venv venv`
3. Then activate it

### Backend not starting

**Check the diagnostics:**
1. Open http://localhost:3000
2. Look at the Dashboard
3. The "System Diagnostics" section shows what's working and what's not

### tcsh users seeing strange errors

**Remember:** tcsh uses different syntax:
- Use `source venv/bin/activate.csh` (NOT `source venv/bin/activate`)
- Use `source start.csh` (NOT `./start.sh`)

---

## Quick Reference Card

**Starting Training Studio (after initial setup):**

```bash
# 1. Open Terminal
# 2. Go to training-studio
cd ~/GitHub/Mood-Leaf/training-studio

# 3. Start it
./start.sh   # bash/zsh
# OR
source start.csh   # tcsh

# 4. Open browser to http://localhost:3000
```

**If things aren't working:**

```bash
# Go to backend
cd ~/GitHub/Mood-Leaf/training-studio/backend

# Activate venv
source venv/bin/activate   # bash/zsh
source venv/bin/activate.csh   # tcsh

# Check what's installed
pip list

# Reinstall everything
pip install -r requirements.txt
pip install openai-whisper librosa praat-parselmouth py-feat mediapipe opencv-python
```

---

## Glossary

| Term | What It Means |
|------|---------------|
| **Terminal** | App where you type commands |
| **Command** | Text instruction you type |
| **Directory/Folder** | Same thing - a place that contains files |
| **cd** | "Change directory" - navigate to a folder |
| **ls** | "List" - see what's in current folder |
| **pwd** | "Print working directory" - show where you are |
| **Homebrew** | Tool that installs other tools |
| **pip** | Python's package installer |
| **npm** | JavaScript's package installer |
| **venv** | Virtual environment - isolated Python setup |
| **PATH** | List of places your Mac looks for commands |
| **API Key** | Password that lets you use a service |

---

## Summary: What We Installed

1. **Homebrew** - Tool installer
2. **Python 3.11** - Programming language for backend
3. **Node.js** - JavaScript runtime for frontend
4. **yt-dlp** - YouTube transcript downloader
5. **ffmpeg** - Audio/video processor
6. **Python packages** - AI libraries for transcription, voice analysis, facial analysis
7. **JavaScript packages** - Website code

All of these work together to:
- Download YouTube video transcripts
- Analyze voice patterns and facial expressions
- Extract coaching insights using Claude AI
- Display everything in a nice website interface

---

## Need More Help?

- Check the [Complete Setup Guide](SETUP.md) for advanced troubleshooting
- Look at the main [README](../README.md) for feature documentation
- The Dashboard at http://localhost:3000 has built-in diagnostics
