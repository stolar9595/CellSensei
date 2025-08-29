import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/cell-towers', (req, res) => {
  res.json([
    {id: '1', towerId: 'SASK001', carrier: 'SaskTel', latitude: 52.1579, longitude: -106.6702, networkTypes: ['LTE','5G'], address: 'Downtown Saskatoon, SK'},
    {id: '2', towerId: 'BELL001', carrier: 'Bell', latitude: 52.1419, longitude: -106.6655, networkTypes: ['LTE','5G'], address: 'University of Saskatchewan, SK'},
    {id: '3', towerId: 'TELUS001', carrier: 'Telus', latitude: 52.1167, longitude: -106.6555, networkTypes: ['LTE','5G'], address: 'Stonebridge, Saskatoon, SK'},
    {id: '4', towerId: 'ROG001', carrier: 'Rogers', latitude: 52.1304, longitude: -106.6702, networkTypes: ['LTE','5G'], address: 'City Centre, Saskatoon, SK'}
  ]);
});

app.get('/api/ping', (req, res) => res.send('pong'));
app.head('/api/ping', (req, res) => res.status(200).end());

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaskNet running on port ${port}`);
});