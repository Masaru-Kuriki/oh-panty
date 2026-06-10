// ランキング画面
(() => {
  const listEl   = document.getElementById('rankingList');
  const sourceEl = document.getElementById('rankingSource');
  const tabs = document.querySelectorAll('.ranking-tab');

  const params = new URLSearchParams(window.location.search);
  const initialLevel = parseInt(params.get('level') || '1', 10);
  const highlightScore = parseInt(params.get('highlightScore') || '0', 10);
  const player = window.Players ? window.Players.getCurrent() : null;
  const playerName = player ? player.name : '';

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch (e) { return ''; }
  }

  async function renderTab(level) {
    tabs.forEach(t => t.classList.toggle('is-active', String(t.dataset.tab) === String(level)));
    listEl.innerHTML = '<div class="ranking-empty">読み込み中…</div>';

    let rows = [];
    let source = 'local';
    if (window.OPRank) {
      try {
        rows = await window.OPRank.fetchRanking(level);
        source = window.OPRank.isConfigured ? 'supabase' : 'local';
      } catch (e) {
        rows = [];
      }
    }

    if (!rows.length) {
      listEl.innerHTML = '<div class="ranking-empty">まだスコアがありません</div>';
      sourceEl.textContent = source === 'supabase' ? '（オンライン）' : '（ローカル保存）';
      return;
    }

    listEl.innerHTML = '';
    rows.forEach((r, i) => {
      const rank = i + 1;
      const row = document.createElement('div');
      row.className = 'ranking-row';
      // ハイライト（自分のスコア完全一致）
      if (highlightScore > 0 && playerName === r.name && Number(r.score) === highlightScore) {
        row.classList.add('ranking-row--self');
      }

      const rankEl = document.createElement('div');
      rankEl.className = `ranking-rank ranking-rank--${rank}`;
      rankEl.textContent = rank;
      row.appendChild(rankEl);

      const nameEl = document.createElement('div');
      nameEl.className = 'ranking-name';
      const dateStr = formatDate(r.playedAt);
      nameEl.innerHTML = `${r.name}${dateStr ? ` <span style="font-size:11px;color:var(--text-sub);">(${dateStr})</span>` : ''}`;
      row.appendChild(nameEl);

      const scoreEl = document.createElement('div');
      scoreEl.className = 'ranking-score';
      scoreEl.textContent = Number(r.score).toLocaleString();
      row.appendChild(scoreEl);

      listEl.appendChild(row);
    });
    sourceEl.textContent = source === 'supabase' ? '（オンライン）' : '（ローカル保存）';
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => renderTab(parseInt(tab.dataset.tab, 10)));
  });

  renderTab(initialLevel);
})();
