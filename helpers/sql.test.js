"use strict";

const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["Aliya", 32]);
  });
});
