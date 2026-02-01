import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
const log = console.log;

dotenv.config();

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  timezone: '+00:00'
}

/**
 * MySQL Connection Pool
 */
const pool = mysql.createPool(config);


/**
 * Reusable SQL runner
 * @param {string} sql
 * @param {Array} values
 * @returns {Promise<Array>}
 */
export async function runSql(sql, values = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, values);
    return rows;
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Export pool if direct access is needed
 */
export { pool };
