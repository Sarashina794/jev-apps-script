'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const { JevError } = require('../../src/utils/errors.js');

describe('JevError.fromHttpStatus', () => {
  it('準正常系: 401・403を渡すと認証失敗のJevErrorを返す', () => {
    // Arrange / Act
    const unauthorized = JevError.fromHttpStatus(401);
    const forbidden = JevError.fromHttpStatus(403);

    // Assert
    assert.ok(unauthorized instanceof JevError);
    assert.strictEqual(unauthorized.message, 'JEV: API認証に失敗しました。');
    assert.strictEqual(forbidden.message, 'JEV: API認証に失敗しました。');
  });

  it('準正常系: 429を渡すとレート制限のJevErrorを返す', () => {
    // Arrange / Act
    const error = JevError.fromHttpStatus(429);

    // Assert
    assert.strictEqual(error.message, 'JEV: レート制限に達しました。');
  });

  it('準正常系: その他の4xxを渡すとリクエスト不正のJevErrorを返す', () => {
    // Arrange / Act
    const error = JevError.fromHttpStatus(422);

    // Assert
    assert.strictEqual(error.message, 'JEV: リクエストが不正です。');
  });

  it('異常系: 5xx（500・529）を渡すと一時的に利用できない旨のJevErrorを返す', () => {
    // Arrange / Act / Assert
    assert.strictEqual(JevError.fromHttpStatus(500).message, 'JEV: APIが一時的に利用できません。');
    assert.strictEqual(JevError.fromHttpStatus(529).message, 'JEV: APIが一時的に利用できません。');
  });

  it('準正常系: レスポンスボディを渡してもメッセージには含めずdetailにのみ保持する', () => {
    // Arrange
    const body = '{"error":"invalid key sk-live-123"}';

    // Act
    const error = JevError.fromHttpStatus(401, body);

    // Assert
    assert.strictEqual(error.message, 'JEV: API認証に失敗しました。');
    assert.strictEqual(error.message.includes('sk-live-123'), false);
    assert.strictEqual(error.detail, body);
  });
});

describe('JevError.wrap', () => {
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

  it('正常系: JevErrorを渡すと同じインスタンスをそのまま返す', () => {
    // Arrange
    const original = JevError.fromHttpStatus(429);

    // Act
    const result = JevError.wrap(original);

    // Assert
    assert.strictEqual(result, original);
    assert.deepStrictEqual(logged, []);
  });

  it('異常系: JevError以外のエラーを渡すと汎用メッセージのJevErrorを返し、詳細はログにのみ出す', () => {
    // Arrange
    const internal = new TypeError('Cannot read properties of undefined');

    // Act
    const result = JevError.wrap(internal);

    // Assert
    assert.ok(result instanceof JevError);
    assert.strictEqual(result.message, 'JEV: 予期しないエラーが発生しました。');
    assert.strictEqual(result.message.includes('Cannot read properties'), false);
    assert.strictEqual(logged.length, 1);
    assert.strictEqual(logged[0].includes('Cannot read properties of undefined'), true);
  });
});
