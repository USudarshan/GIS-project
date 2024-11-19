CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE gis_data (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  area FLOAT,
  type VARCHAR(50),
  status VARCHAR(50),
  disroad FLOAT,
  diswater FLOAT,
  elephase VARCHAR(50),
  geom GEOMETRY(Geometry, 4326) -- This column can store both POLYGON and LINESTRING geometries with SRID 3857
);