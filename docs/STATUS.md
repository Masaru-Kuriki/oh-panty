# STATUS

## 現在フェーズ
**v1.2 リリース完了（シャッフル機構 + 難易度調整 + ノーパン枠）→ 身内10人配布**

## 公開URL
- 本番: https://masaru-kuriki.github.io/oh-panty/
- リポジトリ: https://github.com/Masaru-Kuriki/oh-panty (public)

## 直近の変更
- 2026-06-05: プロジェクト作成
- 2026-06-05: 要件定義完了（一問一答モードでQ1〜Q12決着）
  - `REQUIREMENTS.md` 整備
  - `docs/decisions/001-series-positioning-and-distribution.md` 作成
- 2026-06-05: v0 スキャフォールド完成
  - 全画面のHTML/CSS/JS 一式（index / level / play / result / ranking）
  - 51色カラーマスタ（`data/colors.js`, `data/colors.json`）
  - プレイヤー管理（localStorage、player.js）
  - Supabase連携骨格（未設定時はlocalStorageフォールバック）
  - 音声管理コード（AN-NEN流用＋複数ボイス対応）
  - クリック音（Web Audio API合成）
  - お尻揺れアニメ（長考演出）
  - めくり拡大ズーム演出（吹き出し+結果テキスト）
- 2026-06-08: 本素材組込み + 動作修正
  - `assets/girl_skirt_down.png`（めくり前ベース絵）
  - `assets/girl_skirt_up_01.png` 〜 `girl_skirt_up_51.png`（51色のめくり後絵）
  - `assets/oh!panty!.png`（タイトルロゴ画像）
  - `assets/voice_oh_panty.mp3` / `voice_hurry.mp3`（音声2種）
  - play.js: めくり後画像を `color.id` から動的選択する方式に変更
  - CSS変数による動的パンツ着色レイヤー（`.reveal-panty`）を撤去
  - reveal-overlay 背景を完全不透明化（rgba 0.96 → 不透明色）
  - reveal-stage から `revealImgDown` を撤去（SVG時代の2層構造の名残。PNGは1枚絵で完結のため）
  - HTML の link/script タグに `?v=` バージョン付与（キャッシュバスト用）
  - SVGプレースホルダ削除
- 2026-06-09: Supabase連携
  - AN-NEN/OTETSUDAI相乗りプロジェクト（`vhgxginmkifsdilhcbom.supabase.co`）に接続
  - テーブル `ohpanty_scores` 作成（id/player_name/level/score/played_at + RLS read/insertポリシー）
  - supabase.js: URL/anon key 設定、テーブル名定数化（`TABLE = 'ohpanty_scores'`）
  - Playwrightで送受信フルテスト合格（Submit → INSERT → SELECT → ランキング表示）
- 2026-06-10: GitHub公開
  - 不要画像 `assets/girl_skirt_up.png`（旧シングル版）削除
  - `git init` → 初回commit → GitHubリポジトリ作成（`masaru-kuriki/oh-panty`、Public）→ push
  - GitHub Pages 有効化（main branch / root）
  - 本番URLで Playwright 動作検証合格（200・全画像ロード・reveal挙動OK・エラー0件）
- 2026-06-10: 音声修正
  - 症状: 1回目のタップで音声が鳴らないことがある（レースコンディション）
  - 原因: `unlockAudio()` の muted 先制再生 → `.then(cleanup)` で pause/reset、これが直後の playVoice の音声を pause していた
  - 対応: audio.js を AN-NEN式（unlock撤廃・play+retry-on-gesture）に書き換え
  - 検証: Playwrightで1回目タップ時の `play()` 呼び出しが muted=false, volume=1 で1回のみであることを確認
- 2026-06-11: UX微調整
  - orientation-lock を全HTML/CSSから削除（誤発火クレーム対応）
  - reveal-overlay の表示時間 1800ms → 3000ms に延長（あたり/はずれが早すぎる対応）
