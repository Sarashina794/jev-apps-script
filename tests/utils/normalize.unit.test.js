'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { JevNormalize } = require('../../src/utils/normalize.js');

describe('JevNormalize.list', () => {
  it('正常系: 1列のセル範囲を渡すと一次元配列を返す', () => {
    // Arrange
    const range = [['作業服'], ['安全靴'], ['手袋']];

    // Act
    const result = JevNormalize.list(range);

    // Assert
    assert.deepStrictEqual(result, ['作業服', '安全靴', '手袋']);
    assert.deepStrictEqual(range, [['作業服'], ['安全靴'], ['手袋']]); // 引数が変更されていない
  });

  it('正常系: パイプ区切りの文字列を渡すと分割した配列を返す', () => {
    // Arrange
    const text = '作業服|安全靴|手袋|靴下|その他';

    // Act
    const result = JevNormalize.list(text);

    // Assert
    assert.deepStrictEqual(result, ['作業服', '安全靴', '手袋', '靴下', 'その他']);
  });

  it('正常系: 空文字・空白・nullのセルを渡すとそれらを除外して返す', () => {
    // Arrange
    const range = [['作業服'], [''], ['  '], [null], ['手袋']];

    // Act
    const result = JevNormalize.list(range);

    // Assert
    assert.deepStrictEqual(result, ['作業服', '手袋']);
  });

  it('正常系: 要素が1件だけの範囲を渡すと1件の配列を返す', () => {
    // Arrange
    const range = [['作業服']];

    // Act
    const result = JevNormalize.list(range);

    // Assert
    assert.deepStrictEqual(result, ['作業服']);
  });

  it('正常系: 空文字・null・空セルのみの範囲を渡すと空配列を返す', () => {
    // Arrange / Act / Assert
    assert.deepStrictEqual(JevNormalize.list(''), []);
    assert.deepStrictEqual(JevNormalize.list(null), []);
    assert.deepStrictEqual(JevNormalize.list(undefined), []);
    assert.deepStrictEqual(JevNormalize.list([['']]), []);
  });

  it('正常系: 数値のセルを渡すと文字列の配列を返す', () => {
    // Arrange
    const range = [[0], [1], [2]];

    // Act
    const result = JevNormalize.list(range);

    // Assert
    assert.deepStrictEqual(result, ['0', '1', '2']);
  });
});

describe('JevNormalize.uniqueList', () => {
  it('正常系: 重複を含む範囲を渡すと順序を保ったまま重複を除いた配列を返す', () => {
    // Arrange
    const range = [['安全靴'], ['手袋'], ['安全靴']];

    // Act
    const result = JevNormalize.uniqueList(range);

    // Assert
    assert.deepStrictEqual(result, ['安全靴', '手袋']);
  });
});

describe('JevNormalize.state', () => {
  it('正常系: 単一セルの範囲を渡すとスカラーの文字列を返す', () => {
    // Arrange
    const range = [['作業服 25.5cm']];

    // Act
    const result = JevNormalize.state(range);

    // Assert
    assert.strictEqual(result, '作業服 25.5cm');
  });

  it('正常系: 複数列の範囲を渡すと行構造を保った配列を返す', () => {
    // Arrange
    const range = [['品名', '安全靴'], ['サイズ', '25.5']];

    // Act
    const result = JevNormalize.state(range);

    // Assert
    assert.deepStrictEqual(result, [['品名', '安全靴'], ['サイズ', '25.5']]);
  });

  it('正常系: 空行を含む1列の範囲を渡すと空行を除いた一次元配列を返す', () => {
    // Arrange
    const range = [['一行目'], [''], ['二行目']];

    // Act
    const result = JevNormalize.state(range);

    // Assert
    assert.deepStrictEqual(result, ['一行目', '二行目']);
  });

  it('正常系: Dateを渡すとISO文字列を返す', () => {
    // Arrange
    const date = new Date(Date.UTC(2026, 8, 19));

    // Act
    const result = JevNormalize.state(date);

    // Assert
    assert.strictEqual(result, '2026-09-19T00:00:00.000Z');
  });

  it('正常系: 空の範囲・nullを渡すと空文字を返す', () => {
    // Arrange / Act / Assert
    assert.strictEqual(JevNormalize.state([['', '']]), '');
    assert.strictEqual(JevNormalize.state(null), '');
    assert.strictEqual(JevNormalize.state(undefined), '');
  });
});

describe('JevNormalize.instruction', () => {
  it('正常系: 前後に空白のある文字列を渡すと空白を除いた文字列を返す', () => {
    // Arrange
    const text = '  これは安全靴ですか？ ';

    // Act
    const result = JevNormalize.instruction(text);

    // Assert
    assert.strictEqual(result, 'これは安全靴ですか？');
  });

  it('正常系: 複数セルの範囲を渡すと改行で連結した文字列を返す', () => {
    // Arrange
    const range = [['一行目'], ['二行目']];

    // Act
    const result = JevNormalize.instruction(range);

    // Assert
    assert.strictEqual(result, '一行目\n二行目');
  });
});

describe('JevNormalize.isEmpty', () => {
  it('正常系: 空文字・空白のみ・null・undefinedを渡すとtrueを返す', () => {
    // Arrange / Act / Assert
    assert.strictEqual(JevNormalize.isEmpty(''), true);
    assert.strictEqual(JevNormalize.isEmpty('   '), true);
    assert.strictEqual(JevNormalize.isEmpty(null), true);
    assert.strictEqual(JevNormalize.isEmpty(undefined), true);
  });

  it('正常系: 0とfalseを渡すとfalseを返す', () => {
    // Arrange / Act / Assert
    assert.strictEqual(JevNormalize.isEmpty(0), false);
    assert.strictEqual(JevNormalize.isEmpty(false), false);
  });
});
