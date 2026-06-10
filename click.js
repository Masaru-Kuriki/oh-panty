// クリック音（Web Audio API合成、外部ファイル不要）— AN-NEN から移植
(() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    return ctx;
  }

  function playClick() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.value = 800;
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // プレイ中の女の子グリッドは別ハンドラ（拡大ズーム演出）で処理するので除外
  const SELECTORS = [
    '.player-card',
    '.back-link',
    '.level-card',
    '.result-btn',
    '.name-input-btn'
  ];

  document.addEventListener('click', (e) => {
    for (const sel of SELECTORS) {
      if (e.target.closest(sel)) {
        playClick();
        return;
      }
    }
  });
})();