- 2026-06-12: 演出刷新
  - めくり画面の吹き出しを `assets/oh!panty!.png`（コミック調画像）に置換、CSS吹き出し（白角丸+三角形）撤去
  - レイアウト順序: 結果テキスト（上）→ 女の子（中央）→ OH!! PANTY!! 吹き出し（下）
- 2026-06-15: シャッフル機構導入 + 難易度調整 + ノーパン枠
  - **シャッフル機構**: 各問題で `PEEK → DOWN → SHUFFLE → TAP → REVEAL` の状態遷移を実装
    - PEEK: 全員のスカートが上がりパンツ色を一斉公開
    - SHUFFLE: 2人ずつ位置をtransformでアニメ swap → DOM順序入れ替え
    - 各girlボタンに down/up 両方の `<img>` を持たせ `.is-peeking` クラスで切替
    - 正解判定を index ベース → `color.id` ベースに変更（シャッフル後も追跡）
  - **レベル人数調整**: Lv1=2..6(5問) / Lv2=5..11(7問) / Lv3=30..51(22問)
  - **難易度カーブ**: 問題進むほど peek短く・shuffle多く・swap速く
    - Lv1: peek 1000→600ms / shuffle 7→12回 / swap 180→140ms
    - Lv2: peek 700→400ms / shuffle 14→24回 / swap 150→110ms
    - Lv3: peek 400→200ms / shuffle 28→48回 / swap 110→80ms
  - **ノーパン枠**: id=47 の表示名「アイボリー」→「ノーパン」、各問題で 1/3 の確率でお題色に強制
  - お題テキスト: ノーパンの時は「ノーパンの子は　だれ？」+ chip非表示。それ以外は通常「この色のパンツは だれ？」

## 仕様の核（最重要）
- 完全カン運ゲー、ライフ3制、Lv1=5問 / Lv2=10問 / Lv3=50問
- 1画面詰め込み、Lv3最終問は51人（7×8グリッド予定）
- AI生成ベース絵1パターン（538449.jpg ベース、現状はSVGプレースホルダ）
- パンツ51色、CSS変数で動的着色
- レベル別ランキング × 3、Supabase ネット共有（未設定時はローカル）
- プレイヤーカード方式

## 保留中 → 差し替え/設定が必要なもの

| 項目 | 状況 |
|---|---|
| 女の子のベース絵 | ✅ 組込み済（PNG 52枚） |
| タイトル画像 | ✅ 組込み済（`oh!panty!.png`） |
| 音声ファイル（voice_oh_panty.mp3, voice_hurry.mp3） | ✅ 組込み済（mp3） |
| マスコットキャラ案 | くりさん側で考案中（任意） |
| Supabase URL/anon key | ✅ 設定済（AN-NEN相乗り） |
| GitHub リポジトリ・Pages デプロイ | 未着手 |
| favicon.png | 未作成 |

## 動作確認方法

```
open ~/Projects/OH\!PANTY\!/index.html
```

ローカルfile://で立ち上がるが、scriptタグでcolors.jsを読み込む方式なのでCORS問題は起きない設計。

## 次のステップ候補

1. **ブラウザで動作確認**（くりさんが実機orPC）
2. **マスコット仕様確定** → リアクション画像4枚のAI生成
3. **女の子のAI生成画像**を538449.jpg ベースで量産（画像1/画像2）
4. **音声収録**（自分の声 or AI音声 or 友人）
5. **Supabase プロジェクト作成 → URL/Key設定**
6. **GitHubリポジトリ作成 → Pages公開**
7. **身内10人への配布（URL or zip）**

## 次のチャットへの引き継ぎ手順

1. `CLAUDE.md`
2. `REQUIREMENTS.md`
3. `docs/decisions/001-series-positioning-and-distribution.md`
4. `docs/STATUS.md`（このファイル）
5. `docs/TASKS.md`
6. `docs/mascot-concepts.md`（マスコット案保留）
7. `docs/ai-image-prompts.md`（AI画像生成プロンプト案）
