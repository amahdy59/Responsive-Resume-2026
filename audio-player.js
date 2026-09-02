/**
 * Audio Narration Controller for Ahmed Mahdy Portfolio Resume
 * Provides accessible per-section audio narration with ElevenLabs MP3 playback
 * and instant Web Speech API fallback.
 */

(function () {
  'use strict';

  let currentAudio = null;
  let currentBtn = null;
  let currentUtterance = null;
  let currentActiveContainer = null;

  function stopAllAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    currentUtterance = null;

    if (currentBtn) {
      setButtonState(currentBtn, false);
      currentBtn = null;
    }
    if (currentActiveContainer) {
      currentActiveContainer.classList.remove('audio-reading-active');
      currentActiveContainer = null;
    }
  }

  function setButtonState(btn, isPlaying) {
    btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    const textEl = btn.querySelector('.audio-btn-text');
    const useEl = btn.querySelector('use');

    const isArabic = document.documentElement.lang === 'ar';
    if (isPlaying) {
      btn.classList.add('is-playing');
      if (textEl) textEl.textContent = isArabic ? 'إيقاف مؤقت' : 'Pause';
      btn.setAttribute('aria-label', isArabic ? 'إيقاف السرد مؤقتًا' : 'Pause narration');
      if (useEl) useEl.setAttribute('href', '#icon-pause');
    } else {
      btn.classList.remove('is-playing');
      if (textEl) textEl.textContent = isArabic ? 'استمع' : 'Listen';
      btn.setAttribute('aria-label', isArabic ? 'استمع إلى المحتوى' : 'Listen to this content');
      if (useEl) useEl.setAttribute('href', '#icon-volume');
    }
  }

  function getNarrationText(targetContainer) {
    if (!targetContainer) return '';
    const clone = targetContainer.cloneNode(true);
    const removeEls = clone.querySelectorAll('.audio-play-btn, .mockup-header, .skip-link, script, style, .sr-only');
    removeEls.forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function playNarration(btn) {
    const audioId = btn.getAttribute('data-audio-id');
    const targetSelector = btn.getAttribute('data-target-selector');
    const targetContainer = targetSelector
      ? document.querySelector(targetSelector)
      : btn.closest('.case-study-section, .panel, .case-study-hero, article, header') || btn.parentElement;

    if (currentBtn === btn) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    currentBtn = btn;
    setButtonState(btn, true);

    if (targetContainer) {
      currentActiveContainer = targetContainer;
      targetContainer.classList.add('audio-reading-active');
    }

    const audioSrc = `assets/audio/${audioId}.mp3`;

    const audio = new Audio(audioSrc);
    currentAudio = audio;
    audio.onended = stopAllAudio;
    audio.onerror = () => fallbackSpeech(targetContainer, btn);
    audio.play().catch(() => fallbackSpeech(targetContainer, btn));
  }

  function fallbackSpeech(targetContainer, btn) {
    if (!('speechSynthesis' in window)) {
      stopAllAudio();
      return;
    }

    const textToRead = getNarrationText(targetContainer);
    if (!textToRead) {
      stopAllAudio();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    const lang = document.documentElement.getAttribute('lang') || 'en';
    utterance.lang = lang.startsWith('ar') ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = function () {
      stopAllAudio();
    };

    utterance.onerror = function () {
      stopAllAudio();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function initAudioControls() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.audio-play-btn');
      if (btn) {
        e.preventDefault();
        playNarration(btn);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (currentAudio || (window.speechSynthesis && window.speechSynthesis.speaking))) {
        stopAllAudio();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioControls);
  } else {
    initAudioControls();
  }

  window.AntigravityAudio = {
    play: playNarration,
    stop: stopAllAudio
  };
})();
