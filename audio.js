// OH!PANTY! 音声管理（AN-NEN式：unlock撤廃・play+retry-on-gesture のみ）
(() => {
  const VOICES = {
    'oh-panty': 'assets/voice_oh_panty.mp3', // 当たり/ハズレ共通「OH! PANTY!」
    'hurry':    'assets/voice_hurry.mp3'      // 長考時「早くしてよー」
  };
  const FALLBACK_MS = 3000;
  const MAX_DURATION_MS = 10000; // 安全網: 10秒で必ずcallback

  const cache = {};      // name → HTMLAudioElement
  const state = {};      // name → { cb, safetyTimer }

  function getAudio(name) {
    if (cache[name]) return cache[name];
    const src = VOICES[name];
    if (!src) return null;
    const a = new Audio(src);
    a.preload = 'auto';
    a.addEventListener('ended', () => triggerCallback(name, 1000));
    a.addEventListener('error', () => triggerCallback(name, FALLBACK_MS));
    cache[name] = a;
    state[name] = { cb: null, safetyTimer: null };
    return a;
  }

  function triggerCallback(name, delay) {
    const s = state[name];
    if (!s) return;
    if (s.safetyTimer) { clearTimeout(s.safetyTimer); s.safetyTimer = null; }
    const cb = s.cb;
    s.cb = null;
    if (cb) setTimeout(cb, delay);
  }

  function attemptPlay(name, allowRetry) {
    const a = getAudio(name);
    if (!a) { triggerCallback(name, FALLBACK_MS); return; }
    try { a.currentTime = 0; } catch (e) {}
    const p = a.play();
    if (p && p.then) {
      p.catch(() => {
        if (allowRetry) {
          const retry = () => {
            document.removeEventListener('click', retry, true);
            document.removeEventListener('touchstart', retry, true);
            attemptPlay(name, false);
          };
          document.addEventListener('click', retry, { capture: true, once: true });
          document.addEventListener('touchstart', retry, { capture: true, once: true, passive: true });
        } else {
          triggerCallback(name, FALLBACK_MS);
        }
      });
    }
  }

  function playVoice(name, onDone) {
    if (!VOICES[name]) { if (onDone) setTimeout(onDone, FALLBACK_MS); return; }
    getAudio(name); // 初期化
    const s = state[name];
    s.cb = onDone || function () {};
    if (s.safetyTimer) clearTimeout(s.safetyTimer);
    s.safetyTimer = setTimeout(() => triggerCallback(name, 0), MAX_DURATION_MS);
    attemptPlay(name, true);
  }

  window.playVoice = playVoice;
})();
