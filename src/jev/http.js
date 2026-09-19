/**
 * HTTP通信層。
 *
 * UrlFetchAppを触る唯一の場所。テストでは同じ
 * `post(url, options) -> {status, body}` を持つMockHttpClientへ差し替える。
 */

const { JEV_MESSAGES, JevError, JevLog } = require('../utils/errors.js'); // build:strip

class JevHttpClient {
  /**
   * @param {string} url
   * @param {{headers: !Object, payload: string}} options
   * @return {{status: number, body: string}}
   */
  post(url, options) {
    if (typeof UrlFetchApp === 'undefined') {
      throw new JevError(JEV_MESSAGES.REQUEST_FAILED, 'UrlFetchAppが利用できません。');
    }
    let response;
    try {
      response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: options.headers,
        payload: options.payload,
        muteHttpExceptions: true
      });
    } catch (e) {
      JevLog.debug('ネットワークエラー: ' + (e && e.message ? e.message : String(e)));
      throw new JevError(JEV_MESSAGES.REQUEST_FAILED, e && e.message);
    }
    return {
      status: response.getResponseCode(),
      body: response.getContentText()
    };
  }
}

if (typeof module !== 'undefined') { module.exports = { JevHttpClient }; }
