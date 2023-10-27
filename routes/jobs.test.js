"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let j1Id;

beforeEach(async () => {
  await db.query("DELETE FROM jobs");

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

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJobData = {
    title: "new",
    salary: 1,
    equity: "1.0",
    companyHandle: "c1"
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJobData)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJobData
      },
    });
  });

  test("bad for non admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJobData)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJobData)
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 1,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJobData,
        invalidField: "invalid",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: j1Id,
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
          }
        ],
    });
  });

  test("ok filter by title", async function () {
    const resp = await request(app).get("/jobs").query({ title: "j1" });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: j1Id,
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
          }
        ],
    });
  });

  test("ok filter by minSalary", async function () {
    const resp = await request(app).get("/jobs").query({ minSalary: 1 });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: j1Id,
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
          }
        ],
    });
  });

  test("ok filter by hasEquity", async function () {
    const resp = await request(app).get("/jobs").query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: j1Id,
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
          },
        ],
    });
  });

  test("not ok filter by minSalary less than 0", async function () {
    const resp = await request(app).get("/jobs").query({ minSalary: -1 });
    expect(resp.body).toEqual({
      error: {
        message: ["instance.minSalary must be greater than or equal to 0",],
        status: 400,
      }
    });
  });

  test("not ok filter by invalid filter", async function () {
    const resp = await request(app).get("/jobs").query({ invalidFilter: "invalid" });
    expect(resp.body).toEqual({
      error: {
        message: ["instance is not allowed to have the additional property \"invalidFilter\""],
        status: 400,
      }
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${j1Id}`);
    expect(resp.body).toEqual({
      job: {
        id: j1Id,
        title: "j1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      }
    });
  });

  test("works for anon: job w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/${j1Id}`);
    expect(resp.body).toEqual({
      job: {
        id: j1Id,
        title: "j1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: j1Id,
        title: "j1-new",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: "j1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/-1`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id and companyHandle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        id: 1,
        companyHandle: "new-company",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: -1,
        salary: "not-a-salary",
        equity: -1
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${j1Id}` });
  });

  test("unauth for non admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/-1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
