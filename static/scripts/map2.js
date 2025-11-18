// map.js
const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05],
    zoom: 10
});

// Keep a dictionary of vehicles
const vehicles = {};

// Route colors
const routeColors = {
    801: "#0072BC",
    802: "#EB131B",
    803: "#58A738",
    804: "#FDB913",
    805: "#A05DA5",
    807: "#E56DB1",
    unknown: "#AAAAAA"
};

// Add GeoJSON source and circle layer when map loads
map.on("load", () => {
    map.addSource("trains", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
    });
    map.addSource("stations", {
        type: "geojson",
        data: "/static/data/LACMTA_Rail/stations.geojson"
    });
    map.addSource("routes", {
        type: "geojson",
        data: "/static/data/LACMTA_Rail/routes.geojson"
    });
    map.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes",
        paint: {
            "line-color": "#002041",
            "line-width": 3
        }
    });
    map.addLayer({
        id: "station-dots",
        type: "circle",
        source: "stations",
        paint: {
            "circle-radius": 3,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#000",
            "circle-color": "#fff"
        }
    });
    map.addLayer({
        id: "train-dots",
        type: "circle",
        source: "trains",
        paint: {
            "circle-radius": 6,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        }
    });

    // Click event for train dots
    map.on("click","station-dots"),(e)=>{
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const props = feature.properties;
        let stationData = {};
        try {
            stationData = JSON.parse(props.data);
        } catch (err) {
            console.error
        }
        new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(
            `<div class="popup">
                <b>Route:</b> ${vehicleData.route_code || "unknown"}<br>
                <b>ID:</b> ${vehicleData.vehicle?.vehicle?.id || vehicleData.id || "unknown"}<br>
            <b>Status:</b> ${vehicleData.vehicle?.currentStatus || "N/A"}<br>
            <b>Lat/Lng:</b> ${vehicleData.vehicle?.position?.latitude.toFixed(5) || "N/A"}, 
            ${vehicleData.vehicle?.position?.longitude.toFixed(5) || "N/A"}
            ${vehicleData.vehicle.trip.tripId}<br>
            ${vehicleData.vehicle.currentStopSequence}<br>
            
            </div>
            `
            )
            .addTo(map);
    map.on("click", "train-dots", (e) => {
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const props = feature.properties;

        // Parse the stored JSON string back into an object
        let vehicleData = {};
        try {
            vehicleData = JSON.parse(props.data);
        } catch (err) {
            console.error("Failed to parse vehicle data:", err);
        }

        new maplibregl.Popup()
            .setLngLat(coords)
            .setHTML(
                `<div class="popup">
                <b>Route:</b> ${vehicleData.route_code || "unknown"}<br>
                <b>ID:</b> ${vehicleData.vehicle?.vehicle?.id || vehicleData.id || "unknown"}<br>
                <b>Status:</b> ${vehicleData.vehicle?.currentStatus || "N/A"}<br>
                <b>Lat/Lng:</b> ${vehicleData.vehicle?.position?.latitude.toFixed(5) || "N/A"}, 
                ${vehicleData.vehicle?.position?.longitude.toFixed(5) || "N/A"}
                ${vehicleData.vehicle.trip.tripId}<br>
                ${vehicleData.vehicle.currentStopSequence}<br>
                
                </div>
            `
            )
            .addTo(map);
    });

    // Change cursor when hovering over train dots
    map.on("mouseenter", "train-dots", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "train-dots", () => (map.getCanvas().style.cursor = ""));
});

// Connect to WebSocket
const ws = new WebSocket("wss://api.metro.net/ws/LACMTA_Rail/vehicle_positions");

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        const vehicle = data.vehicle;
        if (!vehicle || !vehicle.position) return;

        const id = vehicle.vehicle?.id || data.id;
        const lat = vehicle.position.latitude;
        const lng = vehicle.position.longitude;
        const tripId = vehicle.trip.TripId;
        const route = data.route_code || "unknown";

        if (!lat || !lng) return;

        // Store the entire JSON as a string in properties
        vehicles[id] = {
            coordinates: [lng, lat],
            color: routeColors[route] || routeColors["unknown"],
            data: JSON.stringify(data) // store as string
        };

        // Convert vehicles to GeoJSON features
        const features = Object.values(vehicles).map((v) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: v.coordinates },
            properties: { color: v.color, data: v.data }
        }));

        const source = map.getSource("trains");
        if (source) source.setData({ type: "FeatureCollection", features });
    } catch (err) {
        console.error("WebSocket parse error:", err);
    }
};

ws.onclose = () => console.log("WebSocket closed");
