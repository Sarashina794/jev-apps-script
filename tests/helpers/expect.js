'use strict';

/**
 * セルに表示されるメッセージそのものを検証する assert.throws 用マッチャ。
 * （正規表現を直接渡すと "JevError: JEV: ..." と照合されてしまう）
 */
function jevMessage(text) {
  return (error) => error && error.message === 'JEV: ' + text;
}

module.exports = { jevMessage };
