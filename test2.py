import requests
from google.transit import gtfs_realtime_pb2
from google.protobuf.json_format import MessageToDict
import json
from datetime import datetime

# GTFS-Realtime feed URL
url = "https://metrolink-gtfsrt.gbsdigital.us/feed/gtfsrt-trips"

# Include your X-Api-Key in the headers
headers = {
    "X-Api-Key": "gMpUXrGPJJ8X9Pp2OivQC1czi046utCMabRM3XQg"
}

# Fetch the feed
response = requests.get(url, headers=headers)
response.raise_for_status()

# Parse the protobuf feed
feed = gtfs_realtime_pb2.FeedMessage()
feed.ParseFromString(response.content)

# Optional: Convert to dict/JSON for easier handling
feed_dict = MessageToDict(feed)

# Print trip updates
for entity in feed.entity:
    if entity.HasField('trip_update'):
        trip = entity.trip_update.trip
        stop_time_updates = entity.trip_update.stop_time_update
        print(f"Trip ID: {trip.trip_id}, Route ID: {trip.route_id}")
        for stop_update in stop_time_updates:
            stop_id = stop_update.stop_id
            arrival_time = stop_update.arrival.time if stop_update.HasField('arrival') else None
            departure_time = stop_update.departure.time if stop_update.HasField('departure') else None

            # Convert UNIX timestamp to readable format
            arrival_str = datetime.utcfromtimestamp(arrival_time).strftime('%Y-%m-%d %H:%M:%S') if arrival_time else "N/A"
            departure_str = datetime.utcfromtimestamp(departure_time).strftime('%Y-%m-%d %H:%M:%S') if departure_time else "N/A"

            print(f"  Stop: {stop_id}, Arrival: {arrival_str}, Departure: {departure_str}")

# Optional: Convert to JSON string if you want to return it in Flask
json_data = json.dumps(feed_dict, indent=2)
print(json_data)