from flask import Flask, render_template
import requests

app = Flask(__name__)


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# About page
@app.route("/test")
def about():
    return render_template("test.html")


# Contact page
@app.route("/contact")
def contact():
    return render_template("contact.html")
@app.route("/map")
def map():
    return render_template("map.html")
@app.route("/bikes")
def bikes_page():
    url = "https://bts-status.bicycletransit.workers.dev/lax"
    headers = {'Accept': 'application/json'}

    try:
        response = requests.get(url, headers=headers)
        data = response.json()
    except Exception as e:
        return f"<h1>Error fetching data: {e}</h1>"

    return render_template("bikes.html", stations=data["features"])
@app.route("/station/<int:stop_id>")
def station_departures(stop_id):
    routes = requests.get("https://api.metro.net/LACMTA_Rail/route_overview").json()
    url = f"https://api.goswift.ly/real-time/lametro-rail/predictions?stop={stop_id}"
    headers = { "Authorization": "a083dc68622b251fd4fa2a63e055c3c9" }

    try:
        response = requests.get(url, headers=headers)
        data = response.json()
    except Exception as e:
        return f"<h1>Error fetching departure data: {e}</h1>"

    return render_template("station.html", routes=routes,stop_id=stop_id, data=data)
@app.route("/api/metro", methods=["GET"])
def metro_one_ping():
    import asyncio, websockets, json

    async def one_msg():
        url = "wss://api.metro.net/ws/LACMTA_Rail/vehicle_positions"
        async with websockets.connect(url) as ws:
            msg = await ws.recv()
            return json.loads(msg)

    data = asyncio.run(one_msg())
    return data


if __name__ == "__main__":
    app.run(debug=True,port=5050)
