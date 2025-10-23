const apikey = "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u";

const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05],
    zoom: 12,
    transformRequest: (url, resourceType) => {
        if (resourceType === "Tile" && url.startsWith("https://transit.land")) {
            return { url: url + `?apikey=${apikey}` };
        }
    }
});

map.addControl(new maplibregl.NavigationControl());

map.on("load", async () => {

    // ---- ROUTES ----
    map.addSource("routes", {
        type: "vector",
        tiles: ["https://transit.land/api/v2/tiles/routes/tiles/{z}/{x}/{y}.pbf"],
        maxzoom: 14
    });

    map.addLayer({
        id: "metro-routes",
        type: "line",
        source: "routes",
        "source-layer": "routes",
        layout: {
            "line-cap": "round",
            "line-join": "round"
        },
        paint: {
            "line-width": 4,
            "line-color": [
                "case",
                ["has", "route_color"],       // If the route has a color
                ["get", "route_color"], // use the hex color
                "#ff0000"                     // fallback if no color
            ]
        },
        filter: ["==", ["get", "agency_id"], "LACMTA_Rail"]
    });

    // ---- STOPS ----
    map.addSource("stops", {
        type: "vector",
        tiles: ["https://transit.land/api/v2/tiles/stops/tiles/{z}/{x}/{y}.pbf"],
        maxzoom: 14
    });

    map.addLayer({
        id: "metro-stops",
        type: "circle",
        source: "stops",
        "source-layer": "stops",
        paint: {
            "circle-radius": 5,
            "circle-color": "#1a73e8",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        },
        filter: [
            "all",
            ["==", ["get", "feed_onestop_id"], "f-9q5-metro~losangeles~rail"],
            ["!", ["match", ["get", "stop_id"], [".*[A-Za-z]$"], true, false]]
        ]
    });

    // ---- POPUP FOR STOPS ----
    map.on("click", "metro-stops", (e) => {
        const props = e.features[0].properties;
        const popupHTML = `
            <div class="popup">
                <strong>${props.stop_name || "Unknown Station"}</strong><br>
                Stop ID: ${props.stop_id || "—"}<br>
                Onestop ID: ${props.onestop_id || "—"}
            </div>
        `;
        new maplibregl.Popup({ className: "bike-popup" })
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(popupHTML)
            .addTo(map);
    });

    map.on("mouseenter", "metro-stops", () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", "metro-stops", () => map.getCanvas().style.cursor = "");

    // ---- VEHICLE POSITIONS ----
    // ---- VEHICLE POSITIONS ----
    async function loadVehicles() {
        try {
            const res = await fetch(
                "https://transit.land/api/v2/rest/feeds/f-metro~losangeles~rail~rt/download_latest_rt/vehicle_positions.json"
            );
            const data = await res.json();

            // Make sure we actually have entities
            if (!data || !Array.isArray(data.entity)) {
                console.warn("No vehicle data found in feed.");
                return;
            }

            const features = data.entity
                .map(e => e.vehicle)
                .filter(v => v && v.position && v.position.longitude && v.position.latitude)
                .map(v => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [v.position.longitude, v.position.latitude]
                    },
                    properties: {
                        id: v.vehicle?.id || "unknown",
                        label: v.vehicle?.label || "Unknown",
                        routeId: v.trip?.routeId || "N/A",   // safe access
                        status: v.currentStatus || "Unknown",
                        speed: v.position?.speed || 0
                    }
                }));

            const geojson = { type: "FeatureCollection", features };

            if (map.getSource("vehicles")) {
                map.getSource("vehicles").setData(geojson);
            } else {
                map.addSource("vehicles", { type: "geojson", data: geojson });
                map.addLayer({
                    id: "metro-vehicles",
                    type: "circle",
                    source: "vehicles",
                    paint: {
                        "circle-radius": 6,
                        "circle-color": [
                            "case",
                            ["==", ["get", "status"], "STOPPED_AT"], "#ff0000",
                            ["==", ["get", "status"], "IN_TRANSIT_TO"], "#00c853",
                            "#003663ff"
                        ],
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                    }
                });

                map.on("click", "metro-vehicles", (e) => {
                    const p = e.features[0].properties;
                    const popupHTML = `
                        <strong>Train ${p.label}</strong><br>
                        Route: ${p.routeId}<br>
                        Status: ${p.status}<br>
                        Speed: ${parseFloat(p.speed).toFixed(1)} m/s
                    `;
                    new maplibregl.Popup()
                        .setLngLat(e.features[0].geometry.coordinates)
                        .setHTML(popupHTML)
                        .addTo(map);
                });

                map.on("mouseenter", "metro-vehicles", () => map.getCanvas().style.cursor = "pointer");
                map.on("mouseleave", "metro-vehicles", () => map.getCanvas().style.cursor = "");
            }

            console.log(`Loaded ${features.length} vehicles`);
        } catch (err) {
            console.error("Failed to load vehicle positions:", err);
        }
    }

    // Load vehicles immediately and refresh every 30 seconds
    await loadVehicles();
    setInterval(loadVehicles, 30000);
});