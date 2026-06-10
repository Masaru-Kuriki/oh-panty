// レベル選択画面
(() => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('pid');
  if (pid) window.Players.setCurrent(pid);

  const player = window.Players.getCurrent();
  if (!player) {
    // プレイヤー未選択ならTOPへ
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('currentName').textContent = player.name;

  // ベストスコア表示
  const best = player.best || { 1: 0, 2: 0, 3: 0 };
  document.querySelectorAll('[data-best]').forEach(el => {
    const lv = el.getAttribute('data-best');
    el.textContent = (best[lv] || 0).toLocaleString();
  });
})();
