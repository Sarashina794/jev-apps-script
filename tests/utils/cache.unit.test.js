'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { JevCache } = require('../../src/utils/cache.js');

const QUESTION = { type: 'choice', instructions: 'カテゴリを判定', criteria: { 作業服: null, 安全靴: null } };

describe('JevCache.key', () => {
  it('正常系: 同じ入力を渡すと毎回同じキーを返す', () => {
    // Arrange / Act
    const first = JevCache.key('choice', '先芯入り作業靴', QUESTION);
    const second = JevCache.key('choice', '先芯入り作業靴', QUESTION);

    // Assert
    assert.strictEqual(first, second);
    assert.match(first, /^jev1_[0-9a-f]{64}$/);
  });

  it('正常系: 種別・state・instruction・候補のいずれかが異なると別のキーを返す', () => {
    // Arrange
    const base = JevCache.key('choice', '先芯入り作業靴', QUESTION);
    const otherType = JevCache.key('score', '先芯入り作業靴', QUESTION);
    const otherState = JevCache.key('choice', '長袖Tシャツ', QUESTION);
    const otherInstruction = JevCache.key('choice', '先芯入り作業靴', Object.assign({}, QUESTION, { instructions: '別の指示' }));
    const otherCriteria = JevCache.key('choice', '先芯入り作業靴', Object.assign({}, QUESTION, { criteria: { 作業服: null, 手袋: null } }));

    // Act
    const keys = new Set([base, otherType, otherState, otherInstruction, otherCriteria]);

    // Assert
    assert.strictEqual(keys.size, 5);
  });
});

describe('JevCache.get / put', () => {
  it('正常系: CacheServiceが無い環境ではgetがnullを返す', () => {
    // Arrange
    const key = JevCache.key('noul', 'state', { type: 'noul', instructions: 'x' });

    // Act
    const result = JevCache.get(key);

    // Assert
    assert.strictEqual(result, null);
  });

  it('正常系: CacheServiceが無い環境でもputは値をそのまま返す', () => {
    // Arrange
    const key = JevCache.key('noul', 'state', { type: 'noul', instructions: 'x' });

    // Act
    const result = JevCache.put(key, 0.92, 60);

    // Assert
    assert.strictEqual(result, 0.92);
  });
});
