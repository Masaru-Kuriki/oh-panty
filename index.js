// TOP画面 — プレイヤーカード一覧の動的生成・追加・編集
(() => {
  const grid = document.getElementById('cardGrid');
  const modal = document.getElementById('nameModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalInput = document.getElementById('modalInput');
  const modalOk = document.getElementById('modalOk');
  const modalCancel = document.getElementById('modalCancel');

  let pendingMode = null; // 'add' | { mode: 'rename', id }

  function formatDate(iso) {
    if (!iso) return '初プレイ';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function bestSum(player) {
    if (!player.best) return 0;
    return (player.best[1] || 0) + (player.best[2] || 0) + (player.best[3] || 0);
  }

  function render() {
    grid.innerHTML = '';
    const players = window.Players.load();

    players.forEach(p => {
      const card = document.createElement('a');
      card.className = 'player-card';
      card.href = `level.html?pid=${encodeURIComponent(p.id)}`;
      card.dataset.id = p.id;

      const edit = document.createElement('button');
      edit.className = 'card-edit';
      edit.setAttribute('aria-label', '名前を編集');
      edit.textContent = '✎';
      edit.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal({ mode: 'rename', id: p.id, current: p.name });
      });
      card.appendChild(edit);

      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = p.name;
      card.appendChild(name);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `
        <div>最終: ${formatDate(p.lastPlayedAt)}</div>
        <div class="card-score">合計ベスト: ${bestSum(p).toLocaleString()}点</div>
        <div>Lv1:${(p.best && p.best[1]) || 0} / Lv2:${(p.best && p.best[2]) || 0} / Lv3:${(p.best && p.best[3]) || 0}</div>
      `;
      card.appendChild(meta);

      grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'player-card player-card--add';
    addBtn.innerHTML = `<span class="card-add-icon">+</span><div class="card-add-label">追加</div>`;
    addBtn.addEventListener('click', () => openModal({ mode: 'add' }));
    grid.appendChild(addBtn);
  }

  function openModal(opts) {
    pendingMode = opts;
    modalTitle.textContent = opts.mode === 'rename' ? '名前を編集' : '新しいプレイヤー';
    modalInput.value = opts.current || '';
    modal.hidden = false;
    setTimeout(() => modalInput.focus(), 50);
  }

  function closeModal() {
    pendingMode = null;
    modal.hidden = true;
  }

  modalOk.addEventListener('click', () => {
    if (!pendingMode) return closeModal();
    const name = modalInput.value.trim();
    if (!name) { modalInput.focus(); return; }
    if (pendingMode.mode === 'add') {
      const p = window.Players.add(name);
      window.Players.setCurrent(p.id);
    } else if (pendingMode.mode === 'rename') {
      window.Players.rename(pendingMode.id, name);
    }
    closeModal();
    render();
  });

  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // カードクリック時、currentPlayer を更新
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.player-card:not(.player-card--add)');
    if (!card) return;
    const id = card.dataset.id;
    if (id) window.Players.setCurrent(id);
  }, true);

  render();
})();
