const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();

app.post('/api/data', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO sensor_data (Heater, NH3, Pompa_Buang, Pompa_Masuk, Suhu, TDS, TinggiAir, Turbidity, datavalid, pH, pH_Down, pH_Up, wifiConnected)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.Heater, data.NH3, data.Pompa_Buang, data.Pompa_Masuk, data.Suhu,
    data.TDS, data.TinggiAir, data.Turbidity, data.datavalid, data.pH,
    data.pH_Down, data.pH_Up, data.wifiConnected
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const update = { type: 'update', data };
    clients.forEach(client => client.send(JSON.stringify(update)));
    res.json({ success: true });
  });
});

app.get('/api/history', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

wss.on('connection', ws => {
  clients.add(ws);
  console.log('WebSocket connected');
  ws.on('close', () => clients.delete(ws));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});
