const apikey = "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u";

const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", // <-- Background map
    center: [-118.25, 34.05],
    zoom: 12,
    transformRequest: (url, resourceType) => {
        if (resourceType === "Tile" && url.startsWith("https://transit.land")) {
            return { url: url + `?apikey=${apikey}` };
        }
    }
});

map.addControl(new maplibregl.NavigationControl());

map.on("load", () => {

    // Routes
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
        filter: ["==", ["get", "agency_id"], "LACMTA_Rail"] // Only LA Metro
    });

    // Stops
    map.addSource("stops", {
        type: "vector",
        tiles: ["https://transit.land/api/v2/tiles/stops/tiles/{z}/{x}/{y}.pbf"],
        maxzoom: 14
    });

    map.addLayer({
        id: "metro-stops",
        type: "circle",
        source: "stops",
        "source-layer": "stops", // confirm this name; can inspect tiles
        paint: {
            "circle-radius": 5,
            "circle-color": "#1a73e8",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        },
        filter: ["==", ["get", "feed_onestop_id"], "f-9q5-metro~losangeles~rail"]
    });
    // Add popups for metro stops
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

    // Change cursor on hover
    map.on("mouseenter", "metro-stops", () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", "metro-stops", () => map.getCanvas().style.cursor = "");
});