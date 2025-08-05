const mysql = require('mysql2');
require('dotenv').config();
const { URL } = require('url');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL tidak ditemukan di env');
  process.exit(1);
}

const parsedUrl = new URL(dbUrl);

const db = mysql.createConnection({
  host: parsedUrl.hostname,
  port: parsedUrl.port || 3306,
  user: parsedUrl.username,
  password: parsedUrl.password,
  database: parsedUrl.pathname.replace('/', '')
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke MySQL:', err.message);
  } else {
    console.log('✅ Terkoneksi ke database MySQL');
  }
});

module.exports = db;
