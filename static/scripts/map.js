// Initialize the map
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json', // Basic MapLibre style
    center: [-118.2437, 34.0522], // LA coordinates
    zoom: 11
  });
  
  // Add zoom and rotation controls
  map.addControl(new maplibregl.NavigationControl());
  
  // Add markers from table data
  const stations = JSON.parse(document.getElementById('stations-data').textContent || '[]');
  
  stations.forEach(station => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.textContent = station.properties.bikesAvailable;
  
    new maplibregl.Marker(el)
      .setLngLat([station.geometry.coordinates[0], station.geometry.coordinates[1]])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <strong>${station.properties.name}</strong><br>
          Bikes Available: ${station.properties.bikesAvailable}<br>
          Docks Available: ${station.properties.docksAvailable}
        `)
      )
      .addTo(map);
  });
  