import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public')));

// Database setup
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false 
});

// Test database connection
pool.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Cell towers API - essential for the map
app.get('/api/cell-towers', async (req, res) => {
  try {
    const { carrier } = req.query;
    let query = 'SELECT * FROM cell_towers';
    let params = [];
    
    if (carrier && carrier !== 'all') {
      query += ' WHERE carrier = $1';
      params = [carrier];
    }
    
    query += ' ORDER BY carrier, tower_id';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Cell towers API error:', error);
    res.status(500).json({ error: 'Failed to fetch cell towers' });
  }
});

// Speed tests API
app.get('/api/speed-tests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM speed_tests ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error('Speed tests API error:', error);
    res.status(500).json({ error: 'Failed to fetch speed tests' });
  }
});

// Create speed test
app.post('/api/speed-tests', async (req, res) => {
  try {
    const { downloadSpeed, uploadSpeed, ping, jitter, carrier, networkType, signalStrength, latitude, longitude, location } = req.body;
    
    const result = await pool.query(`
      INSERT INTO speed_tests (download_speed, upload_speed, ping, jitter, carrier, network_type, signal_strength, latitude, longitude, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [downloadSpeed, uploadSpeed, ping, jitter, carrier, networkType, signalStrength, latitude, longitude, location]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create speed test error:', error);
    res.status(500).json({ error: 'Failed to create speed test' });
  }
});

// Ping endpoint for latency testing
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

app.head('/api/ping', (req, res) => {
  res.status(200).end();
});

// Upload speed test endpoint
app.post('/api/speed-test/upload', (req, res) => {
  res.json({ received: true, size: JSON.stringify(req.body).length });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SaskNet server running on port ${port}`);
  console.log(`📍 Frontend: http://localhost:${port}`);
  console.log(`🗺️  Map data: http://localhost:${port}/api/cell-towers`);
});