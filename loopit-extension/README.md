# Loop It — A-B Repeat for YouTube & YouTube Music (v2)

A floating panel that loops any section of a YouTube video or YouTube Music
track, shows your loop markers right on the real progress bar, lets you
slow playback down, and remembers your loop per track.

## Install (Chrome, Edge, Brave — any Chromium browser)

1. **Download the extension**: Go to the [Releases page](https://github.com/Tejas-pr/browser-extensions/releases/latest) and download `loopit-extension.zip`.
2. Unzip this folder somewhere permanent (don't delete it after installing).
3. Open `chrome://extensions` (or `edge://extensions`).
4. Turn on **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the `loopit-extension` folder.
6. Go to youtube.com or music.youtube.com and play something.

No API keys, no account, no data collection — everything stays in your
browser's local storage.

## What's new in v2

- **Markers on the real scrubber** — A/B points now show directly on
  YouTube's own progress bar (teal for A, amber for B), not just on the
  panel's mini strip.
- **Playback speed** — chips for 0.5x–2x, so you can slow a passage down
  to learn it, then bring it back to full speed.
- **Saved loops** — hit **Save loop** and it's remembered for that exact
  video/track; next time you open it, your A/B points load automatically.
  **Forget** removes it.
- **Fullscreen support** — the panel and markers now follow you into
  fullscreen instead of disappearing.
- **Toolbar icon** — click the extension icon to bring the panel into
  view if it's collapsed or off-screen.
- Small polish pass: entrance animation, a spinning loop glyph while
  active, tidier layout, shortcuts moved into a "?" tooltip instead of
  cluttering the panel.

## How to use it

- **Set A / Set B** — mark the loop start/end at the current playhead.
- **Loop: On/Off** — toggles the repeat.
- **Speed chips** — change `video.playbackRate` instantly.
- **Save loop / Forget** — persist or remove the loop for this track.
- Drag the header to move the panel; **−** minimizes it.

Keyboard shortcuts (ignored while typing in a text field):

| Shortcut | Action |
|---|---|
| `Shift+A` | Set point A |
| `Shift+B` | Set point B |
| `Shift+L` | Toggle loop |
| `Shift+C` | Clear the loop |
| `Shift+S` | Save the current loop |

## Notes / limitations

- Works on `youtube.com` (regular videos) and `music.youtube.com`.
- Saved loops are keyed by the video ID in the URL (`?v=...`), stored in
  `localStorage` — they're per-browser, not synced across devices.
- If YouTube swaps the `<video>` element (e.g. after an ad), loop points
  reset for that playback — expected, since it's technically a new video
  instance.
- The on-scrubber markers are a visual overlay positioned on top of
  YouTube's real progress bar, not injected into it — this is deliberately
  more robust against YouTube changing their internal markup.

## Publishing this yourself

- **Chrome Web Store**: register at the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
  (one-time $5 fee), set your public "Publisher name" in account settings,
  zip this folder, and upload it as a new item. Icons are already included.
- **Firefox**: works with minor manifest tweaks (Firefox supports MV3
  content scripts the same way); publish for free via
  [addons.mozilla.org](https://addons.mozilla.org).
