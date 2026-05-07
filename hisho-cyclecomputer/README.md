# 秘書ちゃんサイクルコンピューター

ロングライド愛好者のための、AIキャラクター「秘書ちゃん」が伴走してくれるWebアプリ（PWA）。
iPhone Safari での動作を主眼に、走行前のチャット相談 → 走行中の声かけ → ゴール後の振り返り、までを一つの画面体験でつなげる。

## 現在の実装フェーズ

**フェーズ1（MVP）** が動く状態:

- [x] Firebase Hosting 用のディレクトリ構成
- [x] HTML/CSS で 3 画面（チャット / 走行 / 振り返り）
- [x] 秘書ちゃん表情差分 11種（SVG プレースホルダー）
- [x] スタート前チャット（クイック返信ベース、LLM はモック）
- [x] GPS 記録（`watchPosition`）と距離・時間・速度の表示
- [x] ローカル判定の声かけ（5km通過・登り・休憩 など）
- [x] Web Speech API による音声合成（iOS unlock 対応）
- [x] Wake Lock API による画面常時 ON
- [x] IndexedDB によるライド履歴／GPSログ保存
- [x] PWA 化（manifest + Service Worker）
- [x] 屋内テスト用デバッグ GPS モード

**フェーズ2 以降**:

- [ ] Firebase Functions による Claude API プロキシ稼働（雛形は `functions/index.js`）
- [ ] スタート前チャットの LLM 化
- [ ] 走行中の LLM 声かけ（マイルストーン到達時など）
- [ ] 表情差分の実画像差し替え
- [ ] 設定画面の拡充・ライド履歴一覧

## ディレクトリ構成

```
hisho-cyclecomputer/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js       エントリーポイント・画面遷移
│   │   ├── chat.js      スタート前チャットUI
│   │   ├── ride.js      走行ロジック（GPS・タイマー・音声）
│   │   ├── state.js     状態判定（phase / mood / milestone …）
│   │   ├── voice.js     Web Speech API ラッパー
│   │   ├── storage.js   IndexedDB ラッパー
│   │   └── api.js       Claude API クライアント（フェーズ1はモック）
│   └── images/hisho/    秘書ちゃん表情差分（SVG プレースホルダー）
├── functions/
│   ├── index.js         Claude API プロキシ
│   └── package.json
├── firebase.json
└── .firebaserc
```

## ローカルでの動作確認

### 静的サーバーで確認（Firebase 不要）

ローカルファイルを直接開くと一部機能（Service Worker・Wake Lock）が動かないため、簡易サーバー経由で確認するのがおすすめ:

```bash
cd hisho-cyclecomputer/public
python3 -m http.server 5000
# → http://localhost:5000 を Safari/Chrome で開く
```

### Firebase エミュレーター

Firebase CLI が入っている前提:

```bash
cd hisho-cyclecomputer
firebase emulators:start --only hosting
# → http://localhost:5000
```

Functions まで含めて動かすには `CLAUDE_API_KEY` を設定:

```bash
export CLAUDE_API_KEY=sk-ant-...
firebase emulators:start --only hosting,functions
```

## iOS Safari で試す

1. 上記いずれかでローカルサーバーを起動
2. 同一 Wi-Fi 上の iPhone から `http://<PC の IP>:5000/` を開く
3. **「ホーム画面に追加」** で PWA としてインストール
4. Safari は HTTPS でないと一部 API（位置情報など）に制約あり。本番は Firebase Hosting にデプロイすること

## デバッグGPSモード

GPS が効かない屋内・室内テスト用に、設定モーダルから **デバッグGPS** を ON にすると、広島駅周辺をぐるぐる回るダミー位置情報を1秒ごとに流す。

## キャラクター画像の差し替え

`public/images/hisho/` に以下11種類の SVG プレースホルダーを配置している:

| ファイル | 表情 | 主な発火タイミング |
| --- | --- | --- |
| `normal.svg`    | 通常スマイル | 平常時 |
| `wink.svg`      | ウインク | スタート直後 |
| `cheer.svg`     | 励まし | km通過・登り |
| `worry.svg`     | 心配 | 長時間停止 |
| `trouble.svg`   | 困り顔 | 異常検知 |
| `celebrate.svg` | 喜び・拍手 | 大きなマイルストーン・ゴール |
| `surprise.svg`  | 驚き | 想定外イベント |
| `relax.svg`     | 余裕 | 下り |
| `effort.svg`    | 頑張り | 急な登り |
| `tired.svg`     | お疲れ | 長時間走行 |
| `rest.svg`      | 休憩促し | 速度ゼロ継続 |

実画像（PNG/WebP）に差し替える際はファイル名を同じにして置き換えるだけで OK。コード側の参照（`ride.js` の `setMood`）はそのまま動く。

## デプロイ

```bash
cd hisho-cyclecomputer
firebase login
firebase use hisho-cyclecomputer
firebase deploy --only hosting
# Functions も含める場合
firebase deploy
```

## 技術メモ

- **音声の初回起動**: iOS Safari は最初の音声再生にユーザータップが必須。スタートボタンで `HishoVoice.unlock()` を必ず呼ぶ。
- **GPS精度**: `enableHighAccuracy: true` 指定。室内では衛星補足できないことが多いので、デバッグGPSをご活用ください。
- **画面常時ON**: Wake Lock API は iOS 16.4+ 対応。バックグラウンド遷移時は再取得を試みる。
- **API呼び出しコスト**: 走行中の LLM 声かけは状態が変化した瞬間のみ。1ライド10〜20回を想定。
