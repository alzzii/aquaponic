// db.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Alzikri1201',
  database: process.env.DB_NAME || 'aquaponic_monitoring'
});

// Coba koneksi saat file diimpor
db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke MySQL:', err.message);
  } else {
    console.log('✅ Terkoneksi ke database MySQL');
  }
});

module.exports = db;
