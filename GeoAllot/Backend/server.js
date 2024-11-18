const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

// Load environment variables
require('dotenv').config();

const port = process.env.PORT || 3001; // Use PORT from .env or default to 3001

// Enable CORS with the environment variable (you can set specific domains or '*' for all)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*", // Default to "*" if not set
}));

// PostgreSQL connection setup using environment variables
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

// API endpoint to fetch PostGIS data as GeoJSON
app.get('/get-plots', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, area, ST_AsGeoJSON(geom) as geom
      FROM demo_1
    `);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        geometry: JSON.parse(row.geom),
        properties: {
          id: row.id,
          name: row.name,
          area: row.area,
        }
      }))
    };

    res.json(geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error querying the database');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
