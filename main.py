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
@app.route("/map")
def map():
    return render_template("map.html")
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
