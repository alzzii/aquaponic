let ws;

function connectWebSocket() {
  const wsUrl = document.getElementById('wsUrl').value;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    document.getElementById('connectionStatus').className = 'connected';
    document.getElementById('connectionText').innerText = 'Connected';
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'update') {
      updateDashboard(message.data);
      logMessage(JSON.stringify(message.data, null, 2));
    }
  };

  ws.onclose = () => {
    document.getElementById('connectionStatus').className = 'disconnected';
    document.getElementById('connectionText').innerText = 'Disconnected';
    console.log('WebSocket disconnected');
  };
}

function updateDashboard(data) {
  // Update nilai sensor
  document.getElementById('tempValue').innerText = `${data.Suhu} °C`;
  document.getElementById('tdsValue').innerText = `${data.TDS} ppm`;
  document.getElementById('turbidityValue').innerText = `${data.Turbidity} NTU`;
  document.getElementById('ammoniaValue').innerText = `${data.NH3} mg/L`;
  document.getElementById('phValue').innerText = `${data.pH} pH`;
  document.getElementById('waterLevelValue').innerText = `${data.TinggiAir} cm`;

  // Update chart (kalau pakai Chart.js)
  addChartData(tempChart, data.Suhu);
  addChartData(tdsChart, data.TDS);
  addChartData(turbidityChart, data.Turbidity);
  addChartData(ammoniaChart, data.NH3);
  addChartData(phChart, data.pH);
  addChartData(waterLevelChart, data.TinggiAir);

  // Tambahkan timestamp sekarang
  const now = new Date();
  const formattedTime = now.toLocaleString(); // Format: 5/8/2025, 15:32:10
  document.getElementById('lastUpdated').innerText = formattedTime;
}

function logMessage(msg) {
  const log = document.getElementById('serialLog');
  log.textContent += msg + '\\n';
  log.scrollTop = log.scrollHeight;
}

document.getElementById('connectBtn').addEventListener('click', connectWebSocket);

// Chart.js setup (sama seperti sebelumnya, buat tempChart, tdsChart, dll)
