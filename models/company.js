"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    if (filters.minEmployees > filters.maxEmployees) {
      throw new BadRequestError(
        "Invalid filter: minEmployees cannot be greater than maxEmployees"
      );
    }
    const { whereCols, values } = Company._sqlForCompaniesWhere(filters);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${whereCols}
        ORDER BY name`, values);
    return companiesRes.rows;
  }

  /** Helper to build SQL WHERE statement for company.
   *
   * Takes object of optional filter keys and values and
   * returns parameterized WHERE statement string and
   * array of the parameterized values.
   *
   * Input: {nameLike: "hall", minEmployees: 3}
   * Output: {
   *    whereCols: "WHERE name ILIKE $1 AND num_employees >= $2",
   *    values: ["%hall%", 3]
   * }
   */

  static _sqlForCompaniesWhere(dataToFilter) {
    const keys = Object.keys(dataToFilter);
    if (keys.length === 0) return { whereCols: "", values: [] };

    const cols = [];
    let idx = 0;

    for (const colName in dataToFilter) {
      if (colName === "nameLike") {
        dataToFilter[colName] = `%${dataToFilter[colName]}%`;

        cols.push(`name ILIKE $${idx + 1}`);

      } else if (colName === "minEmployees") {
        cols.push(`num_employees >= $${idx + 1}`);

      } else if (colName === "maxEmployees") {
        cols.push(`num_employees <= $${idx + 1}`);

      } else {
        continue;
      }

      idx += 1;
    }

    if (cols.length === 0) return { whereCols: "", values: [] };

    return {
      whereCols: "WHERE " + cols.join(" AND "),
      values: Object.values(dataToFilter),
    };
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity
        FROM jobs
        WHERE company_handle = $1`, [handle]);

    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
