import requests

def send_request():
    response = requests.get(
        "https://transit.land/api/v2/rest/stops/s-9mur2zj6xc-irvine/departures",
        headers={"apikey": "WOo9vL8ECMWN76EcKjsNGfo8YgNZ7c2u"},
    )

    data = response.json()
    departures = data["stops"][0]["departures"]

    print(f"{'Time':<10} {'Headsign':<25} {'Route'}")
    print("-" * 50)

    for dep in departures:
        time = dep["departure_time"]
        headsign = dep["trip"]["trip_headsign"]
        route_short = dep["trip"]["route"]["route_short_name"]
        print(f"{time:<10} {headsign:<25} {route_short}")

send_request()