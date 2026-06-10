// OH!PANTY! プレイヤー管理（localStorage）
// 同一端末で複数プレイヤーを管理する。スコアは Supabase 側に保存（このファイルは個人情報の保管のみ）。
(() => {
  const STORAGE_KEY = 'ohpanty:players';
  const CURRENT_KEY = 'ohpanty:currentPlayerId';

  function uid() {
    return 'p_' + Math.random().toString(36).slice(2, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(players) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }

  function add(name) {
    const players = load();
    const player = {
      id: uid(),
      name: (name || 'ゲスト').slice(0, 20),
      createdAt: new Date().toISOString(),
      lastPlayedAt: null,
      best: { 1: 0, 2: 0, 3: 0 }
    };
    players.push(player);
    save(players);
    return player;
  }

  function rename(id, newName) {
    const players = load();
    const p = players.find(x => x.id === id);
    if (!p) return false;
    p.name = (newName || p.name).slice(0, 20);
    save(players);
    return true;
  }

  function setCurrent(id) {
    localStorage.setItem(CURRENT_KEY, id);
  }

  function getCurrent() {
    const id = localStorage.getItem(CURRENT_KEY);
    if (!id) return null;
    return load().find(p => p.id === id) || null;
  }

  function recordPlay(id, level, score) {
    const players = load();
    const p = players.find(x => x.id === id);
    if (!p) return;
    p.lastPlayedAt = new Date().toISOString();
    if (!p.best) p.best = { 1: 0, 2: 0, 3: 0 };
    const lv = String(level);
    if (score > (p.best[lv] || 0)) p.best[lv] = score;
    save(players);
  }

  window.Players = { load, save, add, rename, setCurrent, getCurrent, recordPlay };
})();
