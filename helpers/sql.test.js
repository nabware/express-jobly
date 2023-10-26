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

  test("doesn't work: not passing jsToSql param", function () {
    const dataToUpdate = { age: 32 };

    expect(() => sqlForPartialUpdate(dataToUpdate))
      .toThrow("Cannot read properties of undefined (reading 'age')");
  });
});
