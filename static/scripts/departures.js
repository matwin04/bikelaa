// Color ramp
const routeColors = {
    801: "#0072BC",
    802: "#EB131B",
    803: "#58A738",
    804: "#FDB913",
    805: "#A05DA5",
    807: "#E56DB1",
    unknown: "#AAAAAA"
};

// Route letters (just the single letter for the circle)
const routeLetters = {
    801: "A",
    802: "B",
    803: "C",
    804: "E",
    805: "D",
    807: "K",
    unknown: "?"
};

async function getDepartures() {
    const stopId = window.STOP_ID;
    const url = `https://api.goswift.ly/real-time/lametro-rail/predictions?stop=${stopId}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "a083dc68622b251fd4fa2a63e055c3c9"
            }
        });

        const data = await response.json();
        const tableBody = document.getElementById("departures-body");
        tableBody.innerHTML = ""; // Clear old rows

        const results = data?.data?.predictionsData;

        if (!results || results.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="4"><i>No departures available</i></td></tr>
            `;
            return;
        }

        let departures = [];

        // Loop through all routes
        for (let r = 0; r < results.length; r++) {
            const route = results[r];
            const routeId = route.routeId;
            const routeName = route.routeShortName;
            const destinations = route.destinations;

            for (let d = 0; d < destinations.length; d++) {
                const dest = destinations[d];
                const headsign = dest.headsign;

                for (let p = 0; p < dest.predictions.length; p++) {
                    const pred = dest.predictions[p];

                    departures.push({
                        routeId: routeId,
                        route: routeName,
                        headsign: headsign,
                        min: pred.min,
                        vehicleId: pred.vehicleId
                    });
                }
            }
        }

        departures.sort((a, b) => a.min - b.min);

        // Render departures
        departures.forEach(dep => {
            const row = document.createElement("tr");

            const color = routeColors[dep.routeId] || routeColors.unknown;
            const letter = routeLetters[dep.routeId] || "?";

            row.innerHTML = `
                <td>
                    <div style="
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background-color: ${color};
                        color: white;
                        font-weight: bold;
                        font-family: Arial, sans-serif;
                        text-align: center;
                        line-height: 30px;
                    ">
                        ${letter}
                    </div>
                </td>
                <td>${dep.headsign}</td>
                <td>${dep.min} min</td>
                <td>${dep.vehicleId}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading departures:", error.message);
    }
}

window.addEventListener("load", getDepartures);