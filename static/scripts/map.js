document.addEventListener("DOMContentLoaded", async () => {
  // Initialize MapLibre
  const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05], // Los Angeles
    zoom: 12
  });

  map.addControl(new maplibregl.NavigationControl());

  const apiUrl = "https://bts-status.bicycletransit.workers.dev/lax";

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Add the GeoJSON source
    map.on("load", () => {
      map.addSource("stations", {
        type: "geojson",
        data: data
      });

      // Add circle layer for stations
      map.addLayer({
        id: "stations-layer",
        type: "circle",
        source: "stations",
        paint: {
          // Circle radius scales slightly with zoom
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10, 4,
            15, 10
          ],
          // Circle color based on availability percentage
          "circle-color": [
            "case",
            [">", ["get", "docksAvailable"], 15], "#00b300", // green
            [">", ["get", "docksAvailable"], 5], "#ffcc00",  // yellow
            "#ff4d4d" // red
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9
        }
      });

      // Add popups on click
      map.on("click", "stations-layer", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates;

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <strong>${props.name}</strong><br>
            🚲 Docks: ${props.docksAvailable}/${props.totalDocks}<br>
            <small>Status: ${props.kioskStatus}</small>
          `)
          .addTo(map);
      });

      // Change cursor on hover
      map.on("mouseenter", "stations-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations-layer", () => {
        map.getCanvas().style.cursor = "";
      });

      // Auto-zoom to all stations
      const bounds = new maplibregl.LngLatBounds();
      data.features.forEach((f) => bounds.extend(f.geometry.coordinates));
      map.fitBounds(bounds, { padding: 40 });
    });
  } catch (err) {
    console.error("Error loading stations:", err);
  }
});