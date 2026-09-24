# 🎬 MP4 to GIF Splitter

A free, modern, and privacy-first tool to automatically slice videos into smooth, high-quality GIF segments.

Everything runs **100% client-side** in your web browser — your videos are never uploaded to any server.

👉 **[Try the Live Web App](https://imcas08.github.io/mp4-to-gif-splitter/)**

---

## 💡 Why I Built This

As a motion graphics designer, building my portfolio was always exciting — except for one repetitive chore: manually chopping video showreels into short GIFs for platforms like Behance, Dribbble, and personal websites.

Doing this in video editing software — repeatedly trimming clips, tweaking export settings, and rendering files one by one — took hours of mindless repetition.

I created this tool to completely automate that workflow: drop in a video, let it slice continuous GIF segments in seconds, and download everything in one click — 100% locally in your browser.

---

## 🌟 Key Features

- 🔒 **100% Private & In-Browser**: Video processing uses local HTML5 Canvas & Web Workers — nothing leaves your machine.
- ⚡ **Smart Automatic Splitting**: Slices videos into continuous segments (e.g., turning a 10-second video into five 2-second GIFs).
- ⚙️ **Fully Customizable**: Adjust segment length, frame rate (FPS), and resolution to balance quality and file size.
- 👁️ **Live Previews**: Inspect generated GIFs with real-time playback right in your browser.
- 📦 **One-Click Batch Export**: Download individual GIF files or grab all of them packed into a single **.ZIP** archive.

---

## 📖 User Guide

### Step 1: Open the Tool
Use the tool directly in your browser at **[https://imcas08.github.io/mp4-to-gif-splitter/](https://imcas08.github.io/mp4-to-gif-splitter/)**, or open `index.html` locally.

### Step 2: Upload Your Video
Drag & drop your video file (`.mp4`, `.webm`, `.mov`) into the upload zone, or click **Choose Video File**.

### Step 3: Adjust Settings (Optional)
- **GIF Duration (seconds)**: Desired duration for each GIF segment (e.g., `2` for 2-second segments).
- **Frame Rate (FPS)**:
  - `10 FPS`: Lightest file size.
  - `12 FPS`: Recommended sweet spot between smoothness and size.
  - `15 FPS` / `20 FPS`: Maximum fluidity for dynamic motion design.
- **GIF Width**: Choose resolution width (`360px`, `480px`, or `640px`). Height scales proportionally.
- **Video Duration**: Automatically detects your uploaded video's total duration. You can also adjust it if you only want to process the first few seconds.

### Step 4: Split & Download
1. Click **Start Splitting into GIFs**.
2. Watch the live progress indicator as each segment is extracted and encoded.
3. Review your animated GIFs in the preview gallery:
   - Click **Download GIF** on any card to save that segment.
   - Click **Download All as ZIP (.zip)** to download all segments together.
