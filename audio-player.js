/** One accessible narration controller shared by the résumé and case studies. */
(() => {
  const labels = {
    en: {
      player: "Narration player",
      nowPlaying: "Now narrating",
      section: "Section",
      of: "of",
      previous: "Previous section",
      next: "Next section",
      pause: "Pause",
      resume: "Resume",
      stop: "Close player",
      mute: "Mute",
      unmute: "Unmute",
      volume: "Volume",
      muted: "Audio muted",
      unmuted: "Audio unmuted",
      expand: "Show more audio controls",
      collapse: "Show fewer audio controls",
      transcript: "Transcript",
      hideTranscript: "Hide transcript",
      transcriptHeading: "Narration transcript",
      retry: "Retry narration",
      buffering: "Buffering narration…",
      error: "Narration could not be played",
      speed: "Playback speed",
      progress: "Narration progress",
      listen: "Listen",
      listenCase: "Listen to case study",
      playing: "Playing",
      loading: "Loading narration…",
      paused: "Narration paused",
      stopped: "Narration stopped",
      unavailable: "Narration is unavailable",
    },
    ar: {
      player: "مشغل السرد الصوتي",
      nowPlaying: "يُروى الآن",
      section: "القسم",
      of: "من",
      previous: "القسم السابق",
      next: "القسم التالي",
      pause: "إيقاف مؤقت",
      resume: "استئناف",
      stop: "إغلاق المشغل",
      mute: "كتم الصوت",
      unmute: "إلغاء كتم الصوت",
      volume: "مستوى الصوت",
      muted: "تم كتم الصوت",
      unmuted: "تم إلغاء كتم الصوت",
      expand: "إظهار المزيد من عناصر التحكم الصوتي",
      collapse: "إظهار عناصر تحكم صوتي أقل",
      transcript: "النص المقروء",
      hideTranscript: "إخفاء النص المقروء",
      transcriptHeading: "نص السرد الصوتي",
      retry: "إعادة محاولة تشغيل السرد",
      buffering: "جارٍ تخزين السرد مؤقتًا…",
      error: "تعذر تشغيل السرد الصوتي",
      speed: "سرعة التشغيل",
      progress: "تقدم السرد",
      listen: "استمع",
      listenCase: "استمع إلى دراسة الحالة",
      playing: "قيد التشغيل",
      loading: "جارٍ تحميل السرد…",
      paused: "تم إيقاف السرد مؤقتًا",
      stopped: "تم إيقاف السرد",
      unavailable: "السرد الصوتي غير متاح",
    },
  };
  const allowedRates = [0.75, 1, 1.25, 1.5, 2];
  const savedRate = Number(window.resumePreferences.get("resume-audio-rate"));
  let playbackRate = allowedRates.includes(savedRate) ? savedRate : 1;
  const storedVolume = window.resumePreferences.get("resume-audio-volume");
  const savedVolume = Number(storedVolume);
  let playbackVolume =
    storedVolume !== null &&
    Number.isFinite(savedVolume) &&
    savedVolume >= 0 &&
    savedVolume <= 1
      ? savedVolume
      : 1;
  let isMuted = window.resumePreferences.get("resume-audio-muted") === "true";
  let currentBtn = null;
  let currentContainer = null;
  let currentUtterance = null;
  let currentMedia = null;
  let playbackRequest = 0;
  let isPaused = false;
  let cachedVoices = [];
  let player;
  let liveStatus;
  let playlist = [];
  let manifest;
  let transcriptOpen = false;
  let currentTranscript = "";
  let isExpanded = true;
  let mediaSessionReady = false;
  const mobilePlayer = window.matchMedia("(max-width: 560px)");
  const loadManifest = (reload = false) => {
    if (reload) manifest = undefined;
    return (manifest ??= fetch(
      new URL("/assets/audio/narration.json", location.origin),
      { signal: AbortSignal.timeout(8000) },
    )
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({})));
  };

  const language = () => (document.documentElement.lang === "ar" ? "ar" : "en");
  const copy = () => labels[language()];

  const icons = {
    volume:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    volumeMuted:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 5M21 9l-5 5"/></svg>',
    previous:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8v16ZM5 19V5"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8V4Zm14 1v14"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    speed:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a8 8 0 1 1 16 0M12 14l4-4"/><path d="M7 18h10"/></svg>',
    chevron:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>',
    transcript:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
    retry:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></svg>',
  };

  function loadVoices() {
    if (!("speechSynthesis" in window)) return [];
    cachedVoices = speechSynthesis.getVoices() || [];
    return cachedVoices;
  }

  function getBestVoice(lang) {
    const voices = cachedVoices.length ? cachedVoices : loadVoices();
    const preferred = ["Natural", "Google", "Premium", "Neural"];
    return (
      voices.find(
        (voice) =>
          voice.lang.startsWith(lang) &&
          preferred.some((name) => voice.name.includes(name)),
      ) ||
      voices.find((voice) => voice.lang.startsWith(lang)) ||
      null
    );
  }

  function getContainer(button) {
    const target = button?.getAttribute("data-target-selector");
    if (button?.classList.contains("case-listen-btn"))
      return document.querySelector(".case-study-card");
    return (
      (target
        ? document.querySelector(target)
        : button?.closest(
            ".case-study-section, .panel, .case-study-hero, article, header",
          )) || button?.parentElement
    );
  }

  function getTitle(button) {
    return (
      getContainer(button)?.querySelector("h1, h2, h3")?.textContent.trim() ||
      document.querySelector("h1")?.textContent.trim() ||
      copy().player
    );
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return "--:--";
    return `${Math.floor(value / 60)}:${Math.floor(value % 60)
      .toString()
      .padStart(2, "0")}`;
  }

  function announce(message) {
    if (liveStatus) liveStatus.textContent = message;
  }

  function updateVolume() {
    if (!player) return;
    if (currentMedia) {
      currentMedia.volume = playbackVolume;
      currentMedia.muted = isMuted;
    }
    if (currentUtterance)
      currentUtterance.volume = isMuted ? 0 : playbackVolume;
    const mute = player.querySelector("[data-audio-mute]");
    const label = isMuted ? copy().unmute : copy().mute;
    mute.setAttribute("aria-label", label);
    mute.setAttribute("aria-pressed", String(isMuted));
    mute.setAttribute("data-tooltip", label);
    mute.title = label;
    mute.innerHTML = isMuted ? icons.volumeMuted : icons.volume;
    const volume = player.querySelector("[data-audio-volume]");
    volume.value = String(playbackVolume);
    volume.setAttribute("aria-label", copy().volume);
    volume.setAttribute(
      "aria-valuetext",
      `${Math.round(playbackVolume * 100)}%`,
    );
    volume.style.setProperty("--audio-volume", `${playbackVolume * 100}%`);
  }

  function updateProgress() {
    if (!player) return;
    const range = player.querySelector("[data-audio-progress]");
    const duration = currentMedia?.duration;
    const currentTime = currentMedia?.currentTime || 0;
    const seekable = Number.isFinite(duration) && duration > 0;
    range.disabled = !seekable;
    range.max = seekable ? String(duration) : "1";
    range.value = seekable ? String(currentTime) : "0";
    range.style.setProperty(
      "--audio-progress",
      `${seekable ? (currentTime / duration) * 100 : 0}%`,
    );
    player.querySelector("[data-audio-elapsed]").textContent =
      formatTime(currentTime);
    player.querySelector("[data-audio-duration]").textContent =
      formatTime(duration);
    range.setAttribute(
      "aria-valuetext",
      `${formatTime(currentTime)} ${copy().of} ${formatTime(duration)}`,
    );
    if (
      seekable &&
      "mediaSession" in navigator &&
      typeof navigator.mediaSession.setPositionState === "function"
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate,
          position: Math.min(currentTime, duration),
        });
      } catch {
        // Position reporting is optional and browser support varies.
      }
    }
  }

  function updatePosition() {
    if (!player) return;
    const index = playlist.indexOf(currentBtn);
    player.querySelector("[data-audio-position]").textContent =
      index >= 0
        ? `${copy().section} ${index + 1} ${copy().of} ${playlist.length}`
        : "";
  }

  function setExpanded(expanded) {
    if (!player) return;
    isExpanded = !mobilePlayer.matches || expanded;
    const toggle = player.querySelector("[data-audio-expand]");
    toggle.hidden = !mobilePlayer.matches;
    toggle.setAttribute("aria-expanded", String(isExpanded));
    const label = isExpanded ? copy().collapse : copy().expand;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("data-tooltip", label);
    toggle.title = label;
    player.dataset.expanded = String(isExpanded);
    document.body.classList.toggle(
      "audio-player-compact",
      mobilePlayer.matches && !isExpanded,
    );
    for (const control of player.querySelectorAll("[data-audio-advanced]"))
      control.hidden = !isExpanded;
    player.querySelector("[data-audio-transcript]").hidden =
      !isExpanded || !transcriptOpen;
  }

  function setTranscript(open) {
    transcriptOpen = open;
    const toggle = player.querySelector("[data-audio-transcript-toggle]");
    const label = open ? copy().hideTranscript : copy().transcript;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("data-tooltip", label);
    toggle.title = label;
    toggle.querySelector("[data-audio-transcript-label]").textContent = label;
    player.querySelector("[data-audio-transcript-heading]").textContent =
      copy().transcriptHeading;
    player.querySelector("[data-audio-transcript-copy]").textContent =
      currentTranscript;
    player.querySelector("[data-audio-transcript]").hidden =
      !isExpanded || !open;
  }

  function updateMediaSession(state) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState =
        state === "playing"
          ? "playing"
          : state === "paused"
            ? "paused"
            : "none";
      if (currentBtn && "MediaMetadata" in window)
        navigator.mediaSession.metadata = new MediaMetadata({
          title: getTitle(currentBtn),
          artist: "Ahmed Mahdy",
          album: copy().player,
        });
    } catch {
      // Media Session is optional and may be only partially implemented.
    }
  }

  function initMediaSession() {
    if (mediaSessionReady || !("mediaSession" in navigator)) return;
    mediaSessionReady = true;
    const actions = {
      play: resumeAudio,
      pause: pauseAudio,
      stop: () => stopAllAudio(true),
      previoustrack: () => {
        const index = playlist.indexOf(currentBtn);
        if (index > 0) playNarration(playlist[index - 1]);
      },
      nexttrack: () => {
        const index = playlist.indexOf(currentBtn);
        if (index >= 0 && index < playlist.length - 1)
          playNarration(playlist[index + 1]);
      },
      seekto: ({ seekTime }) => {
        if (currentMedia && Number.isFinite(seekTime))
          currentMedia.currentTime = Math.min(
            Math.max(seekTime, 0),
            currentMedia.duration || seekTime,
          );
      },
    };
    for (const [action, handler] of Object.entries(actions)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Unsupported Media Session actions are optional enhancements.
      }
    }
  }

  function setPlayerState(state) {
    if (!player) return;
    player.dataset.state = state;
    const busy = state === "loading" || state === "buffering";
    player.setAttribute("aria-busy", String(busy));
    player.querySelector("[data-audio-toggle]").disabled =
      state === "loading" || state === "error";
    player.querySelector("[data-audio-retry]").hidden = state !== "error";
    player.querySelector("[data-audio-eyebrow]").textContent =
      state === "loading"
        ? copy().loading
        : state === "buffering"
          ? copy().buffering
          : state === "error"
            ? copy().error
            : copy().nowPlaying;
    updateMediaSession(state);
  }

  function setButtonState(button, state) {
    if (!button) return;
    const text = button.querySelector(".audio-btn-text");
    const use = button.querySelector("use");
    const idleLabel = button.classList.contains("case-listen-btn")
      ? copy().listenCase
      : copy().listen;
    const label =
      state === "playing"
        ? copy().pause
        : state === "paused"
          ? copy().resume
          : idleLabel;
    button.classList.toggle("is-playing", state === "playing");
    button.setAttribute("aria-pressed", String(state === "playing"));
    button.setAttribute("aria-label", `${label}: ${getTitle(button)}`);
    if (text) text.textContent = label;
    if (use)
      use.setAttribute(
        "href",
        state === "playing" ? "#icon-pause" : "#icon-volume",
      );
  }

  function refreshLabels() {
    document
      .querySelectorAll(".audio-play-btn")
      .forEach((button) =>
        setButtonState(
          button,
          button === currentBtn ? (isPaused ? "paused" : "playing") : "idle",
        ),
      );
    if (!player) return;
    player.setAttribute("aria-label", copy().player);
    updatePosition();
    for (const [selector, label] of [
      ["[data-audio-previous]", copy().previous],
      ["[data-audio-next]", copy().next],
      ["[data-audio-stop]", copy().stop],
      ["[data-audio-retry]", copy().retry],
    ]) {
      const control = player.querySelector(selector);
      control.setAttribute("aria-label", label);
      control.setAttribute("data-tooltip", label);
      control.title = label;
    }
    player.querySelector("[data-audio-speed-label]").textContent = copy().speed;
    player
      .querySelector("[data-audio-speed]")
      ?.dispatchEvent(new Event("selectoptionschange"));
    player
      .querySelector("[data-audio-progress]")
      .setAttribute("aria-label", copy().progress);
    updateVolume();
    const toggle = player.querySelector("[data-audio-toggle]");
    const toggleLabel = isPaused ? copy().resume : copy().pause;
    toggle.setAttribute("aria-label", toggleLabel);
    toggle.setAttribute("data-tooltip", toggleLabel);
    toggle.title = toggleLabel;
    toggle.querySelector("[data-audio-toggle-icon]").innerHTML = isPaused
      ? icons.play
      : icons.pause;
    toggle.querySelector("[data-audio-toggle-label]").textContent = toggleLabel;
    setExpanded(isExpanded);
    if (currentContainer) currentTranscript = narrationText(currentContainer);
    setTranscript(transcriptOpen);
    setPlayerState(player.dataset.state || "idle");
    if (currentBtn)
      player.querySelector("[data-audio-title]").textContent =
        getTitle(currentBtn);
  }

  function createPlayer() {
    player = document.createElement("aside");
    player.className = "global-audio-player";
    player.hidden = true;
    player.setAttribute("role", "region");
    player.innerHTML = `<div class="audio-player-summary"><span class="audio-player-artwork" aria-hidden="true">${icons.volume}</span><span class="audio-player-copy"><span class="audio-player-eyebrow"><span data-audio-eyebrow></span><span aria-hidden="true"> · </span><span data-audio-position></span></span><strong data-audio-title></strong></span><button class="audio-control audio-control-icon audio-expand-toggle" type="button" data-audio-expand aria-controls="audio-player-track audio-player-settings audio-player-transcript">${icons.chevron}</button><button class="audio-control audio-control-icon audio-control-close" type="button" data-audio-stop>${icons.close}</button></div><div class="audio-player-track" id="audio-player-track" data-audio-advanced><span class="audio-player-time" data-audio-elapsed>0:00</span><input class="audio-player-progress" data-audio-progress type="range" min="0" max="1" value="0" step="0.1" disabled><span class="audio-player-time" data-audio-duration>--:--</span></div><div class="audio-player-controls"><div class="audio-player-transport"><button class="audio-control audio-control-icon" type="button" data-audio-previous>${icons.previous}</button><button class="audio-control audio-control-primary" type="button" data-audio-toggle><span data-audio-toggle-icon>${icons.pause}</span><span data-audio-toggle-label></span></button><button class="audio-control audio-control-icon audio-retry" type="button" data-audio-retry hidden>${icons.retry}</button><button class="audio-control audio-control-icon" type="button" data-audio-next>${icons.next}</button><button class="audio-control audio-control-icon" type="button" data-audio-mute></button></div><div class="audio-player-settings" id="audio-player-settings" data-audio-advanced><input class="audio-volume-range" data-audio-volume type="range" min="0" max="1" value="${playbackVolume}" step="0.05"><label class="audio-player-speed"><span class="audio-speed-label">${icons.speed}<span data-audio-speed-label></span></span><span class="audio-select-shell"><select data-audio-speed>${allowedRates.map((rate) => `<option value="${rate}">${rate}×</option>`).join("")}</select></span></label><button class="audio-control audio-transcript-toggle" type="button" data-audio-transcript-toggle aria-controls="audio-player-transcript">${icons.transcript}<span data-audio-transcript-label></span></button></div></div><section class="audio-player-transcript" id="audio-player-transcript" data-audio-transcript data-audio-advanced hidden><strong data-audio-transcript-heading></strong><p data-audio-transcript-copy></p></section>`;
    document.body.append(player);
    liveStatus = document.createElement("p");
    liveStatus.className = "sr-only audio-live-status";
    liveStatus.setAttribute("aria-live", "polite");
    document.body.append(liveStatus);
    player.querySelector("[data-audio-speed]").value = String(playbackRate);
    window.enhanceSelect?.(player.querySelector("[data-audio-speed]"));
    isExpanded = !mobilePlayer.matches;
    player
      .querySelector("[data-audio-expand]")
      .addEventListener("click", () => setExpanded(!isExpanded));
    player
      .querySelector("[data-audio-transcript-toggle]")
      .addEventListener("click", () => setTranscript(!transcriptOpen));
    player
      .querySelector("[data-audio-retry]")
      .addEventListener(
        "click",
        () => currentBtn && playNarration(currentBtn, true),
      );
    player.querySelector("[data-audio-mute]").addEventListener("click", () => {
      if (isMuted && playbackVolume === 0) playbackVolume = 1;
      isMuted = !isMuted;
      window.resumePreferences.set(
        "resume-audio-volume",
        String(playbackVolume),
      );
      window.resumePreferences.set("resume-audio-muted", String(isMuted));
      updateVolume();
      announce(isMuted ? copy().muted : copy().unmuted);
    });
    player
      .querySelector("[data-audio-volume]")
      .addEventListener("input", (event) => {
        playbackVolume = Number(event.target.value);
        isMuted = playbackVolume === 0;
        window.resumePreferences.set(
          "resume-audio-volume",
          String(playbackVolume),
        );
        window.resumePreferences.set("resume-audio-muted", String(isMuted));
        updateVolume();
      });
    player
      .querySelector("[data-audio-toggle]")
      .addEventListener("click", () =>
        isPaused ? resumeAudio() : pauseAudio(),
      );
    player
      .querySelector("[data-audio-stop]")
      .addEventListener("click", () => stopAllAudio(true));
    player
      .querySelector("[data-audio-previous]")
      .addEventListener("click", () => {
        const index = playlist.indexOf(currentBtn);
        if (index > 0) playNarration(playlist[index - 1]);
      });
    player.querySelector("[data-audio-next]").addEventListener("click", () => {
      const index = playlist.indexOf(currentBtn);
      if (index >= 0 && index < playlist.length - 1)
        playNarration(playlist[index + 1]);
    });
    player
      .querySelector("[data-audio-speed]")
      .addEventListener("change", (event) => {
        playbackRate = Number(event.target.value);
        window.resumePreferences.set("resume-audio-rate", String(playbackRate));
        if (currentMedia) currentMedia.playbackRate = playbackRate;
      });
    player
      .querySelector("[data-audio-progress]")
      .addEventListener("input", (event) => {
        if (currentMedia && Number.isFinite(currentMedia.duration))
          currentMedia.currentTime = Number(event.target.value);
      });
    refreshLabels();
  }

  function showPlayer() {
    const index = playlist.indexOf(currentBtn);
    player.hidden = false;
    setPlayerState("loading");
    document.body.classList.add("has-audio-player");
    player.querySelector("[data-audio-title]").textContent =
      getTitle(currentBtn);
    player.querySelector("[data-audio-previous]").disabled = index <= 0;
    player.querySelector("[data-audio-next]").disabled =
      index < 0 || index >= playlist.length - 1;
    updateProgress();
    refreshLabels();
  }

  function showPlaybackError() {
    clearSources();
    currentContainer?.classList.remove("audio-reading-active");
    setButtonState(currentBtn, "idle");
    setPlayerState("error");
    announce(copy().error);
  }

  function clearSources() {
    playbackRequest++;
    if (currentMedia) {
      currentMedia.pause();
      currentMedia.currentTime = 0;
      currentMedia = null;
    }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    currentUtterance = null;
    isPaused = false;
  }

  function stopAllAudio(shouldAnnounce = false) {
    const restoreFocus = player?.contains(document.activeElement)
      ? currentBtn
      : null;
    clearSources();
    setButtonState(currentBtn, "idle");
    currentBtn = null;
    currentContainer?.classList.remove("audio-reading-active");
    currentContainer = null;
    currentTranscript = "";
    transcriptOpen = false;
    player.hidden = true;
    setPlayerState("idle");
    document.body.classList.remove("has-audio-player");
    document.body.classList.remove("audio-player-compact");
    if (shouldAnnounce) announce(copy().stopped);
    restoreFocus?.focus({ preventScroll: true });
  }

  function pauseAudio() {
    if (currentMedia && !currentMedia.paused) currentMedia.pause();
    else if (
      "speechSynthesis" in window &&
      speechSynthesis.speaking &&
      !speechSynthesis.paused
    )
      speechSynthesis.pause();
    else return;
    isPaused = true;
    setPlayerState("paused");
    setButtonState(currentBtn, "paused");
    refreshLabels();
    announce(copy().paused);
  }

  function resumeAudio() {
    if (currentMedia?.paused) currentMedia.play().catch(() => stopAllAudio());
    else if ("speechSynthesis" in window && speechSynthesis.paused)
      speechSynthesis.resume();
    else return;
    isPaused = false;
    setPlayerState("playing");
    setButtonState(currentBtn, "playing");
    refreshLabels();
    announce(`${copy().playing}: ${getTitle(currentBtn)}`);
  }

  function narrationText(container) {
    if (!container) return "";
    const clone = container.cloneNode(true);
    clone
      .querySelectorAll(
        ".audio-play-btn, .section-num, .mockup-header, .skip-link, .project-actions, .external-icon, script, style, .sr-only, .project-toggle",
      )
      .forEach((element) => element.remove());
    return (clone.textContent || "")
      .replace(/\b0[1-6]\b/g, "")
      .replace(/•/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function startSpeech(text, lang) {
    currentMedia = null;
    updateProgress();
    if (!("speechSynthesis" in window)) {
      showPlaybackError();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
    utterance.rate = playbackRate * (lang === "ar" ? 0.92 : 1);
    utterance.volume = isMuted ? 0 : playbackVolume;
    utterance.voice = getBestVoice(lang);
    utterance.onend = () => currentUtterance === utterance && stopAllAudio();
    utterance.onerror = () => {
      if (currentUtterance !== utterance) return;
      showPlaybackError();
    };
    currentUtterance = utterance;
    setPlayerState("playing");
    speechSynthesis.speak(utterance);
  }

  async function playNarration(button, restart = false) {
    if (currentBtn === button && !restart) {
      if (isPaused) resumeAudio();
      else pauseAudio();
      return;
    }
    clearSources();
    const request = playbackRequest;
    setButtonState(currentBtn, "idle");
    currentContainer?.classList.remove("audio-reading-active");
    const container = getContainer(button);
    const text = narrationText(container);
    if (!text) return;
    currentBtn = button;
    currentContainer = container;
    currentTranscript = text;
    container?.classList.add("audio-reading-active");
    setButtonState(button, "playing");
    showPlayer();
    announce(`${copy().loading}: ${getTitle(button)}`);

    const lang = language();
    initMediaSession();
    const recording = (await loadManifest(restart))[
      `${lang}/${button.dataset.audioId}`
    ];
    if (request !== playbackRequest || currentBtn !== button) return;
    if (recording?.url) {
      const media = new Audio(recording.url);
      currentMedia = media;
      media.preload = "metadata";
      media.playbackRate = playbackRate;
      media.volume = playbackVolume;
      media.muted = isMuted;
      media.ontimeupdate = updateProgress;
      media.onloadedmetadata = updateProgress;
      media.onplaying = () =>
        currentMedia === media && setPlayerState("playing");
      media.onwaiting = () =>
        currentMedia === media && setPlayerState("buffering");
      media.onended = () => currentMedia === media && stopAllAudio();
      media.onerror = () => currentMedia === media && startSpeech(text, lang);
      try {
        await media.play();
        return;
      } catch {
        if (request !== playbackRequest || currentBtn !== button) return;
        if (currentMedia === media) currentMedia = null;
      }
    }
    startSpeech(text, lang);
  }

  function init() {
    playlist = [...document.querySelectorAll(".audio-play-btn")];
    createPlayer();
    if ("speechSynthesis" in window) {
      loadVoices();
      speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    }
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".audio-play-btn");
      if (button) {
        event.preventDefault();
        playNarration(button);
      }
    });
    document.addEventListener(
      "keydown",
      (event) => event.key === "Escape" && currentBtn && stopAllAudio(true),
    );
    document.addEventListener(
      "visibilitychange",
      () => document.hidden && currentBtn && !isPaused && pauseAudio(),
    );
    mobilePlayer.addEventListener?.("change", ({ matches }) =>
      setExpanded(!matches),
    );
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  window.AntigravityAudio = {
    play: playNarration,
    stop: stopAllAudio,
    pause: pauseAudio,
    resume: resumeAudio,
    refreshLabels,
  };
})();
