#!/usr/bin/env node
'use strict';
/**
 * ローカルから実際のJev APIを叩いて動作を確認する。デプロイ対象ではない。
 *
 *   npm run try -- noul   "先芯入り作業靴" "この商品は安全靴ですか？"
 *   npm run try -- choice "先芯入り作業靴" "カテゴリを判定してください" "作業服|安全靴|手袋"
 *   npm run try -- score  "三度も問い合わせています" "不満度を評価してください" "不満なし|不満|非常に不満"
 *
 * --detail を付けると confidence / probabilities も表示する。
 * APIキーは環境変数 JEV_API_KEY、または .env から読む（.envはGit管理外）。
 */

const { loadDotEnv } = require('./dotenv.js');
const { NodeHttpClient } = require('./node-http-client.js');
const { JevService } = require('../src/jev/service.js');
const { JevClient } = require('../src/jev/client.js');
const { JevQuestion } = require('../src/jev/builders.js');
const { JevAnswer } = require('../src/jev/parser.js');
const { JevNormalize } = require('../src/utils/normalize.js');
const { JevValidate } = require('../src/utils/validate.js');

const USAGE = `使い方:
  npm run try -- <noul|choice|score> <state> <instruction> [choices|levels] [--detail]

例:
  npm run try -- noul   "先芯入り作業靴 JSAA A種" "この商品は安全靴ですか？"
  npm run try -- choice "先芯入り作業靴" "カテゴリを判定してください" "作業服|安全靴|手袋|その他"
  npm run try -- score  "三度も問い合わせています" "不満度を評価してください" "不満なし|不満|非常に不満" --detail

APIキー: 環境変数 JEV_API_KEY か .env の JEV_API_KEY`;

function buildQuestion(type, instruction, list) {
  if (type === 'noul') return JevQuestion.noul(instruction);
  if (type === 'choice') return JevQuestion.choice(instruction, list);
  return JevQuestion.score(instruction, list);
}

function main() {
  loadDotEnv();

  const args = process.argv.slice(2);
  const detail = args.includes('--detail');
  const [type, state, instruction, list] = args.filter((a) => a !== '--detail');

  if (!type || !state || !instruction) {
    console.error(USAGE);
    process.exit(1);
  }
  if (!['noul', 'choice', 'score'].includes(type)) {
    console.error(`未知の種別です: ${type}\n\n${USAGE}`);
    process.exit(1);
  }
  if (type !== 'noul' && !list) {
    console.error(`${type} には候補（"a|b|c" 形式）が必要です。\n\n${USAGE}`);
    process.exit(1);
  }
  if (!process.env.JEV_API_KEY) {
    console.error('JEV_API_KEY が未設定です。環境変数か .env に設定してください。');
    process.exit(1);
  }

  const httpClient = new NodeHttpClient();

  try {
    if (detail) {
      // 各クラスを直接組み合わせると confidence / probabilities まで取り出せる。
      const normalizedState = JevValidate.state(JevNormalize.state(state));
      const normalizedInstruction = JevValidate.instruction(JevNormalize.instruction(instruction));
      const question = buildQuestion(type, normalizedInstruction, list);
      const response = new JevClient({ httpClient }).request(normalizedState, [question]);
      console.log(JSON.stringify(JevAnswer.detail(response.answers[0], type), null, 2));
      console.log('usage:', JSON.stringify(response.usage));
      return;
    }

    // シート上と同じ経路。ローカルではCacheServiceが無いので毎回APIを呼ぶ。
    const service = new JevService({ httpClient, useCache: false });
    const value = type === 'noul' ? service.noul(state, instruction)
      : type === 'choice' ? service.choice(state, instruction, list)
        : service.score(state, instruction, list);
    console.log(value);
  } catch (e) {
    console.error(e.message);
    if (e.detail) console.error('detail:', e.detail);
    process.exit(1);
  }
}

main();
