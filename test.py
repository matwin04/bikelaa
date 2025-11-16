import asyncio
import websockets
import json

async def get_positions():
    url = "wss://api.metro.net/ws/LACMTA_Rail/vehicle_positions"
    async with websockets.connect(url) as ws:
        print("Connected to LA Metro WebSocket")

        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            print(data)

asyncio.run(get_positions())