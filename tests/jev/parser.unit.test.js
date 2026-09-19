'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { jevMessage } = require('../helpers/expect.js');
const { JevAnswer } = require('../../src/jev/parser.js');

const INVALID_RESPONSE = jevMessage('APIレスポンスを解釈できません。');

describe('JevAnswer.noul', () => {
  it('正常系: noul回答を渡すと確率を返す', () => {
    // Arrange
    const answer = { type: 'noul', noul: 0.92 };

    // Act
    const result = JevAnswer.noul(answer);

    // Assert
    assert.strictEqual(result, 0.92);
  });

  it('正常系: 境界値の0と1を渡すとそのまま返す', () => {
    // Arrange / Act / Assert
    assert.strictEqual(JevAnswer.noul({ type: 'noul', noul: 0 }), 0);
    assert.strictEqual(JevAnswer.noul({ type: 'noul', noul: 1 }), 1);
  });

  it('異常系: 0〜1の範囲外の値を渡すと解釈不能エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevAnswer.noul({ type: 'noul', noul: 1.4 }), INVALID_RESPONSE);
    assert.throws(() => JevAnswer.noul({ type: 'noul', noul: -0.1 }), INVALID_RESPONSE);
  });

  it('異常系: noulが欠けている・数値でない回答を渡すと解釈不能エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevAnswer.noul({ type: 'noul' }), INVALID_RESPONSE);
    assert.throws(() => JevAnswer.noul({ type: 'noul', noul: 'たぶん' }), INVALID_RESPONSE);
    assert.throws(() => JevAnswer.noul(null), INVALID_RESPONSE);
  });

  it('異常系: 別の種別の回答を渡すと解釈不能エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevAnswer.noul({ type: 'choice', choice: '安全靴' }), INVALID_RESPONSE);
  });
});

describe('JevAnswer.choice', () => {
  it('正常系: choice回答を渡すと選択された候補名を返す', () => {
    // Arrange
    const answer = { type: 'choice', choice: '安全靴', confidence: 0.82, probabilities: { 安全靴: 0.82 } };

    // Act
    const result = JevAnswer.choice(answer);

    // Assert
    assert.strictEqual(result, '安全靴');
  });

  it('異常系: choiceが欠けている・空文字の回答を渡すと解釈不能エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevAnswer.choice({ type: 'choice' }), INVALID_RESPONSE);
    assert.throws(() => JevAnswer.choice({ type: 'choice', choice: '' }), INVALID_RESPONSE);
  });
});

describe('JevAnswer.score', () => {
  it('正常系: score回答を渡すと段階の番号ではなく連続値のスコアを返す', () => {
    // Arrange
    const answer = {
      type: 'score',
      score: 2.37,
      confidence: 0.71,
      probabilities: { 0: 0, 1: 0.1, 2: 0.43, 3: 0.47 }
    };

    // Act
    const result = JevAnswer.score(answer);

    // Assert
    assert.strictEqual(result, 2.37);
  });

  it('異常系: scoreが欠けている・数値でない回答を渡すと解釈不能エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevAnswer.score({ type: 'score' }), INVALID_RESPONSE);
    assert.throws(() => JevAnswer.score({ type: 'score', score: 'high' }), INVALID_RESPONSE);
  });
});

describe('JevAnswer.detail', () => {
  it('正常系: score回答を渡すと値・confidence・probabilities・legendを含む詳細を返す', () => {
    // Arrange
    const answer = {
      type: 'score',
      score: 1.08,
      confidence: 0.92,
      legend: { 0: '不満なし', 1: '少し不満' },
      probabilities: { 0: 0.08, 1: 0.92 }
    };

    // Act
    const result = JevAnswer.detail(answer, 'score');

    // Assert
    assert.deepStrictEqual(result, {
      type: 'score',
      value: 1.08,
      confidence: 0.92,
      probabilities: { 0: 0.08, 1: 0.92 },
      legend: { 0: '不満なし', 1: '少し不満' },
      raw: answer
    });
  });

  it('正常系: confidenceを持たないnoul回答を渡すとconfidenceがnullの詳細を返す', () => {
    // Arrange
    const answer = { type: 'noul', noul: 0.96 };

    // Act
    const result = JevAnswer.detail(answer, 'noul');

    // Assert
    assert.strictEqual(result.value, 0.96);
    assert.strictEqual(result.confidence, null);
    assert.strictEqual(result.probabilities, null);
  });
});
