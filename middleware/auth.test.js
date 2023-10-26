"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrCorrectUser,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works: valid login", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});

describe("ensureIsAdmin", function () {
  test("works: valid admin login", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureIsAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureIsAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureIsAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });
});

describe("ensureIsAdminOrCorrectUser", function () {
  test("works: admin login", function () {
    const req = { params: { username: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureIsAdminOrCorrectUser(req, res, next);
  });

  test("works: non admin correct user", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    ensureIsAdminOrCorrectUser(req, res, next);
  });

  test("unauth if not admin and incorrect user", function () {
    const req = { params: { username: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureIsAdminOrCorrectUser(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { } } };
    expect(() => ensureIsAdminOrCorrectUser(req, res, next))
        .toThrow(UnauthorizedError);
  });
});