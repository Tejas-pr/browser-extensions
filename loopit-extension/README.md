<div align="center">
  <h1>🔁 Loop It — Universal A-B Repeat</h1>
  <p>Ultimate playback control wrapped in a stunning glassmorphic UI.</p>
</div>

<div align="center">
  <img src="preview.png" alt="Loop It Extension Preview" width="600">
  <br>
  <br>
  <img src="preview_collapsed.png" alt="Loop It Extension Collapsed" width="300">
</div>

---

## ✨ Features

- **Media Controls** — Play/Pause, Next Track, and Previous Track buttons integrated directly into the panel.
- **Manual Time Entry** — Type exact timestamps (e.g., `1:20`) into the A and B fields, or click **SET** to capture the current playhead.
- **Draggable Timeline** — Drag along the custom timeline in the panel to visually scrub and set your loop boundaries.
- **Native Scrubber Markers** — A/B points are elegantly displayed directly on supported native progress bars (e.g., YouTube).
- **Playback Speed** — Instantly adjust playback speed to slow down complex passages for learning, then easily revert to normal speed.
- **Persistent Saved Loops** — Hit **Save loop** and the extension will remember your loop points for that specific track/video the next time you open it.
- **Premium Glassmorphic UI** — A beautiful, translucent, modern interface designed for maximum aesthetics and minimal intrusion.
- **Smart Auto-Reset** — Loop points cleanly reset when you navigate to a new track, keeping your experience friction-free.

---

## 🚀 Installation & Usage

> **Note:** Compatible with any Chromium-based browser (Chrome, Edge, Brave, etc.)

1. Download the latest `loopit-extension.zip` from the [Releases page](https://github.com/Tejas-pr/browser-extensions/releases/latest).
2. Unzip the folder to a permanent location on your machine.
3. Navigate to `chrome://extensions` (or `edge://extensions`).
4. Toggle on **Developer mode** (top-right corner).
5. Click **Load unpacked** and select the unzipped `loopit-extension` folder.

### 🎮 How to Use
- **Media Controls** — Manage playback directly without hunting for YouTube's native controls.
- **Set Loop Points** — Type a time, click "SET", or drag the timeline to define your A and B boundaries.
- **Toggle Loop** — Instantly turn the repeat on or off.
- **Speed Adjustments** — Click the speed chips to change `video.playbackRate` instantly.
- **Shortcuts Panel** — Click the `⌘` icon in the header to view all keyboard shortcuts.
- **Window Management** — Drag the header to reposition the panel anywhere on your screen. Click **−** to minimize it completely out of the way.

---

## ⌨️ Keyboard Shortcuts

*Note: Shortcuts are intelligently ignored while you are typing in any text field.*

| Shortcut | Action |
|:---|:---|
| <kbd>Shift</kbd> + <kbd>A</kbd> | Set Point A |
| <kbd>Shift</kbd> + <kbd>B</kbd> | Set Point B |
| <kbd>Shift</kbd> + <kbd>L</kbd> | Toggle Loop |
| <kbd>Shift</kbd> + <kbd>C</kbd> | Clear the Loop |
| <kbd>Shift</kbd> + <kbd>S</kbd> | Save the Current Loop |

---

## 📝 Technical Notes & Limitations

- **Universal Support**: Uses deep site adapters for YouTube, YouTube Music, and Apple Music. Automatically falls back to a generic adapter for any other site using standard HTML5 `<video>` or `<audio>` elements. *(Note: Spotify is unsupported due to DRM hiding its audio elements).*
- **Privacy First:** No API keys, no accounts, and absolutely zero data collection. Everything stays strictly in your browser's local storage.
- Saved loops are keyed by the video ID (`?v=...`) and stored in `localStorage`. They are localized to your specific browser and do not sync across devices.
- If YouTube dynamically swaps the `<video>` element (e.g., after an ad), loop points will reset for that playback session. This is expected behavior as a new video instance is created.
- The on-scrubber markers function as a visual overlay positioned atop YouTube's real progress bar, rather than being injected into it. This architectural choice makes the extension highly robust against YouTube's internal markup changes.

---

## 📦 Publishing the Extension

- **Chrome Web Store**: Register at the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5 fee), configure your public "Publisher name", zip this directory, and upload it as a new item. All necessary icons are already included.
- **Firefox**: The extension is compatible with minor manifest adjustments (Firefox fully supports MV3 content scripts). You can publish it for free via [addons.mozilla.org](https://addons.mozilla.org).
