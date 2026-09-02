/**
 * Audio Narration Controller for Ahmed Mahdy Portfolio Resume
 * Accessible per-section narration with native Web Speech API,
 * intelligent multilingual voice selection (Arabic & English),
 * and robust Play / Pause / Resume / Stop lifecycle.
 */

(function () {
  'use strict';

  let currentBtn = null;
  let currentActiveContainer = null;
  let isPaused = false;
  let currentUtterance = null;
  let cachedVoices = [];

  function loadVoices() {
    if (!('speechSynthesis' in window)) return [];
    cachedVoices = window.speechSynthesis.getVoices() || [];
    return cachedVoices;
  }

  if ('speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function getBestVoice(lang) {
    const voices = cachedVoices.length ? cachedVoices : loadVoices();
    if (!voices.length) return null;

    if (lang === 'ar') {
      return (
        voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
        voices.find(v => v.lang.startsWith('ar')) ||
        null
      );
    }

    return (
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Neural'))) ||
      voices.find(v => v.lang.startsWith('en-US')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  }

  function stopAllAudio() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    currentUtterance = null;
    isPaused = false;

    if (currentBtn) {
      setButtonState(currentBtn, false);
      currentBtn = null;
    }
    if (currentActiveContainer) {
      currentActiveContainer.classList.remove('audio-reading-active');
      currentActiveContainer = null;
    }
  }

  function pauseAudio() {
    if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isPaused = true;
      if (currentBtn) {
        setButtonState(currentBtn, false, true);
      }
    }
  }

  function resumeAudio() {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPaused = false;
      if (currentBtn) {
        setButtonState(currentBtn, true);
      }
    }
  }

  function setButtonState(btn, isPlaying, isPausedState = false) {
    const isArabic = document.documentElement.lang === 'ar';
    const textEl = btn.querySelector('.audio-btn-text');
    const useEl = btn.querySelector('use');

    if (isPlaying) {
      btn.classList.add('is-playing');
      btn.setAttribute('aria-pressed', 'true');
      if (textEl) textEl.textContent = isArabic ? 'إيقاف مؤقت' : 'Pause';
      btn.setAttribute('aria-label', isArabic ? 'إيقاف السرد مؤقتًا' : 'Pause narration');
      if (useEl) useEl.setAttribute('href', '#icon-pause');
    } else if (isPausedState) {
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-pressed', 'false');
      if (textEl) textEl.textContent = isArabic ? 'استئناف' : 'Resume';
      btn.setAttribute('aria-label', isArabic ? 'استئناف السرد' : 'Resume narration');
      if (useEl) useEl.setAttribute('href', '#icon-volume');
    } else {
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-pressed', 'false');
      if (textEl) textEl.textContent = isArabic ? 'استمع' : 'Listen';
      btn.setAttribute('aria-label', isArabic ? 'استمع إلى المحتوى' : 'Listen to this content');
      if (useEl) useEl.setAttribute('href', '#icon-volume');
    }
  }

  function getCleanNarrationText(targetContainer) {
    if (!targetContainer) return '';
    const clone = targetContainer.cloneNode(true);
    
    const removeEls = clone.querySelectorAll(
      '.audio-play-btn, .section-num, .mockup-header, .skip-link, .project-actions, .external-icon, script, style, .sr-only, .project-toggle'
    );
    removeEls.forEach(el => el.remove());

    let text = clone.textContent || '';
    text = text
      .replace(/\b0[1-6]\b/g, '')
      .replace(/•/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  function playNarration(btn) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const targetSelector = btn.getAttribute('data-target-selector');
    const targetContainer = targetSelector
      ? document.querySelector(targetSelector)
      : btn.closest('.case-study-section, .panel, .case-study-hero, article, header') || btn.parentElement;

    if (currentBtn === btn) {
      if (window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused || isPaused) {
          resumeAudio();
        } else {
          pauseAudio();
        }
        return;
      }
    }

    stopAllAudio();

    const textToRead = getCleanNarrationText(targetContainer);
    if (!textToRead) return;

    currentBtn = btn;
    setButtonState(btn, true);

    if (targetContainer) {
      currentActiveContainer = targetContainer;
      targetContainer.classList.add('audio-reading-active');
    }

    const lang = document.documentElement.getAttribute('lang') || 'en';
    const isArabic = lang.startsWith('ar');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';
    utterance.rate = isArabic ? 0.92 : 1.0;
    utterance.pitch = 1.0;

    const voice = getBestVoice(isArabic ? 'ar' : 'en');
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = function () {
      stopAllAudio();
    };

    utterance.onerror = function () {
      stopAllAudio();
    };

    window._activeUtterance = utterance;
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
      if (e.key === 'Escape' && window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
        stopAllAudio();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        pauseAudio();
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
    stop: stopAllAudio,
    pause: pauseAudio,
    resume: resumeAudio
  };
})();
