#!/usr/bin/env node
/**
 * clasp用に dist/ を生成する。
 *
 * Apps Scriptにはモジュールが無く、全ファイルが同一のグローバルスコープに載る。
 * 一方でローカルではCommonJSとして単体テストしたいので、ビルド時に
 * モジュール用の記述だけを取り除く。
 *
 *   - 末尾が `// build:strip` の行（require と分割代入）
 *   - 末尾の `module.exports` 行
 *
 * 意図的に実行時へ残す require（Node専用のSHA-256フォールバック）は
 * `// build:keep` を付けて除外対象から外す。
 *
 * 出力ファイルにはApps Scriptエディタ上の読み込み順を固定するため連番を付ける。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// 依存順: utils -> jev -> 公開関数
const FILES = [
  'utils/errors.js',
  'utils/normalize.js',
  'utils/validate.js',
  'utils/config.js',
  'utils/cache.js',
  'jev/http.js',
  'jev/builders.js',
  'jev/parser.js',
  'jev/client.js',
  'jev/service.js',
  'functions/noul.js',
  'functions/choice.js',
  'functions/score.js',
  'main.js'
];

const STRIP_MARKER = '// build:strip';

function transform(source, relativePath) {
  const kept = [];
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.endsWith(STRIP_MARKER)) continue;
    if (trimmed.startsWith('if (typeof module !== ') && trimmed.includes('module.exports')) continue;
    if (trimmed.includes('module.exports')) {
      throw new Error(`${relativePath}: module.exports の書き方が想定外です:\n  ${trimmed}`);
    }
    if (/\brequire\(/.test(trimmed) && !trimmed.includes('typeof require') && !trimmed.includes('build:keep')) {
      throw new Error(`${relativePath}: require() には "${STRIP_MARKER}" を付けてください:\n  ${trimmed}`);
    }
    // Apps ScriptのV8はクラスフィールド構文（#private / static x =）を解釈しない。
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
    if (!isComment && (/(^|[^\w$])#[A-Za-z_$]/.test(trimmed) || /^static\s+[A-Za-z_$][\w$]*\s*=/.test(trimmed))) {
      throw new Error(`${relativePath}: Apps Scriptが解釈できないクラスフィールド構文です:\n  ${trimmed}`);
    }
    kept.push(line);
  }
  const body = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return `// src/${relativePath} から tools/build.js が生成。直接編集しない。\n\n${body}\n`;
}

function outputName(relativePath, index) {
  const flat = relativePath.replace(/\//g, '_').replace(/\.js$/, '');
  return `${String((index + 1) * 10).padStart(3, '0')}_${flat}.js`;
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  FILES.forEach((relativePath, index) => {
    const source = fs.readFileSync(path.join(SRC, relativePath), 'utf8');
    const name = outputName(relativePath, index);
    fs.writeFileSync(path.join(DIST, name), transform(source, relativePath));
    console.log(`  src/${relativePath} -> dist/${name}`);
  });

  fs.copyFileSync(path.join(ROOT, 'appsscript.json'), path.join(DIST, 'appsscript.json'));
  console.log(`  appsscript.json -> dist/appsscript.json`);
  console.log(`dist/ に ${FILES.length} ファイルを生成しました。`);
}

build();
