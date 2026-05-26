import mysql from 'mysql2/promise';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createPool = (env) => {
  return mysql.createPool({
    host: env.MYSQL_HOST,
    port: toInt(env.MYSQL_PORT, 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

