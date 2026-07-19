import mysql from "mysql2/promise";

// Connection pool - dibuat sekali, dipakai ulang di semua Server Action
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 0,
});

export default pool;