import { useEffect, useRef } from "react";
import L, { Map, GeoJSON, Layer } from "leaflet";

// Define the type for a plot (adjust it according to the actual data structure)
interface PlotData {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    name: string;
    area?: string;
    type: string;
    status: string;
  };
}

interface MyMapComponentProps {
  plotData: PlotData[];
  
}

const MyMapComponent: React.FC<MyMapComponentProps> = ({ plotData }) => {
  const mapRef = useRef<HTMLDivElement | null>(null); // Reference to map container div
  const mapInstance = useRef<Map | null>(null); // Reference to Leaflet map instance
  const geoJSONLayerRef = useRef<GeoJSON | null>(null); // Reference to GeoJSON layer

  // Initialize map on component mount
  useEffect(() => {
    if (mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update the map whenever plotData changes (triggered by the App component)
  useEffect(() => {
    if (plotData.length > 0 && mapInstance.current) {
      if (geoJSONLayerRef.current) {
        geoJSONLayerRef.current.clearLayers(); // Clear previous layers if any
      }

      // Create and add a new GeoJSON layer for the selected plots
      const geoJSONLayer = L.geoJSON(plotData, {
        onEachFeature: (feature, layer) => {
          const hoverDetails = `
            <strong>${feature.properties.name || "Unnamed Plot"}</strong><br>
            Area: ${feature.properties.area || "N/A"}<br>
            Type: ${feature.properties.type || "N/A"}<br>
            Status: ${feature.properties.status || "N/A"}
          `;

          const hoverTooltip = layer.bindTooltip(hoverDetails, {
            permanent: false,
            direction: "top",
          });

          layer.on("mouseover", () => {
            hoverTooltip.openTooltip();
          });

          layer.on("mouseout", () => {
            hoverTooltip.closeTooltip();
          });
        },
      });

      geoJSONLayerRef.current = geoJSONLayer;
      geoJSONLayer.addTo(mapInstance.current);

      const bounds = geoJSONLayer.getBounds();
      if (bounds.isValid()) {
        mapInstance.current.fitBounds(bounds); // Adjust map to fit the new plots
      }
    }
  }, [plotData]); // Trigger this effect when plotData changes

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>;
};

export default MyMapComponent;
