#!/usr/bin/env node
/**
 * dist/ をApps Scriptと同じ条件で動作確認する。
 *
 * 全ファイルを1つの共有グローバルスコープへ読み込み、UrlFetchApp /
 * PropertiesService / CacheService / Utilities をスタブする。
 * 単体テストでは検出できないもの（ビルドで除去し損ねたrequire、
 * ファイルの読み込み順の問題、CacheServiceの誤用）を捕まえる。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const DIST = path.resolve(__dirname, '..', 'dist');

function buildSandbox(fetchImpl) {
  const properties = { JEV_API_KEY: 'test-key' };
  const cache = new Map();

  return {
    console,
    UrlFetchApp: { fetch: fetchImpl },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => (key in properties ? properties[key] : null),
        setProperty: (key, value) => { properties[key] = value; }
      })
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => (cache.has(key) ? cache.get(key) : null),
        put: (key, value) => { cache.set(key, value); }
      })
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_algorithm, input) =>
        Array.from(crypto.createHash('sha256').update(input, 'utf8').digest())
          .map((b) => (b > 127 ? b - 256 : b))
    }
  };
}

function loadDist(sandbox) {
  const context = vm.createContext(sandbox);
  const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.js')).sort();
  for (const file of files) {
    const source = fs.readFileSync(path.join(DIST, file), 'utf8');
    if (/\brequire\(/.test(source) && !/typeof require/.test(source)) {
      throw new Error(`${file}: require() がビルド後も残っています。`);
    }
    vm.runInContext(source, context, { filename: `dist/${file}` });
  }
  return { context, files };
}

function jevReply(answer) {
  return JSON.stringify({
    model: 'jev-1.13.0',
    answers: { q0: answer },
    usage: { input_tokens: 1, output_tokens: 1 }
  });
}

/** セルから呼べるのはグローバル関数だけ。ここに挙げた名前以外は公開しない。 */
const EXPECTED_GLOBAL_FUNCTIONS = [
  'JEV_CHOICE',
  'JEV_NOUL',
  'JEV_SCORE',
  'jevSetApiKey',
  'jevTestConnection'
];

function globalFunctionNames(context, stubNames) {
  return Object.keys(context)
    .filter((name) => !stubNames.includes(name))
    .filter((name) => typeof context[name] === 'function')
    .sort();
}

function run() {
  const replies = [];
  let fetchCount = 0;
  const sandbox = buildSandbox(() => {
    fetchCount += 1;
    const body = replies.shift();
    return { getResponseCode: () => 200, getContentText: () => body };
  });

  const stubNames = Object.keys(sandbox);
  const { context, files } = loadDist(sandbox);

  // 単体テストは src/ に同居しているので、混入していないことを確認する。
  const leaked = files.filter((name) => name.includes('test'));
  assert.deepStrictEqual(leaked, [], 'テストファイルがdist/に混入しています。');
  console.log(`  Apps Script相当のスコープへ ${files.length} ファイルを読み込みました。`);

  // クラスは字句スコープに入るだけでグローバル関数にはならない＝セルから呼べない。
  assert.deepStrictEqual(
    globalFunctionNames(context, stubNames),
    EXPECTED_GLOBAL_FUNCTIONS,
    'シートから見えるグローバル関数が想定と異なります。'
  );
  console.log(`  シートへ公開されるグローバル関数は ${EXPECTED_GLOBAL_FUNCTIONS.join(', ')} のみです。`);

  replies.push(jevReply({ type: 'noul', noul: 0.92 }));
  assert.strictEqual(context.JEV_NOUL('先芯入り作業靴', 'この商品は安全靴ですか？'), 0.92);

  replies.push(jevReply({ type: 'choice', choice: '安全靴', confidence: 0.8 }));
  assert.strictEqual(
    context.JEV_CHOICE('先芯入り作業靴', 'カテゴリを判定してください', [['作業服'], ['安全靴'], ['手袋']]),
    '安全靴'
  );

  replies.push(jevReply({ type: 'score', score: 2.37, confidence: 0.7 }));
  assert.strictEqual(
    context.JEV_SCORE('三度も問い合わせています', '不満度を評価してください', '不満なし|少し不満|不満|非常に不満'),
    2.37
  );

  assert.strictEqual(fetchCount, 3, '異なる質問ごとに1リクエストのはず');

  // 同じ3つの呼び出しは、すべてCacheServiceから返るはず。
  assert.strictEqual(context.JEV_NOUL('先芯入り作業靴', 'この商品は安全靴ですか？'), 0.92);
  assert.strictEqual(
    context.JEV_CHOICE('先芯入り作業靴', 'カテゴリを判定してください', [['作業服'], ['安全靴'], ['手袋']]),
    '安全靴'
  );
  assert.strictEqual(fetchCount, 3, '同一入力の再実行はキャッシュから返すこと');
  console.log('  同一入力の再実行がキャッシュから返ることを確認しました。');

  assert.throws(() => context.JEV_NOUL('', 'x'), (e) => e.message === 'JEV: state は必須です。');
  assert.throws(
    () => context.JEV_CHOICE('x', 'y', [['候補が1件だけ']]),
    (e) => e.message === 'JEV: choices には2つ以上の値が必要です。'
  );
  console.log('  Validationエラーが JEV: メッセージとしてセルへ返ることを確認しました。');

  console.log('dist/ の動作確認が完了しました。');
}

run();
