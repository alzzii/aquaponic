const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'sql12.freemysqlhosting.net',
  user: 'sql12793713',
  password: 'NuW3K1SbaE',
  database: 'sql12793713'
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi ke database gagal:', err);
    return;
  }
  console.log('Tersambung ke database!');
});

module.exports = db;
