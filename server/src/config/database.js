import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection for the whole server.
//
// The codebase was written against mysql2's promise API, so this module keeps
// that calling convention on top of `pg`:
//   const [rows]   = await db.query('SELECT ... WHERE id = ?', [id]);
//   const [result] = await db.query('INSERT ...', [...]);   // result.insertId, result.affectedRows
//   const conn = await db.getConnection();  conn.beginTransaction() / commit() / rollback() / release()
// Placeholders stay as `?` in the SQL and are rewritten to $1, $2, ... here.

// COUNT(*) and SUM(int) come back as int8; return them as JS numbers.
pg.types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      user: process.env.DB_USER || process.env.USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME || 'stayhub',
    };

if (process.env.DB_SSL === 'true') {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const pgPool = new pg.Pool({
  ...connectionConfig,
  max: 10,
  connectionTimeoutMillis: 10000,
});

pgPool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !Buffer.isBuffer(value);

const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;

// Values that reach a jsonb column un-stringified are sent as JSON text.
const normalizeValue = (value) => {
  if (value === undefined) return null;
  if (Array.isArray(value) || isPlainObject(value)) return JSON.stringify(value);
  return value;
};

/**
 * Rewrite a mysql-style statement (`?` placeholders) into a pg statement.
 * Supports the mysql2 conveniences the code relies on:
 *   - `IN (?)` with an array            -> IN ($1, $2, ...)
 *   - `VALUES ?` with an array of rows  -> VALUES ($1, $2), ($3, $4)
 *   - `UPDATE t SET ?` with an object   -> SET "a" = $1, "b" = $2
 *   - `INSERT INTO t SET ?` with object -> INSERT INTO t ("a", "b") VALUES ($1, $2)
 */
export const toPg = (sql, params = []) => {
  const input = Array.isArray(params) ? params : [params];
  const values = [];
  let paramIndex = 0;
  let text = '';
  const push = (value) => {
    values.push(normalizeValue(value));
    return `$${values.length}`;
  };

  const insertSet = /^(\s*INSERT\s+INTO\s+[`"\w.]+)\s+SET\s+\?\s*;?\s*$/i.exec(sql);
  if (insertSet && isPlainObject(input[0])) {
    const row = input[0];
    const keys = Object.keys(row);
    const table = insertSet[1].replace(/`/g, '"');
    return {
      text: `${table} (${keys.map(quoteIdent).join(', ')}) VALUES (${keys.map((k) => push(row[k])).join(', ')})`,
      values,
    };
  }

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "'") {
      // string literal ('' is an escaped quote)
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") break;
        else j += 1;
      }
      text += sql.slice(i, j + 1);
      i = j;
    } else if (ch === '"') {
      const j = sql.indexOf('"', i + 1);
      const end = j === -1 ? sql.length - 1 : j;
      text += sql.slice(i, end + 1);
      i = end;
    } else if (ch === '`') {
      const j = sql.indexOf('`', i + 1);
      const end = j === -1 ? sql.length - 1 : j;
      text += quoteIdent(sql.slice(i + 1, end));
      i = end;
    } else if (ch === '-' && next === '-') {
      const j = sql.indexOf('\n', i);
      const end = j === -1 ? sql.length : j;
      text += sql.slice(i, end);
      i = end - 1;
    } else if (ch === '/' && next === '*') {
      const j = sql.indexOf('*/', i + 2);
      const end = j === -1 ? sql.length : j + 2;
      text += sql.slice(i, end);
      i = end - 1;
    } else if (ch === '?') {
      const value = input[paramIndex];
      paramIndex += 1;
      if (Array.isArray(value)) {
        if (value.length === 0) {
          text += 'NULL';
        } else if (value.every(Array.isArray)) {
          text += value.map((row) => `(${row.map(push).join(', ')})`).join(', ');
        } else {
          text += value.map(push).join(', ');
        }
      } else if (isPlainObject(value)) {
        text += Object.keys(value)
          .map((key) => `${quoteIdent(key)} = ${push(value[key])}`)
          .join(', ');
      } else {
        text += push(value);
      }
    } else {
      text += ch;
    }
  }

  return { text, values };
};

// Shape a pg result like mysql2 does: rows for SELECT, a result header otherwise.
const toMysqlShape = (result) => {
  const res = Array.isArray(result) ? result[result.length - 1] : result;
  if (res.command === 'SELECT' || res.command === 'SHOW') {
    return [res.rows, res.fields];
  }
  const firstId = res.rows?.[0]?.id;
  return [
    {
      affectedRows: res.rowCount ?? 0,
      changedRows: res.rowCount ?? 0,
      insertId: typeof firstId === 'number' ? firstId : 0,
      rows: res.rows || [],
    },
    res.fields,
  ];
};

const run = async (executor, sql, params) => {
  const statement = toPg(sql, params);
  // mysql2 exposed the new id as result.insertId; get it back with RETURNING.
  if (/^\s*INSERT\b/i.test(statement.text) && !/\bRETURNING\b/i.test(statement.text)) {
    statement.text = `${statement.text.replace(/;\s*$/, '')} RETURNING *`;
  }
  return toMysqlShape(await executor.query(statement));
};

const wrapClient = (client) => {
  let inTransaction = false;
  let released = false;
  let savepoint = 0;

  // Inside a transaction every statement runs in its own savepoint. PostgreSQL
  // aborts the whole transaction on the first error; MySQL only fails that one
  // statement, and some flows catch a failed statement and carry on.
  const query = async (sql, params) => {
    if (!inTransaction) return run(client, sql, params);
    savepoint += 1;
    const name = `sp_${savepoint}`;
    await client.query(`SAVEPOINT ${name}`);
    try {
      const result = await run(client, sql, params);
      await client.query(`RELEASE SAVEPOINT ${name}`);
      return result;
    } catch (error) {
      await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
      throw error;
    }
  };

  return {
    query,
    execute: query,
    beginTransaction: async () => {
      await client.query('BEGIN');
      inTransaction = true;
    },
    commit: async () => {
      await client.query('COMMIT');
      inTransaction = false;
    },
    rollback: async () => {
      if (inTransaction) await client.query('ROLLBACK');
      inTransaction = false;
    },
    release: () => {
      if (released) return;
      released = true;
      client.release();
    },
  };
};

export const query = (sql, params) => run(pgPool, sql, params);

export const getConnection = async () => wrapClient(await pgPool.connect());

export const pool = {
  query,
  execute: query,
  getConnection,
  end: () => pgPool.end(),
  on: (event, handler) => pgPool.on(event, handler),
};
// Some modules reach the pool as `db.pool`.
pool.pool = pool;

export default pool;
