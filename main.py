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


# Another example route
@app.route("/routes")
def routes_page():
    url = "https://api.metro.net/LACMTA_Rail/route_overview"
    headers = {'Accept': 'application/json'}
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
    except Exception as e:
        return f"<h1>Error fetching data: {e}</h1>"
    return render_template("routes.html", routes=data)


@app.route("/routes/<route_id>")
def route_detail(route_id):
    url = f"https://api.metro.net/LACMTA_Rail/routes/{route_code}"
    headers = {'Accept': 'application/json'}
    print(url)
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
    except Exception as e:
        return f"<h1>Error fetching route {route_id}: {e}</h1>"

    # Render a template showing the details for this route
    return render_template("route_detail.html", route=data)

@app.route("/departures/<station_id>")
def station_departures(station_id):
    print("Fetching departures for:", station_id)
    url = f"https://transit.land/api/v2/rest/stops/{station_id}/departures"
    headers = {
        "Accept": "application/json",
        "apikey": "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print("Error fetching departures:", e)
        data = {}  # fallback empty data

    # Pass the entire data to the template
    return render_template(
        "departures.html",
        data=data,
        station_id=station_id
    )
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


if __name__ == "__main__":
    app.run(debug=True)
