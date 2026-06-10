# TASKS

## 完了
- [x] プロジェクト作成
- [x] 要件定義（一問一答モードで決着）
- [x] REQUIREMENTS.md 整備
- [x] docs/decisions/001 作成
- [x] CLAUDE.md 整備
- [x] 51色マスタ（data/colors.json + data/colors.js）
- [x] robots.txt
- [x] マスコット案ドキュメント
- [x] AI画像生成プロンプト案ドキュメント
- [x] サイトスキャフォールド一式
  - [x] index.html / index.js
  - [x] level.html / level.js
  - [x] play.html / play.js
  - [x] result.html / result.js
  - [x] ranking.html / ranking.js
  - [x] style.css
  - [x] player.js（localStorage管理）
  - [x] audio.js（複数ボイス + iOS制約対応）
  - [x] click.js（Web Audio API合成）
  - [x] supabase.js（Supabase連携 + ローカルフォールバック）
- [x] 本素材組込み（2026-06-08）
  - [x] 女の子ベース絵 PNG 52枚（`girl_skirt_down.png` + `girl_skirt_up_01〜51.png`）
  - [x] タイトル画像 `oh!panty!.png`
  - [x] 音声 `voice_oh_panty.mp3` / `voice_hurry.mp3`
  - [x] HTML/JS を SVG参照 → PNG参照に切替、`color.id` ベースの動的画像選択
  - [x] 不要になった `.reveal-panty` レイヤー & SVGプレースホルダを削除

## 未着手（くりさん側の入力待ち）

### 素材
- [ ] **マスコットキャラ案決定** → リアクション画像4状態のAI生成（任意）
  - 当たり / ハズレ / GameOver / クリア
  - 配置: `assets/mascot_hit.png` `mascot_miss.png` `mascot_gameover.png` `mascot_clear.png`
- [ ] **favicon.png** または `favicon.ico`（assetsに配置）

### Supabase
- [ ] Supabase プロジェクト作成（無料枠）
- [ ] テーブル `scores` 作成
  ```sql
  create table scores (
    id uuid primary key default gen_random_uuid(),
    player_name text not null,
    level int not null check (level in (1,2,3)),
    score int not null,
    played_at timestamptz not null default now()
  );
  alter table scores enable row level security;
  create policy "anyone can read" on scores for select using (true);
  create policy "anyone can insert" on scores for insert with check (true);
  ```
- [ ] URL/anon key 取得 → `supabase.js` の冒頭2行を差し替え
  - `const SUPABASE_URL = '...'`
  - `const SUPABASE_ANON_KEY = '...'`

### デプロイ
- [ ] GitHub リポジトリ作成（private推奨）
- [ ] GitHub Pages 有効化
- [ ] URL を身内10人にだけ共有
- [ ] zip 配布パッケージ作成（オプション）

## 改善・追加候補（v1後）
- [ ] 音声ファイルが無いときも警告を出さない（現状はconsole.warnが出る）
- [ ] パンツ色マスクの精度改善（SVGをinline化してパス着色する案）
- [ ] レベルクリア時のおまけ演出
- [ ] BGM対応（保留決定済み、必要なら後付け）
