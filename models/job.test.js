"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let j1Id;

beforeEach(async () => {
  const jobsResponse = await db.query(`
  INSERT INTO jobs(title,
                    salary,
                    equity,
                    company_handle)
  VALUES ('j1', 1, '0.1', 'c1')
  RETURNING id`
  );

  j1Id = jobsResponse.rows[0].id;
});

afterEach(async () => {
  await db.query("DELETE FROM jobs");
});

/************************************** create */

describe("create", function () {
  const newJobData = {
    title: "new",
    salary: 1,
    equity: "1.0",
    companyHandle: "c1"
  };

  test("works", async function () {
    const job = await Job.create(newJobData);
    expect(job).toEqual({
      id: job.id,
      ...newJobData
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = '${job.id}'`);
    expect(result.rows).toEqual([newJobData]);
  });

  test("bad request with invalid company handle", async function () {
    try {
      await Job.create({
        title: "new",
        salary: 1,
        equity: "1.0",
        companyHandle: "invalid-company-handle"
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: j1Id,
        title: "j1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      }
    ]);
  });

  // test("works: filter by name", async function () {
  //   const filters = { nameLike: "C1" };
  //   let jobs = await Job.findAll(filters);
  //   expect(jobs).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     }
  //   ]);
  // });

  // test("works: filter by minEmployees", async function () {
  //   const filters = { minEmployees: 3 };
  //   let jobs = await Job.findAll(filters);
  //   expect(jobs).toEqual([
  //     {
  //       handle: "c3",
  //       name: "C3",
  //       description: "Desc3",
  //       numEmployees: 3,
  //       logoUrl: "http://c3.img",
  //     }
  //   ]);
  // });

  // test("works: filter by name and maxEmployees", async function () {
  //   const filters = { nameLike: "c2", maxEmployees: 2 };
  //   let jobs = await Job.findAll(filters);
  //   expect(jobs).toEqual([
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //   ]);
  // });

  // test("doesn't work: filter by minEmployees greater than maxEmployees", async function () {
  //   const filters = { minEmployees: 3, maxEmployees: 2 };
  //   try {
  //     await Job.findAll(filters);
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });

  // test("doesn't work: filter by invalid filter", async function () {
  //   const filters = { invalidFilter: "invalid" };
  //   try {
  //     await Job.findAll(filters);
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });
});

// /************************************** _sqlForJobsWhere */

// describe("_sqlForJobsWhere", function () {
//   test("works", async function () {
//     const filters = { nameLike: "hall", minEmployees: 3 };
//     const response = Job._sqlForJobsWhere(filters);
//     expect(response).toEqual({
//       whereCols: "WHERE name ILIKE $1 AND num_employees >= $2",
//       values: ["%hall%", 3]
//     });
//   });

//   test("doesn't work: filter by invalid filter", async function () {
//     const filters = { invalidFilter: "invalid" };
//     const response = Job._sqlForJobsWhere(filters);
//     expect(response).toEqual({ whereCols: "", values: [] });
//   });
// });

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(j1Id);
    expect(job).toEqual({
      id: j1Id,
      title: "j1",
      salary: 1,
      equity: "0.1",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updated",
    salary: 2,
    equity: "0.5"
  };

  test("works", async function () {
    const updatedJob = await Job.update(j1Id, updateData);
    expect(updatedJob).toEqual({
      id: j1Id,
      companyHandle: "c1",
      ...updateData
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${j1Id}`);
    expect(result.rows).toEqual([{
      id: j1Id,
      title: "Updated",
      salary: 2,
      equity: "0.5",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Updated",
      salary: null,
      equity: null
    };

    let job = await Job.update(j1Id, updateDataSetNulls);
    expect(job).toEqual({
      id: j1Id,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${j1Id}`);
    expect(result.rows).toEqual([{
      id: j1Id,
      companyHandle: "c1",
      title: "Updated",
      salary: null,
      equity: null
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(-1, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(j1Id, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with id and company_handle", async function () {
    try {
      await Job.update(
        j1Id,
        {
          id: 1,
          company_handle: "c2",
          ...updateData
        })
        ;
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(j1Id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id='${j1Id}'`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
