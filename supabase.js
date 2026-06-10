// OH!PANTY! Supabase 連携
// URL/Key は config.local.js（gitignore）or 直接ここに記入。
// 未設定の場合は localStorage フォールバックでローカルランキングとして動作。
(() => {
  // === 設定 ===
  // AN-NEN/OTETSUDAI と相乗りプロジェクト。テーブルは ohpanty_scores（プレフィックス分離）。
  const SUPABASE_URL = 'https://vhgxginmkifsdilhcbom.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZ3hnaW5ta2lmc2RpbGhjYm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDQ5NjIsImV4cCI6MjA5NTUyMDk2Mn0.opD6K5BVvTKmlZRkTiIJFhHkGdXS79CHQRJbp81ISRI';
  const TABLE = 'ohpanty_scores';
  const LOCAL_FALLBACK_KEY = 'ohpanty:localRanking';

  const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

  // Supabase REST API でスコアを送信
  async function submitScore({ playerName, level, score }) {
    if (!isConfigured) return submitLocal({ playerName, level, score });
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          player_name: playerName,
          level: level,
          score: score
        })
      });
      if (!res.ok) {
        console.warn('Supabase submit failed:', res.status);
        return submitLocal({ playerName, level, score });
      }
      return { ok: true, source: 'supabase' };
    } catch (e) {
      console.warn('Supabase error, fallback to local:', e);
      return submitLocal({ playerName, level, score });
    }
  }

  // 該当レベルのTop10を取得
  async function fetchRanking(level) {
    if (!isConfigured) return fetchLocal(level);
    try {
      const url = `${SUPABASE_URL}/rest/v1/${TABLE}`
        + `?select=player_name,score,played_at`
        + `&level=eq.${level}`
        + `&order=score.desc`
        + `&limit=10`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) return fetchLocal(level);
      const data = await res.json();
      return data.map(r => ({
        name: r.player_name,
        score: r.score,
        playedAt: r.played_at
      }));
    } catch (e) {
      return fetchLocal(level);
    }
  }

  // === ローカルフォールバック ===
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveLocal(arr) {
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(arr));
  }

  function submitLocal({ playerName, level, score }) {
    const arr = loadLocal();
    arr.push({
      player_name: playerName,
      level: Number(level),
      score: Number(score),
      played_at: new Date().toISOString()
    });
    saveLocal(arr);
    return { ok: true, source: 'local' };
  }

  function fetchLocal(level) {
    return loadLocal()
      .filter(r => r.level === Number(level))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => ({ name: r.player_name, score: r.score, playedAt: r.played_at }));
  }

  window.OPRank = { submitScore, fetchRanking, isConfigured };
})();
