# セットアップ（Apps Script / スプレッドシート側）

ローカルの準備とデプロイの流れは [../README.md](../README.md) を参照。
このドキュメントはGoogle側の設定に絞る。

## 1. Apps Script API を有効にする

初回のみ必要。https://script.google.com/home/usersettings を開き、
**Google Apps Script API** をオンにする。反映に数分かかることがある。

オフのままだと `clasp push` が次のエラーで失敗する（読み取りは通るので気づきにくい）。

```
User has not enabled the Apps Script API.
```

## 2. clasp にログインする

```bash
npx clasp login
```

ブラウザが開いてGoogleアカウントの認可を求められる。
認可情報は `~/.clasprc.json` に保存される（リポジトリ外）。

```bash
npx clasp show-authorized-user   # ログイン状態の確認
```

## 3. デプロイ先を決める

**カスタム関数は、スクリプトが紐付いた（コンテナバインドされた）スプレッドシートでしか
使えない。** スタンドアロンのスクリプトに置いても、どのシートからも見えない。
つまり「どのスプレッドシートで使うか」がそのままデプロイ先になる。

### 既存のスプレッドシートで使う場合

1. 対象シートを開き、**拡張機能 → Apps Script** を選ぶ
   （そのシートにバインドされたスクリプトが作られる）
2. 左の歯車 **プロジェクトの設定 → スクリプト ID** をコピー
   （エディタのURL `.../projects/<スクリプトID>/edit` からも読み取れる）
3. リポジトリ直下の `.env` に書く

```bash
JEV_SCRIPT_ID=<Apps ScriptのスクリプトID>
```

`npm run push` の際、この値から `.clasp.json` が生成される。
`.clasp.json` はGit管理外なので、デプロイ先の切り替えは `.env` の書き換えだけで済む。

### 新しいスプレッドシートごと作る場合

```bash
npx clasp create-script --type sheets --title "jev-sheets" --rootDir dist
```

新しいシートとバインド済みスクリプトが作られ、`.clasp.json` に `scriptId` が書かれる。
その値を `.env` に移しておく。

### 複数のスプレッドシートで使いたい場合

スクリプトはシート間で共有されないため、シートごとに上記の手順でpushする。
全社的に配布したい場合はSheetsエディタアドオンとしての公開が必要だが、初版の範囲外。

## 4. APIキーを登録する

APIキーはコードに書かない。**ローカル用とGAS用で置き場所が別**なので、両方に設定する。

| | 置き場所 | 用途 |
| --- | --- | --- |
| ローカル | リポジトリ直下の `.env`（Git管理外） | `npm run try` / `npm run push` |
| GAS | **プロジェクトの設定 → スクリプト プロパティ** | シート上の関数 |

スクリプトプロパティはスクリプトプロジェクトごとに独立しているので、
デプロイ先を増やすたびにそのプロジェクトにも登録する。

| キー | 必須 | 既定値 | 内容 |
| --- | --- | --- | --- |
| `JEV_API_KEY` | ○ | － | TypeSafe APIキー |
| `JEV_API_ENDPOINT` | | `https://api.typesafe.ai/v1/systemone` | エンドポイント |
| `JEV_MODEL` | | `jev-latest` | モデル |
| `JEV_CACHE_TTL` | | `21600` | キャッシュTTL（秒）。`0` で無効 |

必須は `JEV_API_KEY` のみ。残り3つは未設定なら既定値が使われる。
キー名はローカルもGASも同じで、`JevConfig` がGAS上では `PropertiesService`、
ローカルでは環境変数を見る。

`.env` の全体像。`JEV_SCRIPT_ID` はローカル専用（デプロイ先の指定）で、GAS側には不要。

```bash
JEV_API_KEY=...
JEV_SCRIPT_ID=...
```

GAS側はエディタから `jevSetApiKey("...")` を実行しても登録できる。

## 5. 動作確認

```bash
npm run push
npm run open     # Apps Scriptエディタを開く
```

1. エディタの関数リストから `jevTestConnection` を選んで実行する
   初回は外部接続（`UrlFetchApp`）の認可ダイアログが出るので許可する
   実行ログに `疎通OK, noul=...` が出れば成功
2. スプレッドシートのセルで確認する

```
A2: 先芯入り作業靴 JSAA A種 26.0cm
B2: =JEV_NOUL(A2, "この商品は安全靴ですか？")
```

セルで `=JEV_` と入力したときに候補が出れば、バインドされている証拠になる。

## 運用上の注意

- **pushした時点で反映される。** カスタム関数は常に最後にpushしたコードで動く
  （デプロイのバージョン指定はWebアプリやアドオン向けで、カスタム関数には効かない）
- `clasp push --force` はリモートのファイルを `dist/` の内容で置き換える。
  対象プロジェクトに手書きのコードがある場合は消えるので、事前に `clasp pull` で確認する
- 大量の行に数式をコピーすると多数のリクエストが同時に発生する。
  同一入力は `CacheService` でキャッシュされるが、コストとRate Limitに注意する

## エラー一覧

セルには内部情報を出さず、`JEV:` から始まるメッセージのみを表示する。
HTTPステータスやレスポンスボディは実行ログにのみ出力する。

| 表示 | 原因 |
| --- | --- |
| `JEV: state は必須です。` | `state` が空 |
| `JEV: instruction は必須です。` | `instruction` が空 |
| `JEV: choices には2つ以上の値が必要です。` | 候補が2件未満 |
| `JEV: levels には2つ以上の値が必要です。` | 評価段階が2件未満 |
| `JEV: APIキーが設定されていません。` | スクリプトプロパティの `JEV_API_KEY` 未設定 |
| `JEV: API認証に失敗しました。` | 401 / 403 |
| `JEV: レート制限に達しました。` | 429 |
| `JEV: APIが一時的に利用できません。` | 5xx |
| `JEV: リクエストが不正です。` | その他の4xx |
| `JEV: リクエストに失敗しました。` | ネットワークエラー |
| `JEV: APIレスポンスを解釈できません。` | レスポンスが解釈できない |

## トラブルシュート

| 症状 | 原因と対処 |
| --- | --- |
| `clasp push` が Apps Script API のエラーで失敗する | 手順1の設定がオフ。オンにして数分待つ |
| セルで `=JEV_` の候補が出ない | スクリプトがそのシートにバインドされていない。手順3をやり直す |
| `JEV: APIキーが設定されていません。` | そのスクリプトプロジェクトのスクリプトプロパティに `JEV_API_KEY` が未登録 |
| `npm run push` しても `.clasp.json` が変わらない | `.env` の `JEV_SCRIPT_ID` を確認する。`node tools/clasp-config.js` 単体でも生成できる |
| 実行ログを見たい | `npm run logs`（`clasp tail-logs`）またはエディタの実行数／ログ |
