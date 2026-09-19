'use strict';

const fs = require('fs');
const path = require('path');

/** リポジトリ直下の .env を読み込む（既存の環境変数は上書きしない）。 */
function loadDotEnv(file) {
  const target = file || path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(target)) return;
  for (const line of fs.readFileSync(target, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

module.exports = { loadDotEnv };
