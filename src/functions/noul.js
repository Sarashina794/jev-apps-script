/**
 * =JEV_NOUL(state, instruction)
 *
 * セルから呼べるのはグローバル関数だけなので、シートへ公開するのは
 * このファイルの1関数のみ。内部処理はすべてクラス側にある。
 */

const { JevService } = require('../jev/service.js'); // build:strip
const { JevError } = require('../utils/errors.js'); // build:strip

/**
 * データに対する二値的な判断をJevに実行させる。
 *
 * @param {A1:A1} state 判定対象となるデータ。
 * @param {string} instruction Jevに実行させる判定内容。
 * @return {number} 条件に該当する確率 (0〜1)。
 * @customfunction
 */
function JEV_NOUL(state, instruction) {
  try {
    return new JevService().noul(state, instruction);
  } catch (e) {
    throw JevError.wrap(e);
  }
}

if (typeof module !== 'undefined') { module.exports = { JEV_NOUL }; }
