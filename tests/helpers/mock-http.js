'use strict';

/**
 * 責務境界（HTTP通信）のみを差し替えるモック。
 * JevHttpClientと同じ `post(url, options) -> {status, body}` を満たす。
 */
class MockHttpClient {
  /**
   * @param {*} responses 1件なら毎回それを返し、配列なら順に返す。
   *   Errorインスタンスを渡すと通信例外を再現する。
   */
  constructor(responses) {
    this.queue = Array.isArray(responses) ? responses.slice() : [responses];
    this.calls = [];
  }

  post(url, options) {
    const next = this.queue.length > 1 ? this.queue.shift() : this.queue[0];
    this.calls.push({
      url,
      headers: options.headers,
      payload: JSON.parse(options.payload)
    });
    if (next instanceof Error) throw next;
    return {
      status: next.status === undefined ? 200 : next.status,
      body: typeof next.body === 'string' ? next.body : JSON.stringify(next.body)
    };
  }
}

/** 質問1件（id `q0`）に対するJev APIのレスポンスボディ。 */
function jevResponse(answer) {
  return {
    model: 'jev-1.13.0',
    answers: { q0: answer },
    usage: { input_tokens: 300, output_tokens: 20 }
  };
}

module.exports = { MockHttpClient, jevResponse };
