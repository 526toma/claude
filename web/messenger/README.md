# Messenger

Firebase（Authentication + Cloud Firestore）で動く、LINE 風のシンプルなメッセンジャーです。
ビルド不要の静的サイト（HTML / CSS / ES Modules）で、そのままホスティングできます。

```
web/messenger/
├── index.html        画面のマークアップ（認証 / 一覧 / トークルーム）
├── style.css         デザイン（白基調 + LINE グリーン）
├── app.js            Firebase 連携とアプリのロジック
└── firestore.rules   Firestore セキュリティルール
```

## できること

- メールアドレス + パスワードでの新規登録 / ログイン
- 「友だち」タブから相手を選んで 1 対 1 のトークを開始（名前・メールで検索）
- メッセージのリアルタイム送受信（`onSnapshot`）
- トーク一覧に最新メッセージ・時刻・未読マークを表示
- 既読表示、日付の区切り、同じ人の連続発言はまとめて表示
- 表示名の変更、ログアウト

## セットアップ

1. [Firebase コンソール](https://console.firebase.google.com/)でプロジェクトを作成する
2. **Authentication → Sign-in method** で「メール / パスワード」を有効にする
3. **Firestore Database** を作成する
4. `firestore.rules` の内容を **Firestore → ルール** に貼り付けて公開する
5. **プロジェクトの設定 → マイアプリ（ウェブ）** で取得した設定を `app.js` の
   `firebaseConfig` に貼り付ける
6. **Authentication → Settings → 承認済みドメイン** に、公開するドメイン
   （例：`<ユーザー名>.github.io`）を追加する

ローカルで動かす場合は、このディレクトリで簡易サーバーを立てて開きます
（ES Modules を使うため `file://` では動きません）。

```bash
cd web/messenger
python3 -m http.server 8000
# → http://localhost:8000
```

動作を確かめるときは、別のブラウザやシークレットウィンドウでもう 1 アカウント登録すると、
2 人のやり取りをそのまま試せます。

## データ構造

```
users/{uid}
  uid, name, email, createdAt

chats/{chatId}                      chatId = 2 人の uid を昇順に "__" で連結
  members:      [uidA, uidB]
  memberInfo:   { uid: { name, email } }
  lastMessage:  最新メッセージ（一覧のプレビュー用）
  lastSenderId: 最新メッセージの送信者
  lastMessageAt, updatedAt
  lastRead:     { uid: 最後に開いた時刻 }   未読・既読の判定に使う

chats/{chatId}/messages/{messageId}
  text, senderId, senderName, createdAt
```

`chatId` を 2 人の uid から機械的に決めているので、どちらから開いても同じトークになり、
重複したトークが作られません。

トーク一覧は `where("members", "array-contains", uid)` だけで取得し、並べ替えは
クライアント側で行っています。そのため Firestore の複合インデックスは不要です。
