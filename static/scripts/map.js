// map.js
const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05], // Los Angeles
    zoom: 12
});

map.addControl(new maplibregl.NavigationControl());

const apiUrl = "https://bts-status.bicycletransit.workers.dev/lax";

async function loadStations() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Convert API data to GeoJSON
        const geojson = {
            type: "FeatureCollection",
            features: data.features.map(station => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: station.geometry.coordinates
                },
                properties: station.properties
            }))
        };

        map.on("load", () => {
            // Add GeoJSON source
            map.addSource("stations", { type: "geojson", data: geojson });

            // Circle layer with color based on bike availability
            map.addLayer({
                id: "stations-layer",
                type: "circle",
                source: "stations",
                paint: {
                    "circle-radius": 7,
                    "circle-color": [
                        "case",
                        ["<", ["get", "bikesAvailable"], 5], "#f56565",   // red if <5 bikes
                        ["<", ["get", "bikesAvailable"], 10], "#f6ad55",  // orange if 5-9
                        "#48bb78"                                           // green if 10+
                    ],
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff"
                }
            });

            // Popups
            map.on("click", "stations-layer", (e) => {
                const props = e.features[0].properties;

                const bikesAvailable = props.bikesAvailable || 0;
                const docksAvailable = props.totalDocks - bikesAvailable;
                const electricBikes = props.electricBikesAvailable || 0;

                const popupHTML = `
                    <div class="popup">
                        <strong>${props.name}</strong><br>
                        🚲 Bikes: ${bikesAvailable}<br>
                        🅿️ Docks: ${docksAvailable}<br>
                        ${electricBikes > 0 ? `⚡ Electric: ${electricBikes}<br>` : ""}
                        Status: ${props.kioskStatus}
                    </div>
                `;

                new maplibregl.Popup({ className: 'bike-popup' })
                    .setLngLat(e.features[0].geometry.coordinates)
                    .setHTML(popupHTML)
                    .addTo(map);
            });

            // Cursor hover effect
            map.on("mouseenter", "stations-layer", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "stations-layer", () => {
                map.getCanvas().style.cursor = "";
            });
        });

    } catch (err) {
        console.error("Error loading stations:", err);
    }
}

loadStations();