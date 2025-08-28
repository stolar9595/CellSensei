const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Cell towers API - this is what your map needs
app.get('/api/cell-towers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cell_towers ORDER BY carrier');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Speed tests API
app.get('/api/speed-tests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM speed_tests ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Ping endpoint for speed testing
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaskNet server running on port ${port}`);
});