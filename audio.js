// OH!PANTY! 音声管理（iOS自動再生制約対応 + 複数ボイス対応）
// AN-NEN の audio.js をベースに、複数の音声ファイルを扱えるよう拡張
(() => {
  const VOICES = {
    'oh-panty': 'assets/voice_oh_panty.mp3',      // ハズレ＋当たり共通の「OH! PANTY!」
    'hurry':    'assets/voice_hurry.mp3'           // 長考時「早くしてよー」
  };
  const FALLBACK_MS = 3000;

  const cache = {}; // name → HTMLAudioElement
  let unlocked = false;

  function getAudio(name) {
    if (cache[name]) return cache[name];
    const src = VOICES[name];
    if (!src) return null;
    const a = new Audio(src);
    a.preload = 'auto';
    cache[name] = a;
    return a;
  }

  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;
    // すべての音声ファイルをmute状態で1度play→停止することでiOS側のロック解除を促す
    Object.keys(VOICES).forEach(name => {
      const a = getAudio(name);
      if (!a) return;
      const prevMuted = a.muted;
      const prevVolume = a.volume;
      a.muted = true;
      a.volume = 0;
      const p = a.play();
      const cleanup = () => {
        try { a.pause(); } catch (e) {}
        a.currentTime = 0;
        a.muted = prevMuted;
        a.volume = prevVolume;
      };
      if (p && p.then) p.then(cleanup).catch(() => {
        a.muted = prevMuted;
        a.volume = prevVolume;
      });
      else cleanup();
    });
  }

  // name の音声を再生して、終了+1秒で onDone を呼ぶ
  function playVoice(name, onDone) {
    const a = getAudio(name);
    const cb = onDone || function () {};
    if (!a) { setTimeout(cb, FALLBACK_MS); return; }

    const onEnded = () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      setTimeout(cb, 1000);
    };
    const onError = () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      setTimeout(cb, FALLBACK_MS);
    };
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);

    try { a.currentTime = 0; } catch (e) {}
    const p = a.play();
    if (p && p.then) {
      p.catch(() => {
        // 自動再生ブロック → 次のユーザー操作で再試行
        const retry = () => {
          document.removeEventListener('click', retry, true);
          document.removeEventListener('touchstart', retry, true);
          a.play().catch(() => onError());
        };
        document.addEventListener('click', retry, { capture: true, once: true });
        document.addEventListener('touchstart', retry, { capture: true, once: true, passive: true });
      });
    }
  }

  window.playVoice = playVoice;

  document.addEventListener('click', unlockAudio, { capture: true });
  document.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
})();
