/**
 * Jev APIクライアント。
 *
 * 公開関数がHTTPリクエストを組み立てることはなく、必ずここを経由する。
 * 通信層はコンストラクタで差し替えられるので、ネットワーク無しでテストできる。
 */

const { JEV_MESSAGES, JevError, JevLog } = require('../utils/errors.js'); // build:strip
const { JevConfig } = require('../utils/config.js'); // build:strip
const { JevHttpClient } = require('./http.js'); // build:strip

const JevClient = (() => {
  const QUESTION_ID_PREFIX = 'q';

  return class JevClient {
    /**
     * @param {{httpClient: Object, apiKey: string, endpoint: string, model: string}=} options
     */
    constructor(options) {
      const opts = options || {};
      this.httpClient = opts.httpClient || new JevHttpClient();
      // APIキーなどはリクエスト時に解決する。生成しただけで失敗させない。
      this.apiKey = opts.apiKey || null;
      this.endpoint = opts.endpoint || null;
      this.model = opts.model || null;
    }

    /**
     * Jev APIへ1回リクエストを送る。
     *
     * questions は単一の質問でも常に配列で渡す。これにより将来のBatch実行を
     * このシグネチャのまま追加できる。
     *
     * @param {string|Array|Object} state 正規化済みのstate。
     * @param {!Array<!Object>} questions 構築済みの質問オブジェクト。
     * @return {{model: string, answers: !Array<!Object>, usage: Object, raw: !Object}}
     */
    request(state, questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new JevError(JEV_MESSAGES.INVALID_REQUEST, 'questionsは1件以上の配列である必要があります。');
      }

      const questionMap = {};
      const ids = [];
      questions.forEach((question, index) => {
        const id = QUESTION_ID_PREFIX + index;
        ids.push(id);
        questionMap[id] = question;
      });

      const payload = {
        model: this.model || JevConfig.model(),
        state,
        questions: questionMap
      };

      let response;
      try {
        response = this.httpClient.post(this.endpoint || JevConfig.endpoint(), {
          headers: {
            Authorization: 'Bearer ' + (this.apiKey || JevConfig.apiKey())
          },
          payload: JSON.stringify(payload)
        });
      } catch (e) {
        if (e instanceof JevError) throw e;
        JevLog.debug('通信エラー: ' + (e && e.message ? e.message : String(e)));
        throw new JevError(JEV_MESSAGES.REQUEST_FAILED, e && e.message);
      }

      if (!response || typeof response.status !== 'number') {
        throw new JevError(JEV_MESSAGES.REQUEST_FAILED, '通信層のレスポンス形式が不正です。');
      }

      if (response.status < 200 || response.status >= 300) {
        JevLog.debug('HTTP ' + response.status + ': ' + response.body);
        throw JevError.fromHttpStatus(response.status, response.body);
      }

      let parsed;
      try {
        parsed = JSON.parse(response.body);
      } catch (e) {
        JevLog.debug('レスポンスがJSONとして解釈できません: ' + response.body);
        throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, 'ボディがJSONではありません。');
      }

      if (!parsed || !parsed.answers) {
        throw new JevError(JEV_MESSAGES.INVALID_RESPONSE, 'answersが存在しません。');
      }

      return {
        model: parsed.model,
        answers: ids.map((id) => parsed.answers[id]),
        usage: parsed.usage || null,
        raw: parsed
      };
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JevClient }; }
