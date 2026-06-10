// 結果画面 — スコア表示・Supabase送信
(() => {
  const params = new URLSearchParams(window.location.search);
  const type  = params.get('type') || 'clear';
  const level = parseInt(params.get('level') || '1', 10);
  const score = parseInt(params.get('score') || '0', 10);
  const total = parseInt(params.get('total') || '5', 10);
  const lives = parseInt(params.get('lives') || '0', 10);
  const pid   = params.get('pid') || '';

  const titleEl   = document.getElementById('resultTitle');
  const scoreEl   = document.getElementById('resultScore');
  const metaEl    = document.getElementById('resultMeta');
  const statusEl  = document.getElementById('submitStatus');
  const btnRetry  = document.getElementById('btnRetry');
  const btnRanking= document.getElementById('btnRanking');

  // タイトル
  if (type === 'gameover') {
    titleEl.textContent = 'GAME OVER';
    titleEl.classList.add('result-title--gameover');
  } else {
    titleEl.textContent = 'クリア！';
  }

  scoreEl.textContent = score.toLocaleString();
  metaEl.textContent = `Lv${level}・残ライフ ${lives}・${total}問`;

  // 再挑戦・ランキング遷移
  btnRetry.addEventListener('click', () => {
    window.location.href = `play.html?level=${level}`;
  });
  btnRanking.href = `ranking.html?level=${level}&highlightScore=${score}`;

  // Supabase送信
  const player = window.Players ? window.Players.getCurrent() : null;
  const playerName = player ? player.name : 'ゲスト';

  if (score > 0 && window.OPRank) {
    statusEl.textContent = 'ランキングに登録中…';
    window.OPRank.submitScore({ playerName, level, score })
      .then(r => {
        if (r && r.ok) {
          statusEl.textContent = r.source === 'supabase'
            ? `✓ ${playerName} としてランキングに登録しました`
            : `（ローカル保存）${playerName} のスコアを記録`;
        } else {
          statusEl.textContent = '登録に失敗しました';
        }
      })
      .catch(() => { statusEl.textContent = '登録に失敗しました'; });
  } else {
    statusEl.textContent = '0点は登録しません';
  }
})();
