import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

interface PlotFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];  
  };
  properties: {
    id: number;
    name: string;
    area: string;
    type: string;
    status: string;
    disroad: string;
    diswater: string;
    elephase: number;
  };
}

const App = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const [plotData, setPlotData] = useState<PlotFeature[]>([]);

  useEffect(() => {
    // Force re-render the map by changing the key
    setMapKey((prevKey) => prevKey + 1);
  }, []);

  // Fetch plot data from the server
  const getMapCoordinates = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/get-plots`);
      // console.log("Plot Data:", response.data.features);
      setPlotData(response.data.features);  // Assuming response has the correct structure
    } catch (err) {
      console.error("Error fetching plot data:", err);
    }
  };

  useEffect(() => {
    getMapCoordinates();
  }, []);

  // Dropdown options
  const options = [
    "Chemical Industry",
    "Textile Industry",
    "IT Industry",
    "Automotive Industry",
    "Paper Industry",
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6">
        <h1 className="text-3xl font-bold mb-4">Industrial Allotment</h1>

        {/* Search Bar with a Single Dropdown */}
        <div className="flex justify-center items-center space-x-4">
          <div className="relative">
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="bg-white text-gray-700 rounded-lg p-3 w-72 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select Location
              </option>
              {options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Map Section */}
      <div className="flex-grow">
        <MapContainer
          key={mapKey}
          center={[25.746, 82.683]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* Render polygons from plot data */}
          {plotData.map((feature, index) => {
            const { geometry, properties } = feature;
            // console.log("geometry",geometry);
            // console.log("properties",properties);
            if (geometry.type === "MultiPolygon") {
              return geometry.coordinates.map((coords, polygonIndex) => (
                <Polygon
                  key={`${index}-${polygonIndex}`}
                  positions={coords.map(([longitude, latitude]) => [latitude, longitude])}
                  color="blue"
                  weight={3}
                  opacity={0.6}
                >
                  {/* <Popup>
                    <div>
                      <h4>{properties.name}</h4>
                      <p>Area: {properties.area} sq km</p>
                      <p>Status: {properties.status}</p>
                      <p>Distance to road: {properties.disroad} meters</p>
                      <p>Distance to water: {properties.diswater} meters</p>
                    </div>
                  </Popup> */}
                </Polygon>
              ));
            }
            return null;
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
