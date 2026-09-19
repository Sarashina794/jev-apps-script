/**
 * 質問ビルダー。
 *
 * スプレッドシート由来の引数を、Jevの質問オブジェクト1件へ変換する。
 * 通信は一切行わない。
 */

const { JevNormalize } = require('../utils/normalize.js'); // build:strip
const { JevValidate } = require('../utils/validate.js'); // build:strip

class JevQuestion {
  /**
   * Noul：1つの命題を確率で答えさせる。
   * @param {string} instruction
   * @return {{type: string, instructions: string}}
   */
  static noul(instruction) {
    return {
      type: 'noul',
      instructions: instruction
    };
  }

  /**
   * Choice：criteriaは候補をキーとしたオブジェクト。値のnullは
   * 「候補名がそのまま説明になる」ことを意味する。
   * @param {string} instruction
   * @param {*} choices セル範囲、配列、または "a|b|c" 形式の文字列。
   */
  static choice(instruction, choices) {
    const options = JevValidate.choices(JevNormalize.uniqueList(choices));
    const criteria = {};
    for (const option of options) {
      criteria[option] = null;
    }
    return {
      type: 'choice',
      instructions: instruction,
      criteria
    };
  }

  /**
   * Score：criteriaは評価段階を低い順に並べた配列。
   * @param {string} instruction
   * @param {*} levels セル範囲、配列、または "a|b|c" 形式の文字列。
   */
  static score(instruction, levels) {
    const ordered = JevValidate.levels(JevNormalize.list(levels));
    return {
      type: 'score',
      instructions: instruction,
      criteria: ordered
    };
  }
}

if (typeof module !== 'undefined') { module.exports = { JevQuestion }; }
