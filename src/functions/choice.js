/**
 * =JEV_CHOICE(state, instruction, choices)
 */

const { JevService } = require('../jev/service.js'); // build:strip
const { JevError } = require('../utils/errors.js'); // build:strip

/**
 * 複数の候補から最も適切な選択肢をJevに選択させる。
 *
 * @param {A1:A1} state 判定対象となるデータ。
 * @param {string} instruction Jevに実行させる判定内容。
 * @param {A1:A5} choices 候補のセル範囲、または "作業服|安全靴|手袋" 形式の文字列。
 * @return {string} 選択された候補。
 * @customfunction
 */
function JEV_CHOICE(state, instruction, choices) {
  try {
    return new JevService().choice(state, instruction, choices);
  } catch (e) {
    throw JevError.wrap(e);
  }
}

if (typeof module !== 'undefined') { module.exports = { JEV_CHOICE }; }
