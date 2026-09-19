/**
 * =JEV_SCORE(state, instruction, levels)
 */

const { JevService } = require('../jev/service.js'); // build:strip
const { JevError } = require('../utils/errors.js'); // build:strip

/**
 * 複数段階の評価基準をもとにJevによるスコアリングを行う。
 *
 * @param {A1:A1} state 判定対象となるデータ。
 * @param {string} instruction Jevに実行させる評価内容。
 * @param {A1:A4} levels 評価段階のセル範囲、または "不満なし|少し不満|不満" 形式の文字列。低い段階から順に並べる。
 * @return {number} 確率分布から算出された連続値のスコア。
 * @customfunction
 */
function JEV_SCORE(state, instruction, levels) {
  try {
    return new JevService().score(state, instruction, levels);
  } catch (e) {
    throw JevError.wrap(e);
  }
}

if (typeof module !== 'undefined') { module.exports = { JEV_SCORE }; }
