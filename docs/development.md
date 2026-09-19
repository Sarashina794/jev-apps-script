# 開発

ソースは `src/` が正。Apps Scriptエディタでの直接編集は正としない。

```bash
npm test          # 単体テスト（ネットワーク不要）
npm run build     # src/ -> dist/ 変換 + dist/の動作確認
npm run try       # 実際のJev APIを叩いて確認
npm run push      # build後に clasp push
npm run logs      # 実行ログを表示
npm run open      # Apps Scriptエディタを開く
```

## npm test

テストは `tests/` に集約し、`src/` の構造をそのまま写す。

```
tests/
├── helpers/   テスト共通のヘルパー（MockHttpClient、アサーション補助）
├── jev/       builders / parser / client
└── utils/     normalize / validate / errors / cache
```

テスト方針は `.claude/.skills/kb-unit-test` に従う（AAAパターン、
`正常系` / `準正常系` / `異常系` のプレフィックス、振る舞いベースの日本語テスト名）。

モックは責務境界（HTTP通信）にのみ使い、自作クラスはモックしない。
そのためAPIキーもネットワークも不要で動く。

公開関数（`JEV_NOUL` / `JEV_CHOICE` / `JEV_SCORE`）からHTTP境界までを通した確認は
`npm run build` の `verify-dist` が担当する。GASのグローバルAPIをスタブした単一スコープで
ビルド結果を実行するので、単体テストで結合部分を二重に検証する必要はない。

## npm run build

Apps Scriptにはモジュールが無く、全ファイルが同一のグローバルスコープに載る。
一方ローカルではCommonJSとして単体テストしたいので、`tools/build.js` がビルド時に
モジュール用の記述だけを取り除く。

- 末尾が `// build:strip` の行（`require` と分割代入）
- 末尾の `module.exports` 行

読み込み順を固定するため連番を付けて `dist/` へ出力する。
続けて `tools/verify-dist.js` が、GASのグローバルAPIをスタブした単一スコープへ
`dist/` 全体を読み込み、3関数・キャッシュ・エラー・公開範囲を検証する。

ビルドは明示リストのファイルだけを変換するので、`src/` 以外は自動的にデプロイ対象外になる
（`verify-dist` が `dist/` へのテストファイル混入も検査する）。

### Apps ScriptのV8で使えない構文

`#private` とクラスフィールド（`static x = ...`）はApps Scriptが解釈できず
`Unexpected token ILLEGAL` になる。NodeのV8は通してしまうので、
`tools/build.js` がこれらの構文を検出したらビルドを失敗させる。

## npm run try

実APIとのやり取りをデプロイ前に確認する。APIキーは `.env` か環境変数から読む。

```bash
npm run try -- noul   "先芯入り作業靴 JSAA A種" "この商品は安全靴ですか？"
npm run try -- choice "先芯入り作業靴" "カテゴリを判定してください" "作業服|安全靴|手袋|その他"
npm run try -- score  "納期が一日遅れました" "不満度を評価してください" "不満なし|少し不満|不満|非常に不満"
```

`--detail` を付けると `confidence` / `probabilities` / `usage` も表示する。
instructionや候補の調整はこれで詰めると早い。ローカルではCacheServiceが無いため毎回APIを呼ぶ。

カスタム関数は同期的に値を返す必要があるので本体は同期で書かれている。
Nodeの `fetch` は非同期なので、`tools/node-http-client.js` が子プロセスでfetchさせて
`execFileSync` で待ち、`JevHttpClient` と同じ形に揃えている。

## 設計

```
src/
├── functions/    シートへ公開する3関数（グローバル関数はここだけ）
├── jev/          JevService / JevQuestion / JevAnswer / JevClient / JevHttpClient
├── utils/        JevNormalize / JevValidate / JevCache / JevConfig / JevError
└── main.js       バージョン、エディタ用ヘルパー
tools/            ビルド・検証・ローカル実行（デプロイ対象外）
tests/            単体テストとテストヘルパー
```

`Spreadsheet Interface → Jev Domain Logic → HTTP Client` の一方向。公開関数がHTTP通信を
直接書くことはなく、`JevClient#request(state, questions)` の `questions` は常に配列なので、
将来のBatch実行を同じ経路で追加できる。

通信層は `JevService` / `JevClient` のコンストラクタで差し替えられる。

```js
new JevService({ httpClient: new MockHttpClient(...), apiKey: 'test-key' })
```

### private化の方針

GASでは **セルから呼べるのはグローバル関数だけ**で、クラスのstaticメソッドは
custom functionとして認識されない。したがって内部処理をクラスに入れるだけで、
シートからも実行メニューからも到達できなくなる。
`_prefix` のような命名規約は使わない（GASでは何も隠せていないため）。

- 公開：`JEV_NOUL` / `JEV_CHOICE` / `JEV_SCORE`
  ＋エディタから手動実行する `jevTestConnection` / `jevSetApiKey`
- 非公開：上記以外すべて（`JevClient` などのクラス経由でのみ到達可能）
- クラス内部だけで使うヘルパー（`toScalar` / `sha256Hex` / `ask` など）は
  IIFEのクロージャに閉じ込め、クラスの外からも参照できないようにする

`tools/verify-dist.js` が、ビルド結果のグローバル関数が上記5つだけであることを毎回検証する。

## 未実装（初版の範囲外）

- `JEV_BATCH`（複数質問を1リクエストで処理）
- 詳細レスポンス（`confidence` / `probabilities` / `raw`）— パーサ側は `JevAnswer.detail()` として用意済み
- カスタムメニュー（APIキー設定、接続確認、キャッシュクリア）
