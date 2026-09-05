/** One accessible narration controller shared by the résumé and case studies. */
(function () {
  'use strict';

  const labels = {
    en: { player: 'Narration player', nowPlaying: 'Now narrating', previous: 'Previous section', next: 'Next section', pause: 'Pause', resume: 'Resume', stop: 'Close player', speed: 'Playback speed', progress: 'Narration progress', listen: 'Listen', listenCase: 'Listen to case study', playing: 'Playing', paused: 'Narration paused', stopped: 'Narration stopped', unavailable: 'Narration is unavailable' },
    ar: { player: 'مشغل السرد الصوتي', nowPlaying: 'يُروى الآن', previous: 'القسم السابق', next: 'القسم التالي', pause: 'إيقاف مؤقت', resume: 'استئناف', stop: 'إغلاق المشغل', speed: 'سرعة التشغيل', progress: 'تقدم السرد', listen: 'استمع', listenCase: 'استمع إلى دراسة الحالة', playing: 'قيد التشغيل', paused: 'تم إيقاف السرد مؤقتًا', stopped: 'تم إيقاف السرد', unavailable: 'السرد الصوتي غير متاح' },
  };
  const allowedRates = [0.75, 1, 1.25, 1.5, 2];
  const savedRate = Number(localStorage.getItem('resume-audio-rate'));
  let playbackRate = allowedRates.includes(savedRate) ? savedRate : 1;
  let currentBtn = null;
  let currentContainer = null;
  let currentUtterance = null;
  let currentMedia = null;
  let isPaused = false;
  let cachedVoices = [];
  let player;
  let liveStatus;
  let playlist = [];
  const manifest = fetch(new URL('/assets/audio/narration.json', location.origin))
    .then((response) => (response.ok ? response.json() : {}))
    .catch(() => ({}));

  const language = () => (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const copy = () => labels[language()];

  const icons = {
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8v16ZM5 19V5"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8V4Zm14 1v14"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    speed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a8 8 0 1 1 16 0M12 14l4-4"/><path d="M7 18h10"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>',
  };

  function loadVoices() {
    if (!('speechSynthesis' in window)) return [];
    cachedVoices = speechSynthesis.getVoices() || [];
    return cachedVoices;
  }

  function getBestVoice(lang) {
    const voices = cachedVoices.length ? cachedVoices : loadVoices();
    const preferred = ['Natural', 'Google', 'Premium', 'Neural'];
    return voices.find((voice) => voice.lang.startsWith(lang) && preferred.some((name) => voice.name.includes(name))) || voices.find((voice) => voice.lang.startsWith(lang)) || null;
  }

  function getContainer(button) {
    const target = button?.getAttribute('data-target-selector');
    if (button?.classList.contains('case-listen-btn')) return document.querySelector('.case-study-card');
    return (target ? document.querySelector(target) : button?.closest('.case-study-section, .panel, .case-study-hero, article, header')) || button?.parentElement;
  }

  function getTitle(button) {
    return getContainer(button)?.querySelector('h1, h2, h3')?.textContent.trim() || document.querySelector('h1')?.textContent.trim() || copy().player;
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return '--:--';
    return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
  }

  function announce(message) {
    if (liveStatus) liveStatus.textContent = message;
  }

  function updateProgress() {
    if (!player) return;
    const range = player.querySelector('[data-audio-progress]');
    const duration = currentMedia?.duration;
    const currentTime = currentMedia?.currentTime || 0;
    const seekable = Number.isFinite(duration) && duration > 0;
    range.disabled = !seekable;
    range.max = seekable ? String(duration) : '1';
    range.value = seekable ? String(currentTime) : '0';
    range.style.setProperty('--audio-progress', `${seekable ? (currentTime / duration) * 100 : 0}%`);
    player.querySelector('[data-audio-time]').textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }

  function setButtonState(button, state) {
    if (!button) return;
    const text = button.querySelector('.audio-btn-text');
    const use = button.querySelector('use');
    const idleLabel = button.classList.contains('case-listen-btn') ? copy().listenCase : copy().listen;
    const label = state === 'playing' ? copy().pause : state === 'paused' ? copy().resume : idleLabel;
    button.classList.toggle('is-playing', state === 'playing');
    button.setAttribute('aria-pressed', String(state === 'playing'));
    button.setAttribute('aria-label', `${label}: ${getTitle(button)}`);
    if (text) text.textContent = label;
    if (use) use.setAttribute('href', state === 'playing' ? '#icon-pause' : '#icon-volume');
  }

  function refreshLabels() {
    document.querySelectorAll('.audio-play-btn').forEach((button) => setButtonState(button, button === currentBtn ? (isPaused ? 'paused' : 'playing') : 'idle'));
    if (!player) return;
    player.setAttribute('aria-label', copy().player);
    player.querySelector('[data-audio-eyebrow]').textContent = copy().nowPlaying;
    for (const [selector, label] of [['[data-audio-previous]', copy().previous], ['[data-audio-next]', copy().next], ['[data-audio-stop]', copy().stop]]) {
      const control = player.querySelector(selector);
      control.setAttribute('aria-label', label);
      control.title = label;
    }
    player.querySelector('[data-audio-speed-label]').textContent = copy().speed;
    player.querySelector('[data-audio-progress]').setAttribute('aria-label', copy().progress);
    const toggle = player.querySelector('[data-audio-toggle]');
    const toggleLabel = isPaused ? copy().resume : copy().pause;
    toggle.setAttribute('aria-label', toggleLabel);
    toggle.title = toggleLabel;
    toggle.querySelector('[data-audio-toggle-icon]').innerHTML = isPaused ? icons.play : icons.pause;
    toggle.querySelector('[data-audio-toggle-label]').textContent = toggleLabel;
    if (currentBtn) player.querySelector('[data-audio-title]').textContent = getTitle(currentBtn);
  }

  function createPlayer() {
    player = document.createElement('aside');
    player.className = 'global-audio-player';
    player.hidden = true;
    player.setAttribute('role', 'region');
    player.innerHTML = `<div class="audio-player-summary"><span class="audio-player-artwork" aria-hidden="true">${icons.volume}</span><span class="audio-player-copy"><span class="audio-player-eyebrow" data-audio-eyebrow></span><strong data-audio-title></strong></span><span class="audio-player-time" data-audio-time>0:00 / --:--</span></div><div class="audio-player-track"><input class="audio-player-progress" data-audio-progress type="range" min="0" max="1" value="0" step="0.1" disabled></div><div class="audio-player-controls"><div class="audio-player-transport"><button class="audio-control audio-control-icon" type="button" data-audio-previous>${icons.previous}</button><button class="audio-control audio-control-primary" type="button" data-audio-toggle><span data-audio-toggle-icon>${icons.pause}</span><span data-audio-toggle-label></span></button><button class="audio-control audio-control-icon" type="button" data-audio-next>${icons.next}</button></div><label class="audio-player-speed"><span class="audio-speed-label">${icons.speed}<span data-audio-speed-label></span></span><span class="audio-select-shell"><select data-audio-speed>${allowedRates.map((rate) => `<option value="${rate}">${rate}×</option>`).join('')}</select>${icons.chevron}</span></label><button class="audio-control audio-control-icon audio-control-close" type="button" data-audio-stop>${icons.close}</button></div>`;
    document.body.append(player);
    liveStatus = document.createElement('p');
    liveStatus.className = 'sr-only audio-live-status';
    liveStatus.setAttribute('aria-live', 'polite');
    document.body.append(liveStatus);
    player.querySelector('[data-audio-speed]').value = String(playbackRate);
    player.querySelector('[data-audio-toggle]').addEventListener('click', () => (isPaused ? resumeAudio() : pauseAudio()));
    player.querySelector('[data-audio-stop]').addEventListener('click', () => stopAllAudio(true));
    player.querySelector('[data-audio-previous]').addEventListener('click', () => {
      const index = playlist.indexOf(currentBtn);
      if (index > 0) playNarration(playlist[index - 1]);
    });
    player.querySelector('[data-audio-next]').addEventListener('click', () => {
      const index = playlist.indexOf(currentBtn);
      if (index >= 0 && index < playlist.length - 1) playNarration(playlist[index + 1]);
    });
    player.querySelector('[data-audio-speed]').addEventListener('change', (event) => {
      playbackRate = Number(event.target.value);
      localStorage.setItem('resume-audio-rate', String(playbackRate));
      if (currentMedia) currentMedia.playbackRate = playbackRate;
    });
    player.querySelector('[data-audio-progress]').addEventListener('input', (event) => {
      if (currentMedia && Number.isFinite(currentMedia.duration)) currentMedia.currentTime = Number(event.target.value);
    });
    refreshLabels();
  }

  function showPlayer() {
    const index = playlist.indexOf(currentBtn);
    player.hidden = false;
    document.body.classList.add('has-audio-player');
    player.querySelector('[data-audio-title]').textContent = getTitle(currentBtn);
    player.querySelector('[data-audio-previous]').disabled = index <= 0;
    player.querySelector('[data-audio-next]').disabled = index < 0 || index >= playlist.length - 1;
    updateProgress();
    refreshLabels();
  }

  function clearSources() {
    if (currentMedia) {
      currentMedia.pause();
      currentMedia.currentTime = 0;
      currentMedia = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    currentUtterance = null;
    isPaused = false;
  }

  function stopAllAudio(shouldAnnounce = false) {
    clearSources();
    setButtonState(currentBtn, 'idle');
    currentBtn = null;
    currentContainer?.classList.remove('audio-reading-active');
    currentContainer = null;
    player.hidden = true;
    document.body.classList.remove('has-audio-player');
    if (shouldAnnounce) announce(copy().stopped);
  }

  function pauseAudio() {
    if (currentMedia && !currentMedia.paused) currentMedia.pause();
    else if ('speechSynthesis' in window && speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.pause();
    else return;
    isPaused = true;
    setButtonState(currentBtn, 'paused');
    refreshLabels();
    announce(copy().paused);
  }

  function resumeAudio() {
    if (currentMedia?.paused) currentMedia.play().catch(() => stopAllAudio());
    else if ('speechSynthesis' in window && speechSynthesis.paused) speechSynthesis.resume();
    else return;
    isPaused = false;
    setButtonState(currentBtn, 'playing');
    refreshLabels();
    announce(`${copy().playing}: ${getTitle(currentBtn)}`);
  }

  function narrationText(container) {
    if (!container) return '';
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.audio-play-btn, .section-num, .mockup-header, .skip-link, .project-actions, .external-icon, script, style, .sr-only, .project-toggle').forEach((element) => element.remove());
    return (clone.textContent || '').replace(/\b0[1-6]\b/g, '').replace(/•/g, ', ').replace(/\s+/g, ' ').trim();
  }

  function startSpeech(text, lang) {
    currentMedia = null;
    updateProgress();
    if (!('speechSynthesis' in window)) {
      stopAllAudio();
      announce(copy().unavailable);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = playbackRate * (lang === 'ar' ? 0.92 : 1);
    utterance.voice = getBestVoice(lang);
    utterance.onend = () => currentUtterance === utterance && stopAllAudio();
    utterance.onerror = () => currentUtterance === utterance && stopAllAudio();
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  async function playNarration(button) {
    if (currentBtn === button) {
      if (isPaused) resumeAudio(); else pauseAudio();
      return;
    }
    clearSources();
    setButtonState(currentBtn, 'idle');
    currentContainer?.classList.remove('audio-reading-active');
    const container = getContainer(button);
    const text = narrationText(container);
    if (!text) return;
    currentBtn = button;
    currentContainer = container;
    container?.classList.add('audio-reading-active');
    setButtonState(button, 'playing');
    showPlayer();
    announce(`${copy().playing}: ${getTitle(button)}`);

    const lang = language();
    const recording = (await manifest)[`${lang}/${button.dataset.audioId}`];
    if (recording?.url) {
      const media = new Audio(recording.url);
      currentMedia = media;
      media.preload = 'metadata';
      media.playbackRate = playbackRate;
      media.ontimeupdate = updateProgress;
      media.onloadedmetadata = updateProgress;
      media.onended = () => currentMedia === media && stopAllAudio();
      media.onerror = () => currentMedia === media && startSpeech(text, lang);
      try { await media.play(); return; } catch { if (currentMedia === media) currentMedia = null; }
    }
    startSpeech(text, lang);
  }

  function init() {
    playlist = [...document.querySelectorAll('.audio-play-btn')];
    createPlayer();
    if ('speechSynthesis' in window) {
      loadVoices();
      speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    }
    document.addEventListener('click', (event) => {
      const button = event.target.closest('.audio-play-btn');
      if (button) { event.preventDefault(); playNarration(button); }
    });
    document.addEventListener('keydown', (event) => event.key === 'Escape' && currentBtn && stopAllAudio(true));
    document.addEventListener('visibilitychange', () => document.hidden && currentBtn && !isPaused && pauseAudio());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.AntigravityAudio = { play: playNarration, stop: stopAllAudio, pause: pauseAudio, resume: resumeAudio, refreshLabels };
})();
