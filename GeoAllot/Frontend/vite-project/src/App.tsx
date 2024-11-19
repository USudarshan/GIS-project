import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Map from "./component/map";
import { io, Socket } from "socket.io-client";

// Define types for the plot data structure
interface PlotData {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  properties: {
    id: string;
    name: string;
    description?: string;
    area?: string;
    type?: string;
    status?: string;
  };
}

const App: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>(""); // Store selected option (industry type)
  const [plotData, setPlotData] = useState<PlotData[]>([]); // Store plot data from the server
  const socketRef = useRef<Socket | null>(null); // Use useRef to store socket instance

  // Create the socket instance only once
  useEffect(() => {
    socketRef.current = io("http://localhost:3000"); // Initialize socket here

    // Listen for the "new-plots" event to update the plots when received from the server
    socketRef.current.on("new-plots", (data: { features: PlotData[] }) => {
      setPlotData(data.features); // Update plot data in state
    });

    // Fetch all plots initially
    socketRef.current.emit("get-all-plots"); // Request all plots on mount
    socketRef.current.on("all-plots", (data: { features: PlotData[] }) => {
      setPlotData(data.features); // Set initial data to state
    });

    return () => {
      socketRef.current?.disconnect(); // Cleanup on unmount
    };
  }, []); // Empty array ensures this only runs on component mount

  // Emit a request to the server for the selected industry type
  useEffect(() => {
    if (selectedOption) {
      // Emit an event to request filtered plot data for the selected industry type
      socketRef.current?.emit("get-plots-by-type", selectedOption);
    } else {
      socketRef.current?.emit("get-all-plots"); // Fetch all plots if no option is selected
    }
  }, [selectedOption]);

  // Dropdown options
  const options: string[] = ["chemical", "textile", "IT", "automobile"];

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
              <option value="" disabled>
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
