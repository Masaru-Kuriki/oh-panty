// OH!PANTY! ゲーム本体
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
  const REVEAL_HOLD_MS = 1800;

  // レベル別: 問題数 と 「問題i での人数」関数
  const LEVELS = {
    1: { total: 5,  countAt: (i) => Math.min(2 + (i - 1), 6) },   // 2,3,4,5,6
    2: { total: 10, countAt: (i) => Math.min(2 + (i - 1), 11) },  // 2..11
    3: { total: 50, countAt: (i) => Math.min(2 + (i - 1), 51) }   // 2..51
  };

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
  let busy = false;
  let answerGirlIndex = -1;

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
    // 万一足りなければ循環
    const s = shuffle(COLORS);
    return Array.from({ length: n }, (_, i) => s[i % s.length]);
  }

  // 人数 → グリッド列数（1画面詰め込み）
  function colsForCount(n) {
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    if (n <= 16) return 4;
    if (n <= 25) return 5;
    if (n <= 36) return 6;
    if (n <= 49) return 7;
    return 8; // 51人 → 7×8の56枠
  }

  // ===== 長考演出（お尻揺れ + 早くしてよー） =====
  function startTeaseTimer() {
    clearTimeout(teaseTimer);
    teaseTimer = setTimeout(showTease, TEASE_DELAY_MS);
  }

  function showTease() {
    if (teasing || busy) return;
    teasing = true;
    girlsEl.classList.add('is-teasing');
    if (window.playVoice) {
      window.playVoice('hurry', () => {});
    }
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

    // めくり後画像をセット（color.id に対応する girl_skirt_up_NN.png）
    const nn = String(colorId).padStart(2, '0');
    revealImgUp.src = `assets/girl_skirt_up_${nn}.png`;

    // 結果テキスト
    revealResult.textContent = isHit ? 'あたり' : 'はずれ';
    revealResult.classList.toggle('reveal-result--hit', isHit);
    revealResult.classList.toggle('reveal-result--miss', !isHit);

    // オーバーレイ表示
    revealOverlay.classList.toggle('reveal-overlay--hit', isHit);
    revealOverlay.classList.toggle('reveal-overlay--miss', !isHit);
    revealOverlay.hidden = false;
    // 画像2（スカートめくれた）を見せる
    revealImgUp.style.opacity = 1;

    // 音声「OH! PANTY!」（共通）
    if (window.playVoice) {
      window.playVoice('oh-panty', () => {});
    }

    setTimeout(() => {
      revealOverlay.hidden = true;
      revealImgUp.style.opacity = 0;
      busy = false;
      if (isHit) {
        onHit();
      } else {
        onMiss();
      }
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
    if (currentQuestion >= totalQuestions) {
      gameClear();
      return;
    }
    currentQuestion++;
    renderProgress();
    setupQuestion();
  }

  function gameClear() { goToResult('clear'); }
  function gameOver()  { goToResult('gameover'); }

  function goToResult(type) {
    // プレイヤーのベスト更新
    if (player) window.Players.recordPlay(player.id, level, score);

    const q = new URLSearchParams({
      type, level: String(level),
      score: String(score), lives: String(lives),
      total: String(totalQuestions),
      pid: player ? player.id : ''
    });
    window.location.href = `result.html?${q.toString()}`;
  }

  // ===== 問題セットアップ =====
  function setupQuestion() {
    girlsEl.innerHTML = '';
    const n = config.countAt(currentQuestion);
    girlsEl.style.setProperty('--cols', String(colsForCount(n)));

    const chosenColors = pickColors(n);
    const answerIdx = Math.floor(Math.random() * n);
    const answerColor = chosenColors[answerIdx];
    answerGirlIndex = answerIdx;

    questChip.style.backgroundColor = answerColor.hex;
    questName.textContent = answerColor.name;

    chosenColors.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.className = 'girl';
      btn.dataset.index = String(i);
      btn.dataset.hex = color.hex;
      btn.innerHTML = `
        <img src="assets/girl_skirt_down.png" alt="" class="girl-img">
      `;
      btn.addEventListener('click', () => onGirlTap(i, color));
      girlsEl.appendChild(btn);
    });

    startTeaseTimer();
  }

  function onGirlTap(i, color) {
    if (busy) return;
    const isHit = (i === answerGirlIndex);
    showReveal(isHit, color.id);
  }

  // ===== 起動 =====
  renderProgress();
  renderLives();
  setupQuestion();
})();
