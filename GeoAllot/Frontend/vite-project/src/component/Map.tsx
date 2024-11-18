import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import axios from "axios";
import { io } from "socket.io-client";

interface GeoJSONResponse {
  type: string;
  features: PlotFeature[];
}

interface PlotFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    id: number;
    name: string;
    area: number;
    type: string;
    status: string;
    disroad: number;
    diswater: number;
    elephase: number;
  };
}

const MyMapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const geoJSONLayerRef = useRef<L.GeoJSON | null>(null);
  const [plots, setPlots] = useState<PlotFeature[]>([]);

  useEffect(() => {
    if (mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        mapInstance.current
      );

      axios
        .get<any>("http://localhost:3000/get-plots")
        .then((response) => {
          const data = response.data;
          setPlots(data.features);

          if (mapRef.current && data) {
            const geoJSONLayer = L.geoJSON(data, {
              onEachFeature: (feature, layer) => {
                if (!feature.geometry || !feature.properties) {
                  console.warn("Invalid feature:", feature);
                  return;
                }

                const nameLabel = feature.properties.name || "Unnamed Plot";

                const hoverDetails = `
                  <strong>${
                    feature.properties.name || "Unnamed Plot"
                  }</strong><br>
                  Area: ${feature.properties.area || "N/A"}<br>
                  Type: ${feature.properties.type || "N/A"}<br>
                  Status: ${feature.properties.status || "N/A"}
                `;

                const hoverTooltip = layer.bindTooltip(hoverDetails, {
                  permanent: false,
                  direction: "top",
                  className: "hover-tooltip",
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
            if (mapInstance.current) {
              geoJSONLayer.addTo(mapInstance.current);
            }
            if (mapInstance.current) {
              const bounds = geoJSONLayer.getBounds();
              console.log(bounds);
              if (bounds.isValid()) {
                mapInstance.current.fitBounds(bounds);
              } else {
                const defaultBounds = L.latLngBounds([
                  [40.7128, -74.006], // Southwest coordinates (example: New York City)
                  [34.0522, -118.2437], // Northeast coordinates (example: Los Angeles)
                ]);
                mapInstance.current.fitBounds(defaultBounds);
              }
            }
          } else {
            console.error("GeoJSON data is undefined or invalid");
          }
        })
        .catch((error) => {
          console.error("Error fetching GeoJSON:", error);
        });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("new-plot", (newPlot) => {
      setPlots((prevPlots) => [...prevPlots, newPlot]);
      console.log({ newPlot });
      if (mapInstance.current) {
        const newLayer = L.geoJSON(newPlot, {
          onEachFeature: (feature, layer) => {
            if (!feature.geometry || !feature.properties) {
              console.warn("Invalid feature:", feature);
              return;
            }

            const nameLabel = feature.properties.name || "Unnamed Plot";

            const hoverDetails = `
              <strong>${feature.properties.name || "Unnamed Plot"}</strong><br>
              Area: ${feature.properties.area || "N/A"}<br>
              Type: ${feature.properties.type || "N/A"}<br>
              Status: ${feature.properties.status || "N/A"}
            `;

            const hoverTooltip = layer.bindTooltip(hoverDetails, {
              permanent: false,
              direction: "top",
              className: "hover-tooltip",
            });

            layer.on("mouseover", () => {
              hoverTooltip.openTooltip();
            });

            layer.on("mouseout", () => {
              hoverTooltip.closeTooltip();
            });
          },
        }).addTo(mapInstance.current);

        // const bounds = newLayer.getBounds();
        // mapInstance.current.fitBounds(bounds);
      }
    });

    // socket.on("update-plot", (updatedPlot) => {
    //   setPlots((prevPlots) =>
    //     prevPlots.map((plot) =>
    //       plot.properties.id === updatedPlot.id ? updatedPlot : plot
    //     )
    //   );

    //   if (mapInstance.current) {
    //     const updatedLayer = L.geoJSON(updatedPlot, {
    //       onEachFeature: (feature, layer) => {
    //         if (!feature.geometry || !feature.properties) {
    //           console.warn("Invalid feature:", feature);
    //           return;
    //         }

    //         const nameLabel = feature.properties.name || "Unnamed Plot";

    //         const hoverDetails = `
    //           <strong>${feature.properties.name || "Unnamed Plot"}</strong><br>
    //           Area: ${feature.properties.area || "N/A"}<br>
    //           Type: ${feature.properties.type || "N/A"}<br>
    //           Status: ${feature.properties.status || "N/A"}
    //         `;

    //         const hoverTooltip = layer.bindTooltip(hoverDetails, {
    //           permanent: false,
    //           direction: "top",
    //           className: "hover-tooltip",
    //         });

    //         layer.on("mouseover", () => {
    //           hoverTooltip.openTooltip();
    //         });

    //         layer.on("mouseout", () => {
    //           hoverTooltip.closeTooltip();
    //         });
    //       },
    //     }).addTo(mapInstance.current);

    //     // const bounds = updatedLayer.getBounds();
    //     // mapInstance.current.fitBounds(bounds);
    //   }
    // });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>;
};

export default MyMapComponent;
