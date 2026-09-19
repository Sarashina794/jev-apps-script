'use strict';
/**
 * ローカル実行用の通信層。デプロイ対象ではない（dist/には入らない）。
 *
 * カスタム関数は同期的に値を返す必要があるため、本体のコードは同期で書かれている。
 * Nodeの fetch は非同期なので、子プロセスでfetchさせて execFileSync で待つ。
 * これで JevHttpClient と同じ `post(url, options) -> {status, body}` を満たせる。
 */

const { execFileSync } = require('child_process');
const { JEV_MESSAGES, JevError } = require('../src/utils/errors.js');

const CHILD_SCRIPT = `
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', async () => {
  const req = JSON.parse(raw);
  try {
    const res = await fetch(req.url, { method: 'POST', headers: req.headers, body: req.payload });
    const body = await res.text();
    process.stdout.write(JSON.stringify({ status: res.status, body }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: e && e.message ? e.message : String(e) }));
  }
});
`;

class NodeHttpClient {
  post(url, options) {
    const request = {
      url,
      headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers),
      payload: options.payload
    };

    let raw;
    try {
      raw = execFileSync(process.execPath, ['-e', CHILD_SCRIPT], {
        input: JSON.stringify(request),
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 16 * 1024 * 1024
      });
    } catch (e) {
      throw new JevError(JEV_MESSAGES.REQUEST_FAILED, e && e.message);
    }

    const result = JSON.parse(raw);
    if (result.error) throw new JevError(JEV_MESSAGES.REQUEST_FAILED, result.error);
    return { status: result.status, body: result.body };
  }
}

module.exports = { NodeHttpClient };
