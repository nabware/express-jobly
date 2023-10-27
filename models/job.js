"use strict";

const { query } = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company doesn't exist.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [companyHandle]);

    if (!companyCheck.rows[0])
      throw new BadRequestError(`Company doesn't exist: ${companyHandle}`);

    const result = await db.query(`
                INSERT INTO jobs (title,
                                       salary,
                                       equity,
                                       company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle,
    ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ORDER BY title`);
    return jobsRes.rows;
  }

  /** Helper to build SQL WHERE statement for job.
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

  // static _sqlForJobsWhere(dataToFilter) {
  //   const keys = Object.keys(dataToFilter);
  //   if (keys.length === 0) return { whereCols: "", values: [] };

  //   const cols = [];
  //   let idx = 0;

  //   for (const colName in dataToFilter) {
  //     if (colName === "nameLike") {
  //       dataToFilter[colName] = `%${dataToFilter[colName]}%`;

  //       cols.push(`name ILIKE $${idx + 1}`);

  //     } else if (colName === "minEmployees") {
  //       cols.push(`num_employees >= $${idx + 1}`);

  //     } else if (colName === "maxEmployees") {
  //       cols.push(`num_employees <= $${idx + 1}`);

  //     } else {
  //       continue;
  //     }

  //     idx += 1;
  //   }

  //   if (cols.length === 0) return { whereCols: "", values: [] };

  //   return {
  //     whereCols: "WHERE " + cols.join(" AND "),
  //     values: Object.values(dataToFilter),
  //   };
  // }

  /** Given a job id, return data about job.
   *
   * Returns {id, title, salary, equity, companyHandle}
   *   where jobs is [{id, title, salary, equity, companyHandle}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle      AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    if (data.id !== undefined || data.company_handle !== undefined) {
      throw new BadRequestError("Cannot update id and/or company_handle.");
    }
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
