'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { jevMessage } = require('../helpers/expect.js');
const { JevValidate } = require('../../src/utils/validate.js');

describe('JevValidate.state', () => {
  it('正常系: 値のあるstateを渡すとその値をそのまま返す', () => {
    // Arrange
    const state = '先芯入り作業靴';

    // Act
    const result = JevValidate.state(state);

    // Assert
    assert.strictEqual(result, '先芯入り作業靴');
  });

  it('準正常系: 空文字・空白のみ・null・undefinedを渡すとstate必須エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevValidate.state(''), jevMessage('state は必須です。'));
    assert.throws(() => JevValidate.state('   '), jevMessage('state は必須です。'));
    assert.throws(() => JevValidate.state(null), jevMessage('state は必須です。'));
    assert.throws(() => JevValidate.state(undefined), jevMessage('state は必須です。'));
  });

  it('準正常系: 空配列を渡すとstate必須エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevValidate.state([]), jevMessage('state は必須です。'));
  });
});

describe('JevValidate.instruction', () => {
  it('正常系: 値のあるinstructionを渡すとその値をそのまま返す', () => {
    // Arrange / Act
    const result = JevValidate.instruction('この商品は安全靴ですか？');

    // Assert
    assert.strictEqual(result, 'この商品は安全靴ですか？');
  });

  it('準正常系: 空文字・空白のみ・nullを渡すとinstruction必須エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevValidate.instruction(''), jevMessage('instruction は必須です。'));
    assert.throws(() => JevValidate.instruction('   '), jevMessage('instruction は必須です。'));
    assert.throws(() => JevValidate.instruction(null), jevMessage('instruction は必須です。'));
  });
});

describe('JevValidate.choices', () => {
  it('正常系: 候補が2件（最小件数）のとき配列をそのまま返す', () => {
    // Arrange
    const choices = ['作業服', '安全靴'];

    // Act
    const result = JevValidate.choices(choices);

    // Assert
    assert.deepStrictEqual(result, ['作業服', '安全靴']);
  });

  it('準正常系: 候補が1件・0件のとき候補数エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevValidate.choices(['作業服']), jevMessage('choices には2つ以上の値が必要です。'));
    assert.throws(() => JevValidate.choices([]), jevMessage('choices には2つ以上の値が必要です。'));
  });
});

describe('JevValidate.levels', () => {
  it('正常系: 評価段階が2件（最小件数）のとき配列をそのまま返す', () => {
    // Arrange / Act
    const result = JevValidate.levels(['不満なし', '不満']);

    // Assert
    assert.deepStrictEqual(result, ['不満なし', '不満']);
  });

  it('準正常系: 評価段階が1件・0件のとき段階数エラーをスローする', () => {
    // Arrange / Act / Assert
    assert.throws(() => JevValidate.levels(['不満なし']), jevMessage('levels には2つ以上の値が必要です。'));
    assert.throws(() => JevValidate.levels([]), jevMessage('levels には2つ以上の値が必要です。'));
  });
});
