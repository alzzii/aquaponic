// Menunggu seluruh elemen HTML dimuat sebelum menjalankan script
document.addEventListener('DOMContentLoaded', () => {

    // ===== VARIABEL GLOBAL & PENGATURAN AWAL =====
    let ws; // Variabel untuk menyimpan koneksi WebSocket
    
    // Objek untuk menyimpan semua instance chart
    const charts = {};
    const chartContexts = {
        temp: 'tempChart',
        tds: 'tdsChart',
        turbidity: 'turbidityChart',
        ammonia: 'ammoniaChart',
        ph: 'phChart',
        waterLevel: 'waterLevelChart'
    };

    // Pre-fill URL WebSocket dari server Railway Anda
    const wsUrlInput = document.getElementById('wsUrl');
    wsUrlInput.value = 'wss://web-production-f3bc.up.railway.app';

    // ===== INISIALISASI FUNGSI SAAT HALAMAN DIBUKA =====

    // 1. Inisialisasi semua chart
    initializeCharts();

    // 2. Inisialisasi jam digital
    updateClock();
    setInterval(updateClock, 1000); // Update setiap detik

    // 3. Tambahkan fungsi ke semua tombol
    document.getElementById('connectBtn').addEventListener('click', toggleWebSocketConnection);
    document.getElementById('clearLogBtn').addEventListener('click', clearLog);
    document.getElementById('saveLogBtn').addEventListener('click', saveLog);
    
    // ===== FUNGSI-FUNGSI UTAMA =====

    /**
     * Menghubungkan atau memutuskan koneksi WebSocket
     */
    function toggleWebSocketConnection() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close(); // Jika sedang terhubung, putuskan
        } else {
            connectWebSocket(); // Jika tidak terhubung, hubungkan
        }
    }

    /**
     * Membuat koneksi WebSocket baru
     */
    function connectWebSocket() {
        const wsUrl = document.getElementById('wsUrl').value;
        if (!wsUrl) {
            alert('WebSocket URL tidak boleh kosong!');
            return;
        }

        console.log(`Menghubungkan ke ${wsUrl}...`);
        ws = new WebSocket(wsUrl);

        // Handler untuk setiap event WebSocket
        ws.onopen = handleOpen;
        ws.onmessage = handleMessage;
        ws.onclose = handleClose;
        ws.onerror = handleError;
    }

    /**
     * Handler saat koneksi berhasil dibuka
     */
    function handleOpen() {
        console.log('WebSocket Connected!');
        updateConnectionStatus(true);
        logMessage('--- Koneksi berhasil dibuka ---');
    }

    /**
     * Handler saat menerima pesan dari server
     */
    function handleMessage(event) {
        // Abaikan pesan "ping" dari ESP32 untuk menjaga koneksi
        if (event.data.includes('ping')) {
            return;
        }

        try {
            const message = JSON.parse(event.data);
            if (message.type === 'sensorData') {
                updateDashboard(message);
                logMessage(JSON.stringify(message, null, 2));
            } else {
                 logMessage(event.data);
            }
        } catch (error) {
            console.error('Data yang diterima bukan JSON:', event.data);
            logMessage(event.data); // Tampilkan sebagai teks biasa jika bukan JSON
        }
    }

    /**
     * Handler saat koneksi ditutup
     */
    function handleClose() {
        console.log('WebSocket Disconnected!');
        updateConnectionStatus(false);
        logMessage('--- Koneksi ditutup ---');
    }

    /**
     * Handler jika terjadi error
     */
    function handleError(error) {
        console.error('WebSocket Error:', error);
        logMessage('--- Terjadi Error pada Koneksi ---');
        updateConnectionStatus(false);
    }

    /**
     * Mengupdate semua elemen di dashboard dengan data baru
     */
    function updateDashboard(data) {
        // Update nilai teks sensor
        document.getElementById('tempValue').innerText = `${data.Suhu?.toFixed(2) || '--'} °C`;
        document.getElementById('tdsValue').innerText = `${data.TDS?.toFixed(0) || '--'} ppm`;
        document.getElementById('turbidityValue').innerText = `${data.Turbidity?.toFixed(2) || '--'} NTU`;
        document.getElementById('ammoniaValue').innerText = `${data.NH3?.toFixed(2) || '--'} mg/L`;
        document.getElementById('phValue').innerText = `${data.pH?.toFixed(2) || '--'} pH`;
        document.getElementById('waterLevelValue').innerText = `${data.TinggiAir?.toFixed(1) || '--'} cm`;

        // Update timestamp
        document.getElementById('lastUpdated').innerText = new Date().toLocaleString('id-ID');

        // Update data pada chart
        addChartData(charts.temp, data.Suhu);
        addChartData(charts.tds, data.TDS);
        addChartData(charts.turbidity, data.Turbidity);
        addChartData(charts.ammonia, data.NH3);
        addChartData(charts.ph, data.pH);
        addChartData(charts.waterLevel, data.TinggiAir);
    }
    
    // ===== FUNGSI-FUNGSI BANTUAN (HELPERS) =====

    /**
     * Mengupdate status koneksi di UI
     */
    function updateConnectionStatus(isConnected) {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        const connectBtn = document.getElementById('connectBtn');

        if (isConnected) {
            statusDot.className = 'connected';
            statusText.innerText = 'Connected';
            connectBtn.innerText = 'Disconnect';
            connectBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            connectBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            statusDot.className = 'disconnected';
            statusText.innerText = 'Disconnected';
            connectBtn.innerText = 'Connect';
            connectBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            connectBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    /**
     * Menampilkan jam dan tanggal digital
     */
    function updateClock() {
        const now = new Date();
        document.getElementById('current-date').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('current-time').innerText = now.toLocaleTimeString('id-ID');
    }

    /**
     * Menambahkan pesan ke log monitor
     */
    function logMessage(msg) {
        const log = document.getElementById('serialLog');
        const timestamp = new Date().toLocaleTimeString('id-ID');
        log.textContent += `[${timestamp}] ${msg}\n`;
        log.scrollTop = log.scrollHeight; // Auto-scroll ke bawah
    }

    function clearLog() {
        document.getElementById('serialLog').textContent = '';
    }

    function saveLog() {
        const logContent = document.getElementById('serialLog').textContent;
        const blob = new Blob([logContent], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `aquaponic-log-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    /**
     * Membuat instance chart baru
     */
    function createChart(canvasId, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    x: {
                        ticks: { display: false }
                    },
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                maintainAspectRatio: false
            }
        });
    }

    /**
     * Menambahkan data baru ke chart
     */
    function addChartData(chart, data) {
        if (!chart || data === undefined) return;

        const label = new Date().toLocaleTimeString('id-ID');
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(data);

        // Batasi jumlah data pada chart agar tidak terlalu berat (misal: 30 data terakhir)
        const maxDataPoints = 30;
        if (chart.data.labels.length > maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update();
    }
    
    /**
     * Menginisialisasi semua chart saat halaman dimuat
     */
    function initializeCharts() {
        charts.temp = createChart('tempChart', 'Temperature');
        charts.tds = createChart('tdsChart', 'TDS');
        charts.turbidity = createChart('turbidityChart', 'Turbidity');
        charts.ammonia = createChart('ammoniaChart', 'Ammonia');
        charts.ph = createChart('phChart', 'pH');
        charts.waterLevel = createChart('waterLevelChart', 'Water Level');
    }

});