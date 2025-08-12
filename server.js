// Import library yang dibutuhkan
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb'); // <-- BARU

// Gunakan port dari environment variable atau default ke 8080
const PORT = process.env.PORT || 8080;

// ===== KONEKSI DATABASE (BARU) =====
// Ambil Connection String dari Environment Variable di Railway
const uri = process.env.MONGODB_URI; 
if (!uri) {
  console.error("Error: MONGODB_URI tidak ditemukan. Pastikan sudah diatur di Railway.");
  process.exit(1); // Hentikan aplikasi jika URI tidak ada
}

// Buat klien MongoDB
const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db; // Variabel untuk menyimpan koneksi database

async function connectToDb() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("aquaponic_db"); // Pilih atau buat database bernama 'aquaponic_db'
    console.log("✓ Berhasil terhubung ke MongoDB Atlas!");
  } catch(e) {
    console.error("Gagal terhubung ke MongoDB:", e);
    await mongoClient.close();
  }
}
// ===================================

// Inisialisasi server Express
const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('WebSocket Server with MongoDB is running!');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client baru terhubung!');
  ws.send('Selamat datang di WebSocket Server!');

  ws.on('message', async (message) => { // <-- Tambah 'async'
    console.log('Menerima pesan: %s', message);

    try {
      const parsedMessage = JSON.parse(message);

      // Jika ini data sensor dari ESP32, simpan ke database
      if (parsedMessage.type === 'sensorData') {
        if (db) {
          // Pilih atau buat collection bernama 'sensor_readings'
          const collection = db.collection('sensor_readings'); 
          // Tambahkan timestamp dari server untuk konsistensi
          parsedMessage.createdAt = new Date();
          // Simpan data ke collection
          await collection.insertOne(parsedMessage);
          console.log('✓ Data sensor berhasil disimpan ke database.');
        } else {
          console.log('Database belum siap, data tidak disimpan.');
        }
      }
    } catch (e) {
      // Abaikan jika pesan bukan JSON (misal: "ping" atau pesan koneksi)
    }

    // Broadcast pesan ke semua client lain
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(String(message));
      }
    });
  });

  ws.on('close', () => console.log('Client terputus'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// Jalankan server
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  // Hubungkan ke database saat server pertama kali berjalan
  connectToDb(); 
});