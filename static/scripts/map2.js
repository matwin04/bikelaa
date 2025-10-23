const apikey = "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u";

// Example route-color map (map routeId -> color)
const routeColors = {
    "801": "#0072BC",
    "802": "#EB131B",
    "803": "#58A738",
    "804": "#FDB913",
    "805": "#A05DA5",
    "807": "#E56DB1",
    // Add more as needed
};

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
                ["has", "route_color"],
                ["get", "route_color"],
                "#ff0000"
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

    // ---- POPUPS FOR STOPS ----
    map.on("click", "metro-stops", (e) => {
        const props = e.features[0].properties;
        const popupHTML = `
            <div class="popup">
                <a href="/departures/${props.onestop_id}">View</a>
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
    async function loadVehicles() {
        try {
            const res = await fetch(
                "https://transit.land/api/v2/rest/feeds/f-metro~losangeles~rail~rt/download_latest_rt/vehicle_positions.json",
                {
                    headers: {
                        "apikey": "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u"
                    }
                }
            );
            const data = await res.json();

            if (!data.entity) return;

            const features = data.entity
                .filter(v => v.vehicle && v.vehicle.position)
                .map(v => {
                    const routeId = v.vehicle.trip?.routeId || "unknown";
                    return {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [v.vehicle.position.longitude, v.vehicle.position.latitude]
                        },
                        properties: {
                            id: v.id,
                            label: v.vehicle.vehicle?.label || "Unknown",
                            routeId,
                            status: v.vehicle.currentStatus || "Unknown",
                            speed: v.vehicle.position.speed || 0,
                            color: routeColors[routeId] || "#888888"
                        }
                    };
                });

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
                        "circle-color": ["get", "color"],  // Color by route
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#ffffffff"
                    }
                });

                map.on("click", "metro-vehicles", (e) => {
                    const p = e.features[0].properties;
                    const popupHTML = `
                    <div class="popup">
                        <strong>Train ${p.label}</strong><br>
                        <a href="/trips/${p.trip}">${p.trip}</a>
                        Route: ${p.routeId}<br>
                        Status: ${p.status}<br>
                        Speed: ${parseFloat(p.speed).toFixed(1)} m/s
                    </div>
                    `;
                    new maplibregl.Popup()
                        .setLngLat(e.features[0].geometry.coordinates)
                        .setHTML(popupHTML)
                        .addTo(map);
                });

                map.on("mouseenter", "metro-vehicles", () => map.getCanvas().style.cursor = "pointer");
                map.on("mouseleave", "metro-vehicles", () => map.getCanvas().style.cursor = "");
            }

        } catch (err) {
            console.error("Failed to load vehicle positions:", err);
        }
    }

    // Load immediately and repeat every 15 seconds
    await loadVehicles();
    setInterval(loadVehicles, 15000);
});