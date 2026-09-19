/**
 * 実行時設定。
 *
 * 秘密情報はソースツリーに置かない。Apps Script上ではスクリプトプロパティ、
 * ローカルでは環境変数からAPIキーを取得する。
 */

const { JEV_MESSAGES, JevError } = require('./errors.js'); // build:strip

/** スクリプトプロパティのキー。設定手順の案内でも使う。 */
const JEV_PROPERTY_KEYS = {
  API_KEY: 'JEV_API_KEY',
  ENDPOINT: 'JEV_API_ENDPOINT',
  MODEL: 'JEV_MODEL',
  CACHE_TTL: 'JEV_CACHE_TTL'
};

const JevConfig = (() => {
  const DEFAULTS = {
    ENDPOINT: 'https://api.typesafe.ai/v1/systemone',
    MODEL: 'jev-latest',
    CACHE_TTL_SECONDS: 21600 // CacheServiceの上限（6時間）
  };

  function property(key) {
    if (typeof PropertiesService === 'undefined') {
      // ローカル開発時はスクリプトプロパティの代わりに環境変数を見る。
      if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
      return null;
    }
    try {
      return PropertiesService.getScriptProperties().getProperty(key);
    } catch (e) {
      return null;
    }
  }

  return class JevConfig {
    static apiKey() {
      const key = property(JEV_PROPERTY_KEYS.API_KEY);
      if (!key || String(key).trim() === '') throw new JevError(JEV_MESSAGES.API_KEY_MISSING);
      return String(key).trim();
    }

    static endpoint() {
      return property(JEV_PROPERTY_KEYS.ENDPOINT) || DEFAULTS.ENDPOINT;
    }

    static model() {
      return property(JEV_PROPERTY_KEYS.MODEL) || DEFAULTS.MODEL;
    }

    /** TTLは設定可能。0を指定するとキャッシュを無効にする。 */
    static cacheTtl() {
      const raw = property(JEV_PROPERTY_KEYS.CACHE_TTL);
      if (raw === null || raw === undefined || String(raw).trim() === '') return DEFAULTS.CACHE_TTL_SECONDS;
      const ttl = parseInt(raw, 10);
      if (isNaN(ttl) || ttl < 0) return DEFAULTS.CACHE_TTL_SECONDS;
      return Math.min(ttl, DEFAULTS.CACHE_TTL_SECONDS);
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JEV_PROPERTY_KEYS, JevConfig }; }
