# AI画像生成プロンプト案

## 必要な画像

### ベース絵柄（女の子）

| 画像 | 用途 | パンツの状態 |
|---|---|---|
| `girl_skirt_down.png` | 画像1（めくり前） | スカートが下りていて見えない |
| `girl_skirt_up_base.png` | 画像2（めくり後・着色前） | スカートがめくれて白いパンツ（or 透明） |

→ 画像1と画像2の **シルエットが同じ位置・同じサイズ** であることが重要（差し替えで違和感が出ないように）。

### マスコット（4状態）

マスコットコンセプト決定後に生成。

## 元画像（538449.jpg）の特徴

くりさん提供の元画像から把握できる絵柄特徴：

- 線画（黒の太い輪郭線）
- フラットカラー（グラデなし、塗り潰し）
- パステル調の肌色
- 紫色のプリーツスカート
- 手描き調・ラフな線
- 背景は薄いクリーム色 or 白
- 構図: 下半身のみ（腰〜膝あたりまで）、両腕は腰に当てている or 体側

## プロンプト案（画像1: めくり前）

### DALL-E 3 / Midjourney 想定

```
Simple hand-drawn illustration of a young girl's lower body,
from waist to mid-thigh. She's standing facing forward,
wearing a short purple pleated skirt that falls naturally,
both arms placed at her hips with elbows showing.
Plain light cream background.
Style: bold black outline, flat solid colors, no shading,
slightly rough hand-drawn quality.
Pastel skin tone. Innocent, cute, cartoon style.
No face, no upper body visible.
```

### 日本語版

```
若い女の子の下半身（腰から太もも中ほどまで）の手描き風シンプルイラスト。
正面を向いて立ち、紫色の短いプリーツスカートが自然に下りている。
両腕は腰に当てて肘が見える状態。
背景は薄いクリーム色の単色。
スタイル: 太い黒の輪郭線、フラットカラー塗り、影なし、ややラフな手描き感。
肌はパステル調。可愛らしい、無邪気な、漫画的タッチ。
顔・上半身は描かない。
```

## プロンプト案（画像2: めくり後・着色前）

```
Same girl, same pose, same camera angle as the previous image,
but her purple pleated skirt is flipped UP, revealing plain white panties
(or solid base color that can be recolored later).
Skirt fabric shown as if caught mid-lift, with a slight upward curl.
Style identical to the previous image: bold outline, flat colors.
The panty area should be a SOLID single color so it can be 
recolored programmatically. Use pure white #FFFFFF for the panty.
```

### 重要な要件

- **画像1と画像2はキャラ位置を完全に揃える**（pixel-perfect alignment）
- **パンツの色は単一色（#FFFFFF or 透明背景）**: JS/CSSで動的着色するため
- スカートのめくれ方は自然に（持ち上がっている瞬間の表現）
- 出力サイズ: **1024×1024（1:1 正方形）** 確定
- 背景は **透明 or 単色**（できれば透明PNG）
- パンツの位置: 中央付近に矩形配置（CSS変数 top:39% left:39% width:22% height:15% と一致させる）

## 推奨ワークフロー

1. 元画像（538449.jpg）を img2img の参考画像としてアップロード
2. プロンプトで「めくり前」「めくり後」をそれぞれ生成
3. 構図がズレた場合は inpaint で位置調整
4. 必要に応じて Photoshop / Figma で背景透明化、パンツ部分を単色化

## 代替案: Claude/開発側でSVG化

くりさんがAIツール環境を持っていない場合、Claudeが元画像を参考に **SVG手描き** で画像1/2 を作成することも可能。
- メリット: ファイル軽量、パンツ部分を `<rect fill="...">` で動的着色可能
- デメリット: AI生成より絵柄の精度低い

## マスコット用プロンプト

マスコットコンセプト決定後にここを追記。
