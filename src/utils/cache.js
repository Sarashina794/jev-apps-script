/**
 * レスポンスキャッシュ。
 *
 * カスタム関数はシートの再計算のたびに再実行されるため、同じ
 * (state, instruction, choices) の組み合わせが何度も課金対象になり得る。
 * Apps Script上ではCacheServiceを使い、それ以外の環境では何もしない。
 */

const { JevConfig } = require('./config.js'); // build:strip

const JevCache = (() => {
  const PREFIX = 'jev1_';

  function sha256Hex(input) {
    if (typeof Utilities !== 'undefined') {
      const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
      let hex = '';
      for (const signed of bytes) {
        const b = (signed + 256) % 256;
        hex += (b < 16 ? '0' : '') + b.toString(16);
      }
      return hex;
    }
    // ローカル開発・テスト用。
    if (typeof require === 'function') {
      return require('crypto').createHash('sha256').update(input, 'utf8').digest('hex'); // build:keep
    }
    throw new Error('利用可能なSHA-256実装がありません。');
  }

  function store() {
    if (typeof CacheService === 'undefined') return null;
    try {
      return CacheService.getScriptCache();
    } catch (e) {
      return null;
    }
  }

  return class JevCache {
    /**
     * キャッシュキーは 関数種別 + state + 質問オブジェクト から生成する。
     * 質問オブジェクトには instruction と正規化済みの choices / levels が含まれる。
     */
    static key(type, state, question) {
      const raw = [type, JSON.stringify(state), JSON.stringify(question)].join(' ');
      return PREFIX + sha256Hex(raw);
    }

    /** キャッシュ値を返す。存在しない場合・無効な場合はnull。 */
    static get(key) {
      const cache = store();
      if (!cache) return null;
      try {
        const raw = cache.get(key);
        if (raw === null || raw === undefined) return null;
        return JSON.parse(raw).v;
      } catch (e) {
        return null;
      }
    }

    static put(key, value, ttlSeconds) {
      const ttl = ttlSeconds === undefined || ttlSeconds === null ? JevConfig.cacheTtl() : ttlSeconds;
      if (!ttl) return value;
      const cache = store();
      if (!cache) return value;
      try {
        cache.put(key, JSON.stringify({ v: value }), ttl);
      } catch (e) {
        // キャッシュの書き込み失敗でセルを壊してはいけない。
      }
      return value;
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JevCache }; }
