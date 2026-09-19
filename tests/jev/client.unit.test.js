'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const { jevMessage } = require('../helpers/expect.js');
const { MockHttpClient, jevResponse } = require('../helpers/mock-http.js');
const { JevClient } = require('../../src/jev/client.js');

const QUESTION = { type: 'noul', instructions: 'この商品は安全靴ですか？' };

describe('JevClient.request', () => {
  let logged;
  let originalError;

  beforeEach(() => {
    logged = [];
    originalError = console.error;
    console.error = (message) => { logged.push(message); };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('正常系: 質問を渡すと所定のURL・認証ヘッダ・ペイロードで1回だけPOSTする', () => {
    // Arrange
    const http = new MockHttpClient({ body: jevResponse({ type: 'noul', noul: 0.92 }) });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key', model: 'jev-latest' });

    // Act
    const result = client.request('先芯入り作業靴', [QUESTION]);

    // Assert
    assert.strictEqual(http.calls.length, 1);
    assert.strictEqual(http.calls[0].url, 'https://api.typesafe.ai/v1/systemone');
    assert.deepStrictEqual(http.calls[0].headers, { Authorization: 'Bearer test-key' });
    assert.deepStrictEqual(http.calls[0].payload, {
      model: 'jev-latest',
      state: '先芯入り作業靴',
      questions: { q0: QUESTION }
    });
    assert.deepStrictEqual(result.answers, [{ type: 'noul', noul: 0.92 }]);
    assert.deepStrictEqual(result.usage, { input_tokens: 300, output_tokens: 20 });
  });

  it('正常系: 複数の質問を渡すとq0から順にidを振り、同じ順序でanswersを返す', () => {
    // Arrange
    const http = new MockHttpClient({
      body: {
        model: 'jev-1.13.0',
        answers: { q0: { type: 'noul', noul: 0.1 }, q1: { type: 'noul', noul: 0.9 } }
      }
    });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act
    const result = client.request('state', [QUESTION, QUESTION]);

    // Assert
    assert.deepStrictEqual(Object.keys(http.calls[0].payload.questions), ['q0', 'q1']);
    assert.deepStrictEqual(result.answers, [
      { type: 'noul', noul: 0.1 },
      { type: 'noul', noul: 0.9 }
    ]);
  });

  it('準正常系: 空の質問配列を渡すとリクエスト不正エラーをスローし、通信しない', () => {
    // Arrange
    const http = new MockHttpClient({ body: jevResponse({ type: 'noul', noul: 1 }) });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', []), jevMessage('リクエストが不正です。'));
    assert.strictEqual(http.calls.length, 0);
  });

  it('準正常系: APIが401を返すと認証失敗エラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient({ status: 401, body: '{"error":"invalid key"}' });
    const client = new JevClient({ httpClient: http, apiKey: 'wrong-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('API認証に失敗しました。'));
    assert.strictEqual(http.calls.length, 1);
  });

  it('準正常系: APIが429を返すとレート制限エラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient({ status: 429, body: '{"error":"slow down"}' });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('レート制限に達しました。'));
  });

  it('異常系: APIが503を返すと一時的に利用できないエラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient({ status: 503, body: 'Service Unavailable' });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('APIが一時的に利用できません。'));
  });

  it('異常系: 通信層が例外を投げるとリクエスト失敗エラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient(new Error('DNS lookup failed'));
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('リクエストに失敗しました。'));
    assert.strictEqual(logged.length, 1);
  });

  it('異常系: JSONでないボディが返ると解釈不能エラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient({ status: 200, body: '<html>502 Bad Gateway</html>' });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('APIレスポンスを解釈できません。'));
  });

  it('異常系: answersを含まないボディが返ると解釈不能エラーをスローする', () => {
    // Arrange
    const http = new MockHttpClient({ status: 200, body: { model: 'jev-1.13.0' } });
    const client = new JevClient({ httpClient: http, apiKey: 'test-key' });

    // Act / Assert
    assert.throws(() => client.request('state', [QUESTION]), jevMessage('APIレスポンスを解釈できません。'));
  });
});
