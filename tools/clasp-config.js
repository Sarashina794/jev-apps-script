#!/usr/bin/env node
'use strict';
/**
 * .env / 環境変数の JEV_SCRIPT_ID から .clasp.json を生成する。
 *
 * claspはscriptIdをファイルからしか読まない（環境変数で渡せるのは
 * プロジェクトファイルの「パス」だけ）ため、push前にここで書き出す。
 * JEV_SCRIPT_ID が無く、既存の .clasp.json に scriptId があればそれを使う。
 */

const fs = require('fs');
const path = require('path');

const { loadDotEnv } = require('./dotenv.js');

const CONFIG = path.resolve(__dirname, '..', '.clasp.json');

function existingConfig() {
  if (!fs.existsSync(CONFIG)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG, 'utf8')) || {};
  } catch (e) {
    return {};
  }
}

function main() {
  loadDotEnv();
  const scriptId = (process.env.JEV_SCRIPT_ID || '').trim();

  const current = existingConfig();

  if (!scriptId) {
    if (current.scriptId && String(current.scriptId).trim() !== '') return; // 既存の .clasp.json をそのまま使う
    console.error(
      'デプロイ先が未設定です。\n' +
      '  .env に JEV_SCRIPT_ID=<Apps ScriptのスクリプトID> を書くか、\n' +
      '  .clasp.json の scriptId を設定してください。'
    );
    process.exit(1);
  }

  // clasp create-script が書いた parentId などは残す。ただしscriptIdが変わる＝
  // 別プロジェクトへの切り替えなので、その場合は引き継がない。
  const carried = current.scriptId === scriptId ? current : {};
  const config = Object.assign({}, carried, { scriptId, rootDir: 'dist' });
  fs.writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
  console.log('.clasp.json を生成しました（scriptId: ' + scriptId.slice(0, 8) + '…）');
}

main();
