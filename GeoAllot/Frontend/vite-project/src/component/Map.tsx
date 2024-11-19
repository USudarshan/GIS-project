import { useEffect, useRef } from "react";
import L, { Map, GeoJSON } from "leaflet";

// Define the type for a plot (adjust it according to the actual data structure)
interface PlotData {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  properties: {
    name: string;
    area?: string;
    type: string;
    status: string;
    disroad?: string;
  };
}

interface MyMapComponentProps {
  plotData: PlotData[];
}

const MyMapComponent: React.FC<MyMapComponentProps> = ({ plotData }) => {
  const mapRef = useRef<HTMLDivElement | null>(null); // Reference to map container div
  const mapInstance = useRef<Map | null>(null); // Reference to Leaflet map instance
  const geoJSONLayerRef = useRef<GeoJSON | null>(null); // Reference to GeoJSON layer

  
  const industryColors: { [key: string]: string } = {
    chemical: "#FF5733",  
    textile: "#33FF57",   
    IT: "#3357FF",        
    automobile: "#F3FF33", 
    default: "#808080",    
  };

  // Initialize map on component mount
  useEffect(() => {
    if (mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapInstance.current);
    }

    const openStreetMapLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
      }
    );
   
    openStreetMapLayer.addTo(mapInstance.current);

    
    const baseLayers = {
      OpenStreetMap: openStreetMapLayer,
      Satellite: satelliteLayer,
    };
    L.control.layers(baseLayers).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update the map whenever plotData changes
  useEffect(() => {
    if (plotData.length > 0 && mapInstance.current) {
      if (geoJSONLayerRef.current) {
        geoJSONLayerRef.current.clearLayers(); // Clear previous layers if any
      }

      // Create and add a new GeoJSON layer for the selected plots
      const geoJSONLayer = L.geoJSON(plotData, {
        style: (feature) => {
          const industryType = feature?.properties?.type;
          const color = industryColors[industryType] || industryColors.default;
          return {
            color,        // Border color
            fillColor: color, // Fill color
            fillOpacity: 0.6, // Fill opacity
            weight: 2,        // Border thickness
          };
        },
        onEachFeature: (feature, layer) => {
          const hoverDetails = `
            <strong>${feature.properties.name || "Unnamed Plot"}</strong><br>
            Area: ${feature.properties.area || "N/A"}<br>
            Type: ${feature.properties.type || "N/A"}<br>
            Status: ${feature.properties.status || "N/A"}<br>
            MainRoad: ${feature.properties.disroad || "N/A"}
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
