'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { jevMessage } = require('../helpers/expect.js');
const { JevQuestion } = require('../../src/jev/builders.js');

describe('JevQuestion.noul', () => {
  it('正常系: instructionを渡すとnoul形式の質問を返す', () => {
    // Arrange
    const instruction = 'この商品は安全靴ですか？';

    // Act
    const result = JevQuestion.noul(instruction);

    // Assert
    assert.deepStrictEqual(result, {
      type: 'noul',
      instructions: 'この商品は安全靴ですか？'
    });
  });
});

describe('JevQuestion.choice', () => {
  it('正常系: セル範囲の候補を渡すと候補をキーにしたcriteriaを返す', () => {
    // Arrange
    const choices = [['作業服'], ['安全靴'], ['手袋']];

    // Act
    const result = JevQuestion.choice('カテゴリを判定してください', choices);

    // Assert
    assert.deepStrictEqual(result, {
      type: 'choice',
      instructions: 'カテゴリを判定してください',
      criteria: { 作業服: null, 安全靴: null, 手袋: null }
    });
  });

  it('正常系: パイプ区切りの文字列を渡してもセル範囲と同じ質問を返す', () => {
    // Arrange
    const range = [['作業服'], ['安全靴'], ['手袋']];

    // Act
    const fromString = JevQuestion.choice('x', '作業服|安全靴|手袋');
    const fromRange = JevQuestion.choice('x', range);

    // Assert
    assert.deepStrictEqual(fromString, fromRange);
  });

  it('正常系: 空セルと重複を含む候補を渡すとそれらを除いたcriteriaを返す', () => {
    // Arrange
    const choices = [['作業服'], [''], ['安全靴'], [null], ['作業服']];

    // Act
    const result = JevQuestion.choice('x', choices);

    // Assert
    assert.deepStrictEqual(Object.keys(result.criteria), ['作業服', '安全靴']);
  });

  it('準正常系: 有効な候補が1件しか残らないとき候補数エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevQuestion.choice('x', [['作業服']]), jevMessage('choices には2つ以上の値が必要です。'));
    assert.throws(() => JevQuestion.choice('x', [['作業服'], ['']]), jevMessage('choices には2つ以上の値が必要です。'));
    assert.throws(() => JevQuestion.choice('x', [['作業服'], ['作業服']]), jevMessage('choices には2つ以上の値が必要です。'));
    assert.throws(() => JevQuestion.choice('x', ''), jevMessage('choices には2つ以上の値が必要です。'));
  });
});

describe('JevQuestion.score', () => {
  it('正常系: 評価段階を渡すと順序を保った配列のcriteriaを返す', () => {
    // Arrange
    const levels = [['不満なし'], ['少し不満'], ['不満'], ['非常に不満']];

    // Act
    const result = JevQuestion.score('顧客の不満度を評価してください', levels);

    // Assert
    assert.deepStrictEqual(result, {
      type: 'score',
      instructions: '顧客の不満度を評価してください',
      criteria: ['不満なし', '少し不満', '不満', '非常に不満']
    });
  });

  it('準正常系: 有効な評価段階が1件しか残らないとき段階数エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevQuestion.score('x', [['不満なし']]), jevMessage('levels には2つ以上の値が必要です。'));
    assert.throws(() => JevQuestion.score('x', [['不満なし'], ['']]), jevMessage('levels には2つ以上の値が必要です。'));
  });
});
