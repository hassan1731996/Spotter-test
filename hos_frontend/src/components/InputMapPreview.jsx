import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Icons via L.divIcon
const createIcon = (type) => {
  let colorClass = 'bg-blue-500';
  let iconChar = '📍';
  const typeLower = type ? type.toLowerCase() : '';

  switch (typeLower) {
    case 'start':
      colorClass = 'bg-brand-success';
      iconChar = '🏁';
      break;
    case 'pickup':
      colorClass = 'bg-brand-blue';
      iconChar = '📦';
      break;
    case 'dropoff':
      colorClass = 'bg-brand-navy';
      iconChar = '🏁';
      break;
    default:
      break;
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="w-8 h-8 rounded-full ${colorClass} border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">${iconChar}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const Recenter = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [points, map]);
  return null;
};

const InputMapPreview = ({ locations }) => {
  // locations: [{ lat, lng, type }]
  const validPoints = locations.filter((l) => l.lat && l.lng);

  return (
    <div className="h-48 w-full bg-gray-100 rounded-lg overflow-hidden relative shadow-sm border border-gray-200">
      <MapContainer
        center={[39.82, -98.57]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {validPoints.map((pt, i) => (
          <Marker key={i} position={[pt.lat, pt.lng]} icon={createIcon(pt.type)}>
            <Popup>
              <div className="p-1">
                <strong className="block text-brand-navy mb-1">{pt.type}</strong>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -32]} opacity={1} className="custom-tooltip">
              {pt.type}
            </Tooltip>
          </Marker>
        ))}
        <Recenter points={validPoints.map((p) => [p.lat, p.lng])} />
      </MapContainer>
      <div className="absolute bottom-1 right-1 bg-white/80 px-2 py-1 text-xs rounded z-[400] pointer-events-none font-semibold text-slate-500">
        Route Preview
      </div>
    </div>
  );
};

export default InputMapPreview;
