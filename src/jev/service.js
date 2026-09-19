/**
 * Jevドメインサービス。
 *
 * 検証 -> 質問構築 -> キャッシュ参照 -> リクエスト -> 解釈 までを担い、
 * SpreadsheetAppには一切依存しない。CLIやWebなど他のI/Fからも再利用できる。
 */

const { JevNormalize } = require('../utils/normalize.js'); // build:strip
const { JevValidate } = require('../utils/validate.js'); // build:strip
const { JevCache } = require('../utils/cache.js'); // build:strip
const { JevQuestion } = require('./builders.js'); // build:strip
const { JevAnswer } = require('./parser.js'); // build:strip
const { JevClient } = require('./client.js'); // build:strip

const JevService = (() => {
  function buildQuestion(type, instruction, list) {
    if (type === 'noul') return JevQuestion.noul(instruction);
    if (type === 'choice') return JevQuestion.choice(instruction, list);
    if (type === 'score') return JevQuestion.score(instruction, list);
    throw new Error('未知のJev質問種別です: ' + type);
  }

  /** 質問1件を最初から最後まで実行する。 */
  function ask(service, type, state, instruction, list) {
    const normalizedState = JevNormalize.state(state);
    const normalizedInstruction = JevNormalize.instruction(instruction);
    JevValidate.state(normalizedState);
    JevValidate.instruction(normalizedInstruction);

    const question = buildQuestion(type, normalizedInstruction, list);

    const cacheKey = service.useCache ? JevCache.key(type, normalizedState, question) : null;
    if (cacheKey) {
      const cached = JevCache.get(cacheKey);
      if (cached !== null && cached !== undefined) return cached;
    }

    const response = service.client.request(normalizedState, [question]);
    const value = JevAnswer.value(response.answers[0], type);

    if (cacheKey) JevCache.put(cacheKey, value, service.cacheTtl);
    return value;
  }

  return class JevService {
    /**
     * @param {{httpClient: Object, apiKey: string, endpoint: string, model: string,
     *          useCache: boolean, cacheTtl: number}=} options
     */
    constructor(options) {
      const opts = options || {};
      this.client = opts.client || new JevClient(opts);
      this.useCache = opts.useCache !== false;
      this.cacheTtl = opts.cacheTtl;
    }

    /**
     * @param {*} state セルの生値またはセル範囲。
     * @param {*} instruction セルの生値。
     * @return {number} 0〜1の確率。
     */
    noul(state, instruction) {
      return ask(this, 'noul', state, instruction, null);
    }

    /**
     * @param {*} choices セル範囲、配列、または "a|b|c" 形式の文字列。
     * @return {string} 選択された候補。
     */
    choice(state, instruction, choices) {
      return ask(this, 'choice', state, instruction, choices);
    }

    /**
     * @param {*} levels セル範囲、配列、または "a|b|c" 形式の文字列。
     * @return {number} 連続値のスコア。
     */
    score(state, instruction, levels) {
      return ask(this, 'score', state, instruction, levels);
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JevService }; }
