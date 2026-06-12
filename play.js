// OH!PANTY! ゲーム本体（PEEK→DOWN→SHUFFLE→TAP→REVEAL）
(() => {
  const COLORS = window.COLORS || [];

  // ===== DOM =====
  const girlsEl       = document.getElementById('girls');
  const questChip     = document.getElementById('questChip');
  const questName     = document.getElementById('questName');
  const qCurrentEl    = document.getElementById('qCurrent');
  const qTotalEl      = document.getElementById('qTotal');
  const livesEl       = document.getElementById('lives');
  const revealOverlay = document.getElementById('revealOverlay');
  const revealImgUp   = document.getElementById('revealImgUp');
  const revealResult  = document.getElementById('revealResult');

  // ===== 設定 =====
  const INITIAL_LIVES = 3;
  const TEASE_DELAY_MS = 5000;
  const REVEAL_HOLD_MS = 3000;
  const PEEK_DOWN_TRANSITION_MS = 350;

  // レベル別: 問題数 と 「問題i での人数」
  const LEVELS = {
    1: { total: 5,  countAt: (i) => Math.min(2  + (i - 1), 6)  }, // 2..6
    2: { total: 7,  countAt: (i) => Math.min(5  + (i - 1), 11) }, // 5..11
    3: { total: 22, countAt: (i) => Math.min(30 + (i - 1), 51) }  // 30..51
  };

  // 難易度カーブ（問題進むほど厳しく）
  function peekMs(lv, q) {
    if (lv === 1) return Math.max(2200, 3000 - (q - 1) * 200);
    if (lv === 2) return Math.max(1500, 2200 - (q - 1) * 120);
    return Math.max(800, 1500 - (q - 1) * 35);
  }
  function shuffleCount(lv, q) {
    if (lv === 1) return Math.min(5,  3 + Math.floor((q - 1) * 0.5));
    if (lv === 2) return Math.min(10, 6 + Math.floor((q - 1) * 0.7));
    return Math.min(22, 12 + Math.floor((q - 1) * 0.5));
  }
  function swapMs(lv, q) {
    if (lv === 1) return Math.max(300, 360 - (q - 1) * 12);
    if (lv === 2) return Math.max(240, 310 - (q - 1) * 10);
    return Math.max(170, 240 - (q - 1) * 4);
  }

  // ===== URLパラメータ =====
  const params = new URLSearchParams(window.location.search);
  const level = parseInt(params.get('level') || '1', 10);
  const config = LEVELS[level] || LEVELS[1];
  const totalQuestions = config.total;

  // ===== プレイヤー =====
  const player = (window.Players && window.Players.getCurrent()) || null;

  // ===== ゲーム状態 =====
  let currentQuestion = 1;
  let lives = INITIAL_LIVES;
  let score = 0;
  let teaseTimer = null;
  let teasing = false;
  let busy = false; // peek/shuffle/reveal中はタップ無効
  let answerColorId = -1;

  // ===== UI更新 =====
  function renderProgress() {
    qCurrentEl.textContent = String(currentQuestion);
    qTotalEl.textContent = String(totalQuestions);
  }

  function renderLives() {
    const items = livesEl.querySelectorAll('.play-life');
    items.forEach((el, i) => {
      el.classList.toggle('play-life--lost', i >= lives);
    });
    livesEl.setAttribute('aria-label', `ライフ${lives}`);
  }

  // ===== ユーティリティ =====
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickColors(n) {
    if (COLORS.length >= n) return shuffle(COLORS).slice(0, n);
    const s = shuffle(COLORS);
    return Array.from({ length: n }, (_, i) => s[i % s.length]);
  }

  function colsForCount(n) {
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    if (n <= 16) return 4;
    if (n <= 25) return 5;
    if (n <= 36) return 6;
    if (n <= 49) return 7;
    return 8;
  }

  // ===== 長考演出 =====
  function startTeaseTimer() {
    clearTimeout(teaseTimer);
    teaseTimer = setTimeout(showTease, TEASE_DELAY_MS);
  }
  function showTease() {
    if (teasing || busy) return;
    teasing = true;
    girlsEl.classList.add('is-teasing');
    if (window.playVoice) window.playVoice('hurry', () => {});
  }
  function stopTease() {
    clearTimeout(teaseTimer);
    teasing = false;
    girlsEl.classList.remove('is-teasing');
  }

  // ===== タップ後リアクション =====
  function showReveal(isHit, colorId) {
    busy = true;
    stopTease();

    const nn = String(colorId).padStart(2, '0');
    revealImgUp.src = `assets/girl_skirt_up_${nn}.png`;

    revealResult.textContent = isHit ? 'あたり' : 'はずれ';
    revealResult.classList.toggle('reveal-result--hit', isHit);
    revealResult.classList.toggle('reveal-result--miss', !isHit);

    revealOverlay.classList.toggle('reveal-overlay--hit', isHit);
    revealOverlay.classList.toggle('reveal-overlay--miss', !isHit);
    revealOverlay.hidden = false;
    revealImgUp.style.opacity = 1;

    if (window.playVoice) window.playVoice('oh-panty', () => {});

    setTimeout(() => {
      revealOverlay.hidden = true;
      revealImgUp.style.opacity = 0;
      busy = false;
      if (isHit) onHit(); else onMiss();
    }, REVEAL_HOLD_MS);
  }

  function onHit() {
    const peopleAtThisQ = config.countAt(currentQuestion);
    score += peopleAtThisQ * 10;
    advanceQuestion();
  }
  function onMiss() {
    lives--;
    renderLives();
    if (lives <= 0) { gameOver(); return; }
    advanceQuestion();
  }
  function advanceQuestion() {
    if (currentQuestion >= totalQuestions) { gameClear(); return; }
    currentQuestion++;
    renderProgress();
    setupQuestion();
  }
  function gameClear() { goToResult('clear'); }
  function gameOver()  { goToResult('gameover'); }
  function goToResult(type) {
    if (player) window.Players.recordPlay(player.id, level, score);
    const q = new URLSearchParams({
      type, level: String(level),
      score: String(score), lives: String(lives),
      total: String(totalQuestions),
      pid: player ? player.id : ''
    });
    window.location.href = `result.html?${q.toString()}`;
  }

  // ===== シャッフル =====
  function swapDom(a, b) {
    const parent = a.parentNode;
    const aNext = a.nextSibling === b ? a : a.nextSibling;
    parent.insertBefore(a, b);
    parent.insertBefore(b, aNext);
  }

  async function swapTwo(elA, elB, durationMs) {
    const rectA = elA.getBoundingClientRect();
    const rectB = elB.getBoundingClientRect();
    const dx = rectB.left - rectA.left;
    const dy = rectB.top  - rectA.top;
    elA.style.transition = elB.style.transition = `transform ${durationMs}ms ease-in-out`;
    elA.style.zIndex = elB.style.zIndex = '10';
    elA.style.transform = `translate(${dx}px, ${dy}px)`;
    elB.style.transform = `translate(${-dx}px, ${-dy}px)`;
    await wait(durationMs + 20);
    elA.style.transition = elB.style.transition = '';
    elA.style.transform  = elB.style.transform  = '';
    elA.style.zIndex     = elB.style.zIndex     = '';
    swapDom(elA, elB);
  }

  async function runPeekShuffle() {
    busy = true;
    const lv = level;
    const q  = currentQuestion;

    // PEEK
    await wait(150); // 初期描画後すぐにめくり始める
    girlsEl.classList.add('is-peeking');
    await wait(peekMs(lv, q));
    girlsEl.classList.remove('is-peeking');
    await wait(PEEK_DOWN_TRANSITION_MS);

    // SHUFFLE
    const swaps = shuffleCount(lv, q);
    const dur   = swapMs(lv, q);
    for (let i = 0; i < swaps; i++) {
      const girls = Array.from(girlsEl.querySelectorAll('.girl'));
      if (girls.length < 2) break;
      const a = Math.floor(Math.random() * girls.length);
      let b = Math.floor(Math.random() * girls.length);
      while (b === a) b = Math.floor(Math.random() * girls.length);
      await swapTwo(girls[a], girls[b], dur);
    }

    busy = false;
    startTeaseTimer();
  }

  // ===== 問題セットアップ =====
  function setupQuestion() {
    girlsEl.innerHTML = '';
    girlsEl.classList.remove('is-peeking', 'is-teasing');
    teasing = false;

    const n = config.countAt(currentQuestion);
    girlsEl.style.setProperty('--cols', String(colsForCount(n)));

    const chosenColors = pickColors(n);
    const answerIdx = Math.floor(Math.random() * n);
    const answerColor = chosenColors[answerIdx];
    answerColorId = answerColor.id;

    questChip.style.backgroundColor = answerColor.hex;
    questName.textContent = answerColor.name;

    chosenColors.forEach((color) => {
      const btn = document.createElement('button');
      btn.className = 'girl';
      btn.dataset.colorId = String(color.id);
      const nn = String(color.id).padStart(2, '0');
      btn.innerHTML = `
        <img src="assets/girl_skirt_down.png" alt="" class="girl-img girl-img-down">
        <img src="assets/girl_skirt_up_${nn}.png" alt="" class="girl-img girl-img-up">
      `;
      btn.addEventListener('click', () => onGirlTap(color));
      girlsEl.appendChild(btn);
    });

    runPeekShuffle();
  }

  function onGirlTap(color) {
    if (busy) return;
    const isHit = (color.id === answerColorId);
    showReveal(isHit, color.id);
  }

  // ===== 起動 =====
  renderProgress();
  renderLives();
  setupQuestion();
})();
