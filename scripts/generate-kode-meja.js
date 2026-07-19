const mysql = require("mysql2/promise");
const { randomBytes } = require("crypto");
require("dotenv").config({ path: ".env" });

function generateKodeAkses() {
  return randomBytes(6).toString("hex");
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });

  const [rows] = await pool.query("SELECT id_meja, nomor_meja FROM Meja WHERE kode_akses IS NULL");

  console.log(`Ditemukan ${rows.length} meja yang belum punya kode akses.`);

  for (const row of rows) {
    const kode = generateKodeAkses();
    await pool.query("UPDATE Meja SET kode_akses = ? WHERE id_meja = ?", [kode, row.id_meja]);
    console.log(`Meja ${row.nomor_meja} (id: ${row.id_meja}) -> ${kode}`);
  }

  console.log("Selesai.");
  await pool.end();
}

main().catch(console.error);