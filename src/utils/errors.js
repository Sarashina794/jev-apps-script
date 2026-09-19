/**
 * Jevのエラー定義。
 *
 * HTTPステータスコード・レスポンスボディ・スタックトレースを
 * セルに出してはいけない。セルへ到達し得るエラーは必ずここを通す。
 */

/** 利用者に見えるメッセージ。他ファイルからも参照する。 */
const JEV_MESSAGES = {
  STATE_REQUIRED: 'state は必須です。',
  INSTRUCTION_REQUIRED: 'instruction は必須です。',
  CHOICES_MIN: 'choices には2つ以上の値が必要です。',
  LEVELS_MIN: 'levels には2つ以上の値が必要です。',
  API_KEY_MISSING: 'APIキーが設定されていません。',
  AUTH_FAILED: 'API認証に失敗しました。',
  RATE_LIMIT: 'レート制限に達しました。',
  UNAVAILABLE: 'APIが一時的に利用できません。',
  INVALID_REQUEST: 'リクエストが不正です。',
  REQUEST_FAILED: 'リクエストに失敗しました。',
  INVALID_RESPONSE: 'APIレスポンスを解釈できません。',
  UNEXPECTED: '予期しないエラーが発生しました。'
};

/** 開発者向けのログ。セルには表示されない。 */
class JevLog {
  static debug(message) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[jev] ' + message);
    }
  }
}

/**
 * セルに表示してよいエラー。
 * `detail` には調査用の生データを入れるが、メッセージには含めない。
 */
class JevError extends Error {
  constructor(message, detail) {
    super(JevError.PREFIX + message);
    this.name = 'JevError';
    if (detail !== undefined && detail !== null) this.detail = detail;
  }

  /** HTTPステータスから、利用者に見せてよいエラーを作る。 */
  static fromHttpStatus(status, body) {
    if (status === 401 || status === 403) return new JevError(JEV_MESSAGES.AUTH_FAILED, body);
    if (status === 429) return new JevError(JEV_MESSAGES.RATE_LIMIT, body);
    if (status >= 500) return new JevError(JEV_MESSAGES.UNAVAILABLE, body);
    if (status >= 400) return new JevError(JEV_MESSAGES.INVALID_REQUEST, body);
    return new JevError(JEV_MESSAGES.REQUEST_FAILED, body);
  }

  /** セルへ値が返る直前の最後の砦。想定外のエラーは汎用メッセージに丸める。 */
  static wrap(e) {
    if (e instanceof JevError) return e;
    JevLog.debug('想定外のエラー: ' + (e && e.stack ? e.stack : String(e)));
    return new JevError(JEV_MESSAGES.UNEXPECTED);
  }
}

// Apps ScriptのV8はクラスフィールド構文を解釈しないため、定義後に代入する。
JevError.PREFIX = 'JEV: ';

if (typeof module !== 'undefined') { module.exports = { JEV_MESSAGES, JevLog, JevError }; }
