import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS and JSON parsing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// Cell towers for the map
app.get('/api/cell-towers', (req, res) => {
  console.log('Cell towers requested');
  const towers = [
    {id: '1', towerId: 'SASK001', carrier: 'SaskTel', latitude: 52.1579, longitude: -106.6702, networkTypes: ['LTE','5G'], address: 'Downtown Saskatoon, SK'},
    {id: '2', towerId: 'BELL001', carrier: 'Bell', latitude: 52.1419, longitude: -106.6655, networkTypes: ['LTE','5G'], address: 'University of Saskatchewan, SK'},
    {id: '3', towerId: 'TELUS001', carrier: 'Telus', latitude: 52.1167, longitude: -106.6555, networkTypes: ['LTE','5G'], address: 'Stonebridge, Saskatoon, SK'},
    {id: '4', towerId: 'ROG001', carrier: 'Rogers', latitude: 52.1304, longitude: -106.6702, networkTypes: ['LTE','5G'], address: 'City Centre, Saskatoon, SK'},
    {id: '5', towerId: 'SASK002', carrier: 'SaskTel', latitude: 50.4452, longitude: -104.6189, networkTypes: ['LTE','5G'], address: 'Downtown Regina, SK'},
    {id: '6', towerId: 'BELL002', carrier: 'Bell', latitude: 50.4372, longitude: -104.6205, networkTypes: ['LTE','5G'], address: 'Regina University Area, SK'}
  ];
  res.json(towers);
});

// Speed tests
app.get('/api/speed-tests', (req, res) => {
  console.log('Speed tests requested');
  res.json([]);
});

app.post('/api/speed-tests', (req, res) => {
  console.log('Speed test created:', req.body);
  res.json({ id: Date.now(), ...req.body, timestamp: new Date().toISOString() });
});

// Ping for speed testing
app.get('/api/ping', (req, res) => {
  console.log('Ping requested');
  res.send('pong');
});

app.head('/api/ping', (req, res) => {
  res.status(200).end();
});

// Upload test endpoint
app.post('/api/speed-test/upload', (req, res) => {
  res.json({ received: true, size: JSON.stringify(req.body).length });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 5000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SaskNet server started successfully`);
  console.log(`📍 Server running on port ${port}`);
  console.log(`🌐 Frontend: http://localhost:${port}`);
  console.log(`🗺️  Map API: http://localhost:${port}/api/cell-towers`);
  console.log(`❤️  Health: http://localhost:${port}/api/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close();
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
});