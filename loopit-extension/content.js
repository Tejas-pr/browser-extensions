(function () {
  'use strict';

  const LS_POS = 'loopit_pos';
  const LS_COLLAPSED = 'loopit_collapsed';
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  let video = null;
  let pointA = null;
  let pointB = null;
  let looping = false;
  let statusTimer = null;
  let currentVideoId = null;

  let panelEl, aTimeEl, bTimeEl, loopBtn, strip, stripRange, stripPlayhead, statusEl;
  let speedChips = [];
  let saveBtn, deleteSavedBtn, glyphEl;
  let barOverlay, barMarkerA, barMarkerB, barRange;
  let thumbA, thumbB;


  function parseTime(str) {
    if (!str) return null;
    const parts = str.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1 && !isNaN(parts[0])) {
      return parts[0];
    }
    return null;
  }

  function fmt(t) {
    if (t == null || Number.isNaN(t)) return '--:--';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function flash(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = '';
    }, 1800);
  }

  // ---------- site adapters ----------
  const Adapters = {
    YouTube: {
      matches: () => location.hostname.includes('youtube.com'),
      getId: () => new URLSearchParams(location.search).get('v') || location.pathname,
      getMedia: () => document.querySelector('video'),
      getScrubber: () => document.querySelector('.ytp-progress-bar-container') || document.querySelector('#progress-bar'),
      prev: () => { const btn = document.querySelector('.ytp-prev-button') || document.querySelector('.ytmusic-player-bar .previous-button'); if (btn) btn.click(); },
      next: () => { const btn = document.querySelector('.ytp-next-button') || document.querySelector('.ytmusic-player-bar .next-button'); if (btn) btn.click(); }
    },
    Spotify: {
      matches: () => location.hostname.includes('spotify.com'),
      getId: () => location.pathname,
      getMedia: () => document.querySelector('video, audio'),
      getScrubber: () => document.querySelector('[data-testid="playback-progressbar"]'),
      prev: () => { const btn = document.querySelector('[data-testid="control-button-skip-back"]'); if (btn) btn.click(); },
      next: () => { const btn = document.querySelector('[data-testid="control-button-skip-forward"]'); if (btn) btn.click(); }
    },
    AppleMusic: {
      matches: () => location.hostname.includes('music.apple.com'),
      getId: () => location.pathname,
      getMedia: () => document.querySelector('video, audio, apple-music-video'),
      getScrubber: () => null,
      prev: () => { const btn = document.querySelector('.button-skip-backwards'); if (btn) btn.click(); },
      next: () => { const btn = document.querySelector('.button-skip-forward'); if (btn) btn.click(); }
    },
    Generic: {
      matches: () => true, // Fallback
      getId: () => location.hostname + location.pathname,
      getMedia: () => document.querySelector('video, audio'),
      getScrubber: () => null,
      prev: () => {},
      next: () => {}
    }
  };

  let activeAdapter = Adapters.Generic;
  for (const key in Adapters) {
    if (Adapters[key].matches()) {
      activeAdapter = Adapters[key];
      break;
    }
  }

  // ---------- video id / per-track storage ----------

  function getVideoId() {
    try {
      return activeAdapter.getId() || null;
    } catch (e) {
      return null;
    }
  }

  function loopKey(id) {
    return `loopit_loop_${id}`;
  }

  function readSavedLoop(id) {
    if (!id) return null;
    try {
      const raw = localStorage.getItem(loopKey(id));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveCurrentLoop() {
    const id = getVideoId();
    if (!id) return flash('No track detected');
    if (pointA == null || pointB == null) return flash('Set A and B first');
    localStorage.setItem(loopKey(id), JSON.stringify({ a: pointA, b: pointB }));
    flash('Loop saved for this track');
    updateSaveUI();
  }

  function deleteSavedLoop() {
    const id = getVideoId();
    if (!id) return;
    localStorage.removeItem(loopKey(id));
    flash('Saved loop removed');
    updateSaveUI();
  }

  function updateSaveUI() {
    const id = getVideoId();
    const saved = readSavedLoop(id);
    deleteSavedBtn.style.display = saved ? 'inline-flex' : 'none';
  }

  // ---------- panel ----------

  function buildPanel() {
    if (document.getElementById('loopit-panel')) return;

    panelEl = document.createElement('div');
    panelEl.id = 'loopit-panel';
    panelEl.classList.add('loopit-enter');
    panelEl.style.display = 'none';

    panelEl.innerHTML = `
      <div class="loopit-header" id="loopit-header">
        <span class="loopit-title"><span class="loopit-glyph" id="loopit-glyph">&#8635;</span>LOOP IT</span>
        <span class="loopit-header-actions">
          <button class="loopit-icon-btn" id="loopit-shortcuts-btn" title="Shortcuts">⌘</button>
          <button class="loopit-icon-btn" id="loopit-collapse" title="Minimize">&#8722;</button>
        </span>
      </div>
      <div id="loopit-body">
        <div id="loopit-shortcuts-panel" class="loopit-hidden">
          <div class="loopit-shortcut-item"><span>Set Point A</span><strong>Shift+A</strong></div>
          <div class="loopit-shortcut-item"><span>Set Point B</span><strong>Shift+B</strong></div>
          <div class="loopit-shortcut-item"><span>Toggle Loop</span><strong>Shift+L</strong></div>
          <div class="loopit-shortcut-item"><span>Clear Loop</span><strong>Shift+C</strong></div>
          <div class="loopit-shortcut-item"><span>Save Loop</span><strong>Shift+S</strong></div>
        </div>
        
        <div class="loopit-media-controls">
          <button class="loopit-media-btn" id="loopit-prev" title="Previous Track">&#9198;</button>
          <button class="loopit-media-btn" id="loopit-playpause" title="Play/Pause">&#9199;</button>
          <button class="loopit-media-btn" id="loopit-next" title="Next Track">&#9197;</button>
        </div>

        <div class="loopit-marker-row">
          <span class="loopit-dot loopit-dot-a"></span>
          <span class="loopit-marker-label">A</span>
          <input type="text" class="loopit-time-input" id="loopit-aTime" value="--:--">
          <button class="loopit-set-btn" id="loopit-setA">SET</button>
        </div>
        <div class="loopit-strip" id="loopit-strip">
          <div class="loopit-strip-range" id="loopit-stripRange"></div>
          <div class="loopit-strip-thumb loopit-thumb-a" id="loopit-thumbA"></div>
          <div class="loopit-strip-thumb loopit-thumb-b" id="loopit-thumbB"></div>
          <div class="loopit-strip-playhead" id="loopit-stripPlayhead"></div>
        </div>
        <div class="loopit-marker-row">
          <span class="loopit-dot loopit-dot-b"></span>
          <span class="loopit-marker-label">B</span>
          <input type="text" class="loopit-time-input" id="loopit-bTime" value="--:--">
          <button class="loopit-set-btn" id="loopit-setB">SET</button>
        </div>
        <div class="loopit-actions">
          <button class="loopit-btn loopit-btn-loop" id="loopit-loopToggle">Loop: Off</button>
          <button class="loopit-btn" id="loopit-clear">Clear</button>
        </div>
        <div class="loopit-section-label">Speed</div>
        <div class="loopit-speed-row" id="loopit-speedRow"></div>
        <div class="loopit-actions" style="margin-top:8px;">
          <button class="loopit-btn" id="loopit-save">Save loop</button>
          <button class="loopit-btn loopit-btn-danger" id="loopit-deleteSaved" style="display:none;">Forget</button>
        </div>
        <div class="loopit-status" id="loopit-status"></div>
      </div>
    `;

    document.body.appendChild(panelEl);

    aTimeEl = panelEl.querySelector('#loopit-aTime');
    bTimeEl = panelEl.querySelector('#loopit-bTime');
    loopBtn = panelEl.querySelector('#loopit-loopToggle');
    strip = panelEl.querySelector('#loopit-strip');
    stripRange = panelEl.querySelector('#loopit-stripRange');
    stripPlayhead = panelEl.querySelector('#loopit-stripPlayhead');
    thumbA = panelEl.querySelector('#loopit-thumbA');
    thumbB = panelEl.querySelector('#loopit-thumbB');
    statusEl = panelEl.querySelector('#loopit-status');
    saveBtn = panelEl.querySelector('#loopit-save');
    deleteSavedBtn = panelEl.querySelector('#loopit-deleteSaved');
    glyphEl = panelEl.querySelector('#loopit-glyph');

    panelEl.querySelector('#loopit-setA').addEventListener('click', setA);
    panelEl.querySelector('#loopit-setB').addEventListener('click', setB);
    panelEl.querySelector('#loopit-loopToggle').addEventListener('click', toggleLoop);
    panelEl.querySelector('#loopit-clear').addEventListener('click', clearLoop);
    panelEl.querySelector('#loopit-collapse').addEventListener('click', toggleCollapse);
    saveBtn.addEventListener('click', saveCurrentLoop);
    deleteSavedBtn.addEventListener('click', deleteSavedLoop);
    
    // Shortcuts
    panelEl.querySelector('#loopit-shortcuts-btn').addEventListener('click', () => {
      panelEl.querySelector('#loopit-shortcuts-panel').classList.toggle('loopit-hidden');
    });

    // Media Controls
    panelEl.querySelector('#loopit-prev').addEventListener('click', () => {
      activeAdapter.prev();
    });
    panelEl.querySelector('#loopit-next').addEventListener('click', () => {
      activeAdapter.next();
    });
    panelEl.querySelector('#loopit-playpause').addEventListener('click', () => {
      if (!video) return;
      if (video.paused) video.play();
      else video.pause();
    });

    // Manual Time Entry
    function handleTimeInput(e, isA) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      const t = parseTime(e.target.value);
      if (t !== null && video) {
        if (isA) {
          pointA = t;
          if (pointB != null && pointA >= pointB) pointB = null;
        } else {
          if (pointA != null && t <= pointA) return flash('B must be after A');
          pointB = t;
        }
        updateDisplay();
        if (e.type === 'keydown') e.target.blur();
      } else {
        e.target.value = fmt(isA ? pointA : pointB);
      }
    }
    aTimeEl.addEventListener('blur', (e) => handleTimeInput(e, true));
    aTimeEl.addEventListener('keydown', (e) => handleTimeInput(e, true));
    bTimeEl.addEventListener('blur', (e) => handleTimeInput(e, false));
    bTimeEl.addEventListener('keydown', (e) => handleTimeInput(e, false));

    // Draggable Strip
    function handleStripDrag(e) {
      if (!video || !video.duration) return;
      const rect = strip.getBoundingClientRect();
      let pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(pct, 1));
      const t = pct * video.duration;
      
      if (pointA == null) {
        pointA = t;
      } else if (pointB == null) {
        if (t > pointA) pointB = t;
        else { pointB = pointA; pointA = t; }
      } else {
        if (Math.abs(t - pointA) < Math.abs(t - pointB)) {
          pointA = t;
        } else {
          pointB = t;
        }
      }
      if (pointA != null && pointB != null && pointA > pointB) {
        const tmp = pointA; pointA = pointB; pointB = tmp;
      }
      updateDisplay();
    }
    
    let isDraggingStrip = false;
    strip.addEventListener('mousedown', (e) => {
      isDraggingStrip = true;
      handleStripDrag(e);
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (isDraggingStrip) handleStripDrag(e);
    });
    document.addEventListener('mouseup', () => {
      isDraggingStrip = false;
    });

    const speedRow = panelEl.querySelector('#loopit-speedRow');
    speedChips = SPEEDS.map((rate) => {
      const chip = document.createElement('button');
      chip.className = 'loopit-speed-chip';
      chip.textContent = `${rate}x`;
      chip.dataset.rate = String(rate);
      chip.addEventListener('click', () => setSpeed(rate));
      speedRow.appendChild(chip);
      return chip;
    });

    buildBarOverlay();
    restorePosition();
    restoreCollapsed();
    makeDraggable(panelEl.querySelector('#loopit-header'));
    updateDisplay();
    updateSpeedUI();
    updateSaveUI();

    setTimeout(() => panelEl.classList.remove('loopit-enter'), 300);
  }

  function buildBarOverlay() {
    barOverlay = document.createElement('div');
    barOverlay.id = 'loopit-bar-overlay';
    barOverlay.innerHTML = `
      <div class="loopit-bar-range" id="loopit-barRange"></div>
      <div class="loopit-bar-marker loopit-marker-a" id="loopit-barMarkerA"></div>
      <div class="loopit-bar-marker loopit-marker-b" id="loopit-barMarkerB"></div>
    `;
    document.body.appendChild(barOverlay);
    barRange = barOverlay.querySelector('#loopit-barRange');
    barMarkerA = barOverlay.querySelector('#loopit-barMarkerA');
    barMarkerB = barOverlay.querySelector('#loopit-barMarkerB');
  }

  function restorePosition() {
    try {
      const raw = localStorage.getItem(LS_POS);
      if (!raw) return;
      const { top, left } = JSON.parse(raw);
      if (typeof top === 'number' && typeof left === 'number') {
        panelEl.style.top = `${top}px`;
        panelEl.style.left = `${left}px`;
        panelEl.style.right = 'auto';
        panelEl.style.bottom = 'auto';
      }
    } catch (e) {
      /* ignore malformed storage */
    }
  }

  function restoreCollapsed() {
    if (localStorage.getItem(LS_COLLAPSED) === '1') {
      panelEl.classList.add('loopit-collapsed');
      panelEl.querySelector('#loopit-collapse').textContent = '+';
    }
  }

  function toggleCollapse() {
    const collapsed = panelEl.classList.toggle('loopit-collapsed');
    panelEl.querySelector('#loopit-collapse').textContent = collapsed ? '+' : '\u2212';
    localStorage.setItem(LS_COLLAPSED, collapsed ? '1' : '0');
  }

  function focusPanel() {
    if (panelEl.classList.contains('loopit-collapsed')) toggleCollapse();
    panelEl.classList.add('loopit-attn');
    setTimeout(() => panelEl.classList.remove('loopit-attn'), 900);
  }

  function makeDraggable(handle) {
    let dragging = false;
    let startX, startY, startTop, startLeft;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.loopit-icon-btn')) return;
      dragging = true;
      const rect = panelEl.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startTop = rect.top;
      startLeft = rect.left;
      panelEl.style.top = `${startTop}px`;
      panelEl.style.left = `${startLeft}px`;
      panelEl.style.right = 'auto';
      panelEl.style.bottom = 'auto';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let top = startTop + dy;
      let left = startLeft + dx;
      top = Math.max(4, Math.min(window.innerHeight - 40, top));
      left = Math.max(4, Math.min(window.innerWidth - 40, left));
      panelEl.style.top = `${top}px`;
      panelEl.style.left = `${left}px`;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      const rect = panelEl.getBoundingClientRect();
      localStorage.setItem(LS_POS, JSON.stringify({ top: rect.top, left: rect.left }));
    });
  }

  // ---------- loop points ----------

  function setA() {
    if (!video) return flash('No video found yet');
    pointA = video.currentTime;
    if (pointB != null && pointA >= pointB) pointB = null;
    updateDisplay();
    flash('Point A set');
  }

  function setB() {
    if (!video) return flash('No video found yet');
    if (pointA != null && video.currentTime <= pointA) return flash('B must be after A');
    pointB = video.currentTime;
    updateDisplay();
    flash('Point B set');
  }

  function toggleLoop() {
    if (pointA == null || pointB == null) return flash('Set A and B first');
    looping = !looping;
    updateDisplay();
  }

  function clearLoop() {
    pointA = null;
    pointB = null;
    looping = false;
    updateDisplay();
  }

  function updateDisplay() {
    if (!aTimeEl) return;
    if (document.activeElement !== aTimeEl) aTimeEl.value = fmt(pointA);
    if (document.activeElement !== bTimeEl) bTimeEl.value = fmt(pointB);
    loopBtn.textContent = looping ? 'Loop: On' : 'Loop: Off';
    loopBtn.classList.toggle('loopit-on', looping);
    strip.classList.toggle('loopit-looping', looping);
    glyphEl.classList.toggle('loopit-spin', looping);
    updateStrip();
    syncBarOverlay();
  }

  function updateStrip() {
    const duration = video && video.duration ? video.duration : 0;
    if (!duration || pointA == null || pointB == null) {
      stripRange.classList.remove('loopit-active-range');
    } else {
      stripRange.classList.add('loopit-active-range');
      const leftPct = (pointA / duration) * 100;
      const widthPct = ((pointB - pointA) / duration) * 100;
      stripRange.style.left = `${leftPct}%`;
      stripRange.style.width = `${Math.max(widthPct, 0.5)}%`;
    }
    if (duration && pointA != null) {
      thumbA.style.display = 'block';
      thumbA.style.left = `${(pointA / duration) * 100}%`;
    } else if (thumbA) {
      thumbA.style.display = 'none';
    }
    if (duration && pointB != null) {
      thumbB.style.display = 'block';
      thumbB.style.left = `${(pointB / duration) * 100}%`;
    } else if (thumbB) {
      thumbB.style.display = 'none';
    }
    if (duration && video) {
      const pct = (video.currentTime / duration) * 100;
      stripPlayhead.style.left = `${Math.min(Math.max(pct, 0), 100)}%`;
    }
  }

  // ---------- speed ----------

  function setSpeed(rate) {
    if (!video) return;
    video.playbackRate = rate;
    updateSpeedUI();
  }

  function updateSpeedUI() {
    const rate = video ? video.playbackRate : 1;
    speedChips.forEach((chip) => {
      chip.classList.toggle('loopit-active', Math.abs(parseFloat(chip.dataset.rate) - rate) < 0.001);
    });
  }

  // ---------- progress-bar overlay (real YouTube/YT Music scrubber) ----------

  function getProgressBarEl() {
    return activeAdapter.getScrubber();
  }

  function syncBarOverlay() {
    if (!barOverlay) return;
    const bar = getProgressBarEl();
    if (!bar || !video || !video.duration) {
      barOverlay.style.display = 'none';
      return;
    }
    const rect = bar.getBoundingClientRect();
    if (rect.width === 0) {
      barOverlay.style.display = 'none';
      return;
    }
    barOverlay.style.display = 'block';
    barOverlay.style.top = `${rect.top}px`;
    barOverlay.style.left = `${rect.left}px`;
    barOverlay.style.width = `${rect.width}px`;
    barOverlay.style.height = `${rect.height}px`;

    const duration = video.duration;
    if (pointA != null) {
      barMarkerA.style.left = `${(pointA / duration) * 100}%`;
      barMarkerA.style.display = 'block';
    } else {
      barMarkerA.style.display = 'none';
    }
    if (pointB != null) {
      barMarkerB.style.left = `${(pointB / duration) * 100}%`;
      barMarkerB.style.display = 'block';
    } else {
      barMarkerB.style.display = 'none';
    }
    if (pointA != null && pointB != null) {
      barRange.style.left = `${(pointA / duration) * 100}%`;
      barRange.style.width = `${((pointB - pointA) / duration) * 100}%`;
      barRange.style.display = 'block';
    } else {
      barRange.style.display = 'none';
    }
  }

  function reparentForFullscreen() {
    const fsEl = document.fullscreenElement;
    const target = fsEl || document.body;
    if (panelEl && panelEl.parentElement !== target) target.appendChild(panelEl);
    if (barOverlay && barOverlay.parentElement !== target) target.appendChild(barOverlay);
    syncBarOverlay();
  }

  // ---------- video attach / SPA navigation ----------

  function onTimeUpdate() {
    updateStrip();
    syncBarOverlay();
    if (looping && pointA != null && pointB != null && video) {
      if (video.currentTime >= pointB || video.currentTime < pointA - 0.25) {
        video.currentTime = pointA;
      }
    }
  }

  function onRateChange() {
    updateSpeedUI();
  }

  function attachVideo(v) {
    if (video === v) return;
    if (video) {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ratechange', onRateChange);
    }
    video = v;
    pointA = null;
    pointB = null;
    looping = false;
    currentVideoId = getVideoId();

    if (video) {
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ratechange', onRateChange);

      const saved = readSavedLoop(currentVideoId);
      if (saved && typeof saved.a === 'number' && typeof saved.b === 'number') {
        pointA = saved.a;
        pointB = saved.b;
        flash('Loaded saved loop for this track');
      }
    }

    updateDisplay();
    updateSpeedUI();
    updateSaveUI();
  }

  function scanForVideo() {
    const v = activeAdapter.getMedia();
    
    if (panelEl) {
      panelEl.style.display = v ? 'block' : 'none';
    }

    if (v && v !== video) {
      attachVideo(v);
    } else if (!v && video) {
      attachVideo(null);
    } else {
      const id = getVideoId();
      if (id !== currentVideoId) {
        // Same video element reused across a client-side nav (rare) — re-check saved loop.
        currentVideoId = id;
        pointA = null;
        pointB = null;
        looping = false;
        const saved = readSavedLoop(id);
        if (saved) {
          pointA = saved.a;
          pointB = saved.b;
          updateDisplay();
        }
        updateSaveUI();
      }
    }
    syncBarOverlay();
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  document.addEventListener('keydown', (e) => {
    if (!e.shiftKey || isTypingTarget(e.target)) return;
    const key = e.key.toLowerCase();
    if (key === 'a') { setA(); e.preventDefault(); }
    else if (key === 'b') { setB(); e.preventDefault(); }
    else if (key === 'l') { toggleLoop(); e.preventDefault(); }
    else if (key === 'c') { clearLoop(); e.preventDefault(); }
    else if (key === 's') { saveCurrentLoop(); e.preventDefault(); }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'LOOPIT_FOCUS_PANEL') focusPanel();
  });

  window.addEventListener('resize', syncBarOverlay);
  window.addEventListener('scroll', syncBarOverlay, true);
  document.addEventListener('fullscreenchange', reparentForFullscreen);

  setInterval(scanForVideo, 800);
  setInterval(syncBarOverlay, 300);
  document.addEventListener('yt-navigate-finish', () => setTimeout(scanForVideo, 300));
  document.addEventListener('yt-page-data-updated', () => setTimeout(scanForVideo, 300));

  function init() {
    buildPanel();
    scanForVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
