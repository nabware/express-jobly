"use strict";

const { BadRequestError } = require("../expressError");

/** Helper to build SQL UPDATE SET statement.
 *
 * Takes object of col names and updated values and
 * object of optional JS to SQL col name conversions and
 * returns parameterized SET statement string and
 * array of the parameterized values.
 *
 * Input: {firstName: 'Aliya', age: 32}, {firstName: 'first_name'}
 * Output: {setCols: ['"first_name"=$1, '"age"=$2'], values: ["Aliya", 32]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
