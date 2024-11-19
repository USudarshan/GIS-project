import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Map from './component/map';
import { io, Socket } from "socket.io-client";

// Define types for the plot data structure
interface PlotData {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    id: string;
    name: string;
    description: string;
  };
}

const App: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>(""); 
  const [plotData, setPlotData] = useState<PlotData[]>([]); 
  const socketRef = useRef<Socket | null>(null); 

  // Create the socket instance only once
  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

   
    socketRef.current.on("new-plots", (data: { features: PlotData[] }) => {
      setPlotData(data.features); 
    });
    socketRef.current.emit("get-all-plots");
    socketRef.current?.on("all-plots", (data: { features: PlotData[] }) => {
      setPlotData(data.features); 
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []); 
  console.log(plotData)
  
  useEffect(() => {
    if (selectedOption) {
      
      socketRef.current?.emit("get-plots-by-type", selectedOption);
    } else {
      setPlotData([]); 
    }
  }, [selectedOption]);

  // Dropdown options
  const options: string[] = [
    "chemical",
    "textile",
    "IT",
    "automobile",
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
      {/* Pass plotData to the Map component */}
      <Map plotData={plotData} />
    </div>
  );
};

export default App;
