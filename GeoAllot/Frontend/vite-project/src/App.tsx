import React, { useState, useEffect } from "react";
// import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import Map from './component/map';

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

  // useEffect(() => {
  //   const map = L.map('map').setView([17.430869662, 76.131551228], 12); // Initial center coordinates
  //   // getMapCoordinates();
  // }, []);

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
      <Map/>
      
    </div>
  );
};

export default App;
