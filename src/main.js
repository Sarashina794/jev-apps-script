/**
 * エントリポイントとエディタ用ヘルパー。
 *
 * セルに入力して使うのは JEV_NOUL / JEV_CHOICE / JEV_SCORE のみ。
 * 以下の2つはエディタの実行メニューから手動で動かすためにグローバル関数にしている。
 */

const { JevService } = require('./jev/service.js'); // build:strip
const { JEV_PROPERTY_KEYS } = require('./utils/config.js'); // build:strip

const JEV_SHEETS_VERSION = '0.1.0';

/**
 * APIキーの設定とJevとの疎通を確認する。
 * エディタから実行し、実行ログを確認する。
 */
function jevTestConnection() {
  const value = new JevService({ useCache: false }).noul('空は青い。', 'この記述は正しいですか？');
  console.log('jev-sheets ' + JEV_SHEETS_VERSION + ': 疎通OK, noul=' + value);
  return value;
}

/**
 * APIキーをスクリプトプロパティへ保存する。
 * エディタから実行する際に引数へ貼り付ける。キーは絶対にcommitしない。
 */
function jevSetApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('APIキーを引数で渡すか、プロジェクトの設定で ' + JEV_PROPERTY_KEYS.API_KEY + ' を設定してください。');
  }
  PropertiesService.getScriptProperties().setProperty(JEV_PROPERTY_KEYS.API_KEY, String(apiKey).trim());
  console.log(JEV_PROPERTY_KEYS.API_KEY + ' を保存しました。');
}

if (typeof module !== 'undefined') { module.exports = { JEV_SHEETS_VERSION, jevTestConnection }; }
