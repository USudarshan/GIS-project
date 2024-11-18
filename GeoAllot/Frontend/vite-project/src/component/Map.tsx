import { useEffect, useRef } from 'react';
import L from 'leaflet';
import axios from 'axios';

const MyMapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null); // Ref to store the map instance

  useEffect(() => {
    if (mapRef.current) {
      // Initialize the Leaflet map with a default center
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 12); // Initial center coordinates
    
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

      // Fetch GeoJSON data from the backend
      axios
        .get<GeoJSONResponse>('http://localhost:3000/get-plots')
        .then((response) => {
          const data = response.data;

          // Add GeoJSON to the map
          if (mapRef.current && data) {
            const geoJSONLayer = L.geoJSON(data, {
              onEachFeature: (feature, layer) => {
                // Validate the feature
                if (!feature.geometry || !feature.properties) {
                  console.warn('Invalid feature:', feature);
                  return; // Skip invalid features
                }
  
                // Permanent tooltip with the plot name
                const nameLabel = feature.properties.name || 'Unnamed Plot';
                // const permanentTooltip = layer.bindTooltip(nameLabel, {
                //   permanent: true,
                //   direction: 'center',
                //   className: 'permanent-tooltip',
                // }).openTooltip();
  
                // Hover tooltip with additional details
                const hoverDetails = `
                  <strong>${feature.properties.name || 'Unnamed Plot'}</strong><br>
                  Area: ${feature.properties.area || 'N/A'}<br>
                  Type: ${feature.properties.type || 'N/A'}<br>
                  Status: ${feature.properties.status || 'N/A'}
                `;
                const hoverTooltip = layer.bindTooltip(hoverDetails, {
                  permanent: false,
                  direction: 'top',
                  className: 'hover-tooltip',
                });
  
                // Handle mouseover and mouseout events
                layer.on('mouseover', () => {
                //   permanentTooltip.closeTooltip();
                  hoverTooltip.openTooltip();
                });
  
                layer.on('mouseout', () => {
                  hoverTooltip.closeTooltip();
                //   permanentTooltip.openTooltip();
                });
              }
            }).addTo(mapInstance.current);

            // After adding GeoJSON, get the bounds and fit the map to them
            const bounds = geoJSONLayer.getBounds();
            mapInstance.current.fitBounds(bounds); // This will center and zoom the map to fit the bounds of the data
          } else {
            console.error("GeoJSON data is undefined or invalid");
          }
        })
        .catch((error) => {
          console.error('Error fetching GeoJSON:', error);
        });
    }

    // Clean up the map instance on component unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove(); // Properly clean up the map
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>;
};

export default MyMapComponent;
