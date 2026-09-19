/**
 * 公開関数が共通で行う入力検証。
 *
 * HTTPリクエストの前に実行するため、不正な入力でAPIを消費することはない。
 */

const { JEV_MESSAGES, JevError } = require('./errors.js'); // build:strip
const { JevNormalize } = require('./normalize.js'); // build:strip

class JevValidate {
  static state(state) {
    if (state === null || state === undefined) throw new JevError(JEV_MESSAGES.STATE_REQUIRED);
    if (typeof state === 'string' && state.trim() === '') throw new JevError(JEV_MESSAGES.STATE_REQUIRED);
    if (Array.isArray(state) && state.length === 0) throw new JevError(JEV_MESSAGES.STATE_REQUIRED);
    return state;
  }

  static instruction(instruction) {
    if (JevNormalize.isEmpty(instruction)) throw new JevError(JEV_MESSAGES.INSTRUCTION_REQUIRED);
    return instruction;
  }

  static choices(choices) {
    if (!Array.isArray(choices) || choices.length < 2) throw new JevError(JEV_MESSAGES.CHOICES_MIN);
    return choices;
  }

  static levels(levels) {
    if (!Array.isArray(levels) || levels.length < 2) throw new JevError(JEV_MESSAGES.LEVELS_MIN);
    return levels;
  }
}

if (typeof module !== 'undefined') { module.exports = { JevValidate }; }
