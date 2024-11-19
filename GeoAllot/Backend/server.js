const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

// Load environment variables
require("dotenv").config();

const port = process.env.PORT || 3000; // Use PORT from .env or default to 3001

// Enable CORS with the environment variable (you can set specific domains or '*' for all)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Default to "*" if not set
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// PostgreSQL connection setup using environment variables
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("A user connected");

  // Fetch all plots when "get-all-plots" is emitted
  socket.on("get-all-plots", async () => {
    try {
      const result = await pool.query(`
        SELECT id, name, area, type, status, disroad, diswater, elephase, ST_AsGeoJSON(geom) as geom
        FROM gis_data;
      `);

      const geojson = {
        type: "FeatureCollection",
        features: result.rows.map((row) => ({
          type: "Feature",
          geometry: JSON.parse(row.geom),
          properties: {
            id: row.id,
            name: row.name,
            area: row.area,
            type: row.type,
            status: row.status,
            disroad: row.disroad,
            diswater: row.diswater,
            elephase: row.elephase,
          },
        })),
      };

      // Emit all plots back to the client
      socket.emit("all-plots", geojson);
    } catch (err) {
      console.error(err);
      socket.emit("error", "Error fetching plots.");
    }
  });

  // Fetch plots by type
  socket.on("get-plots-by-type", async (industryType) => {
    try {
      const result = await pool.query(
        `
        SELECT id, name, area, type, status, disroad, diswater, elephase, ST_AsGeoJSON(geom) as geom
        FROM gis_data
        WHERE type = $1;
        `,
        [industryType]
      );console.clear()
       
      const geojson = {
        type: "FeatureCollection",
        features: result.rows.map((row) => ({
          type: "Feature",
          geometry: JSON.parse(row.geom),
          properties: {
            id: row.id,
            name: row.name,
            area: row.area,
            type: row.type,
            status: row.status,
            disroad: row.disroad,
            diswater: row.diswater,
            elephase: row.elephase,
          },
        })),
      };

      // Emit filtered plots back to the client
      socket.emit("new-plots", geojson);
    } catch (err) {
      console.error(err);
      socket.emit("error", "Error fetching plots.");
    }
  });
});




app.post("/add-plot", async (req, res) => {
  try {
    console.log(req.body);

    const { id, name, area, type, status, disroad, diswater, elephase, geom } =
      req.body;

    let result;
    let newPlot;

    if (id) {
      // Update existing plot
      result = await pool.query(
        `
        UPDATE gis_data
        SET name = $1, area = $2, type = $3, status = $4, disroad = $5, diswater = $6, elephase = $7, geom = ST_GeomFromGeoJSON($8)
        WHERE id = $9
        RETURNING id;
      `,
        [
          name,
          area,
          type,
          status,
          disroad,
          diswater,
          elephase,
          JSON.stringify(geom),
          id,
        ]
      );

      newPlot = {
        id: result.rows[0].id,
        name,
        area,
        type,
        status,
        disroad,
        diswater,
        elephase,
        geom,
      };
      const geojson = {
        type: "FeatureCollection",

        features: [
          {
            type: "Feature",
            geometry: newPlot.geom,
            properties: {
              id: newPlot.id,
              name: newPlot.name,
              area: newPlot.area,
              type: newPlot.type,
              status: newPlot.status,
              disroad: newPlot.disroad,
              diswater: newPlot.diswater,
              elephase: newPlot.elephase,
            },
          },
        ],
      }

      // Emit the updated plot data to all connected Socket.io clients
      io.emit("update-plot", geojson);
    } else {
      // Insert new plot
      result = await pool.query(
        `
        INSERT INTO gis_data(name, area, type, status, disroad, diswater, elephase, geom)
        VALUES($1, $2, $3, $4, $5, $6, $7, ST_GeomFromGeoJSON($8))
        RETURNING id;
      `,
        [
          name,
          area,
          type,
          status,
          disroad,
          diswater,
          elephase,
          JSON.stringify(geom),
        ]
      );

      newPlot = {
        id: result.rows[0].id,
        name,
        area,
        type,
        status,
        disroad,
        diswater,
        elephase,
        geom,
      };
      const geojson = {
        type: "FeatureCollection",

        features: [
          {
            type: "Feature",
            geometry: newPlot.geom,
            properties: {
              id: newPlot.id,
              name: newPlot.name,
              area: newPlot.area,
              type: newPlot.type,
              status: newPlot.status,
              disroad: newPlot.disroad,
              diswater: newPlot.diswater,
              elephase: newPlot.elephase,
            },
          },
        ],
      };
      // Emit the new plot data to all connected Socket.io clients
      io.emit("new-plots", geojson);
    }
    console.log(newPlot);
    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving to the database");
  }
});

// API endpoint to fetch PostGIS data as GeoJSON
app.get("/get-plots", async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT id, name, area, type, status, disroad, diswater, elephase, ST_AsGeoJSON(geom) as geom
    FROM gis_data;
    `);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        geometry: JSON.parse(row.geom),
        properties: {
          id: row.id,
          name: row.name,
          area: row.area,
          type: row.type,
          status: row.status,
          disroad: row.disroad,
          diswater: row.diswater,
          elephase: row.elephase,
        },
      })),
    };

    res.json(geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error querying the database");
  }
});

app.get("/", async (req, res) => {
  res.json("server is running");
});
// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
