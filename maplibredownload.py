import os
import requests

# Local target directory
TARGET_DIR = "static/maplibre-gl"
os.makedirs(TARGET_DIR, exist_ok=True)

# MapLibre files to download
FILES = {
    "maplibre-gl.js": "https://unpkg.com/maplibre-gl@^5.9.0/dist/maplibre-gl.js",
    "maplibre-gl.css": "https://unpkg.com/maplibre-gl@^5.9.0/dist/maplibre-gl.css",
    # Web worker (required for local rendering)
    "maplibre-gl-csp-worker.js": "https://unpkg.com/maplibre-gl@^5.9.0/dist/maplibre-gl-csp-worker.js",
}

for filename, url in FILES.items():
    print(f"⬇️ Downloading {filename}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(os.path.join(TARGET_DIR, filename), "wb") as f:
            f.write(response.content)
        print(f"✅ Saved {filename} → {TARGET_DIR}/{filename}")
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")

print("\n✨ All MapLibre GL assets downloaded successfully!\n")
print("Add these lines to your HTML <head> section:\n")
print("""<link rel="stylesheet" href="/static/maplibre-gl/maplibre-gl.css">
<script src="/static/maplibre-gl/maplibre-gl.js"></script>""")