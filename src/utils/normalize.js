/**
 * スプレッドシートの値をJevで扱える形へ正規化する。
 *
 * セル範囲が2次元配列で渡ってくることを知っているのは、このファイルだけ。
 *
 * GASではトップレベルの関数がすべてグローバルになるため、内部ヘルパーは
 * クロージャに閉じ込めてクラスの外から呼べないようにする。
 */

const JevNormalize = (() => {
  const LIST_SEPARATOR = /[|\n]/;

  function toScalar(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value.trim();
    return String(value);
  }

  function flatten(value) {
    if (!Array.isArray(value)) return [value];
    let out = [];
    for (const item of value) {
      if (Array.isArray(item)) {
        out = out.concat(flatten(item));
      } else {
        out.push(item);
      }
    }
    return out;
  }

  return class JevNormalize {
    static isEmpty(value) {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      return false;
    }

    /**
     * choices / levels を、空値を除いた文字列の一次元配列へ変換する。
     *
     *   [["作業服"], ["安全靴"], [""]]   -> ["作業服", "安全靴"]
     *   "作業服|安全靴|手袋"              -> ["作業服", "安全靴", "手袋"]
     */
    static list(value) {
      let items;
      if (typeof value === 'string') {
        items = value.split(LIST_SEPARATOR);
      } else if (Array.isArray(value)) {
        items = flatten(value);
      } else if (JevNormalize.isEmpty(value)) {
        items = [];
      } else {
        items = [value];
      }

      // toScalarが空白をtrimし、null/undefinedを空文字にするので、
      // 空セルの除外はこの1行で足りる。
      const out = [];
      for (const item of items) {
        const text = toScalar(item);
        if (text !== '') out.push(text);
      }
      return out;
    }

    /** list() と同じだが重複を除く（Choiceのcriteriaはキーになるため）。 */
    static uniqueList(value) {
      return Array.from(new Set(JevNormalize.list(value)));
    }

    /**
     * state を正規化する。
     *
     * 単一セルはスカラーに、セル範囲は行構造を保ったままにする。
     * 複数列（項目名と値の組など）の対応関係をJevへ伝えるため。
     */
    static state(value) {
      if (!Array.isArray(value)) {
        return JevNormalize.isEmpty(value) ? '' : toScalar(value);
      }

      const rows = [];
      for (const rawRow of value) {
        const row = Array.isArray(rawRow) ? rawRow : [rawRow];
        const cells = [];
        for (const cell of row) {
          if (JevNormalize.isEmpty(cell)) continue;
          cells.push(toScalar(cell));
        }
        if (cells.length === 0) continue;
        rows.push(cells.length === 1 ? cells[0] : cells);
      }

      if (rows.length === 0) return '';
      if (rows.length === 1 && !Array.isArray(rows[0])) return rows[0];
      return rows;
    }

    /** instruction を1つの文字列へ正規化する。 */
    static instruction(value) {
      if (Array.isArray(value)) {
        return JevNormalize.list(value).join('\n');
      }
      return JevNormalize.isEmpty(value) ? '' : toScalar(value);
    }
  };
})();

if (typeof module !== 'undefined') { module.exports = { JevNormalize }; }
