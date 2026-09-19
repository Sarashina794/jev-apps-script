/**
 * レスポンスParser。
 *
 * Jevの回答は型付きだが、壊れた・欠けたレスポンスがセルに `undefined` として
 * 出ることのないよう、ここで `JEV: ...` エラーへ変換する。
 */

const { JEV_MESSAGES, JevError } = require('../utils/errors.js'); // build:strip

const JevAnswer = (() => {
  function assertType(answer, expectedType) {
    if (!answer || typeof answer !== 'object') {
      throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, 'answerが存在しません。');
    }
    if (answer.type && answer.type !== expectedType) {
      throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, '期待した型は ' + expectedType + ' ですが ' + answer.type + ' でした。');
    }
    return answer;
  }

  function finiteNumber(value, detail) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, detail);
    }
    return num;
  }

  return class JevAnswer {
    /**
     * Noul -> 0〜1の確率。
     * Noulにconfidenceは無い。確率そのものが確信度を表す。
     */
    static noul(answer) {
      assertType(answer, 'noul');
      const value = finiteNumber(answer.noul, 'noulが数値ではありません。');
      if (value < 0 || value > 1) {
        throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, 'noulが範囲外です: ' + value);
      }
      return value;
    }

    /** Choice -> 選択された候補名。 */
    static choice(answer) {
      assertType(answer, 'choice');
      if (typeof answer.choice !== 'string' || answer.choice === '') {
        throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, 'choiceが存在しません。');
      }
      return answer.choice;
    }

    /**
     * Score -> 段階の確率分布から算出された連続値。
     * 最尤の段階のインデックスではない。
     */
    static score(answer) {
      assertType(answer, 'score');
      return finiteNumber(answer.score, 'scoreが数値ではありません。');
    }

    /** 種別に応じた値の取り出し。 */
    static value(answer, type) {
      if (type === 'noul') return JevAnswer.noul(answer);
      if (type === 'choice') return JevAnswer.choice(answer);
      return JevAnswer.score(answer);
    }

    /**
     * 回答の詳細。v0.1ではシートへ公開しないが、将来の
     * `confidence` / `probabilities` 出力を追加だけで実現できるよう用意しておく。
     */
    static detail(answer, type) {
      assertType(answer, type);
      return {
        type,
        value: JevAnswer.value(answer, type),
        confidence: typeof answer.confidence === 'number' ? answer.confidence : null,
        probabilities: answer.probabilities || null,
        legend: answer.legend || null,
        raw: answer
      };
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JevAnswer }; }
