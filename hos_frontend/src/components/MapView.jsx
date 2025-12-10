import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom Icons via L.divIcon
const createIcon = (type) => {
    let colorClass = 'bg-blue-500';
    let iconChar = '📍';

    switch (type) {
        case 'start': colorClass = 'bg-brand-success'; iconChar = '🏁'; break;
        case 'pickup': colorClass = 'bg-brand-blue'; iconChar = '📦'; break;
        case 'dropoff': colorClass = 'bg-brand-navy'; iconChar = '🏁'; break;
        case 'rest': colorClass = 'bg-brand-warning'; iconChar = '☕'; break;
        case 'fuel': colorClass = 'bg-purple-500'; iconChar = '⛽'; break;
        default: break;
    }

    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-8 h-8 rounded-full ${colorClass} border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">${iconChar}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng]);
        }
    }, [lat, lng, map]);
    return null;
};

const MapView = ({ stops, segments }) => {
    // Calculate center or bounds
    const center = [39.8283, -98.5795]; // US Center

    // Decode polyline? For now, just draw straight lines between stops if no geometry
    const positions = stops.map(s => [s.latitude || 0, s.longitude || 0]).filter(p => p[0] !== 0);

    return (
        <div className="h-full w-full bg-gray-100 rounded-lg overflow-hidden shadow">
            <MapContainer center={center} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stops.map(stop => (
                    stop.latitude && (
                        <Marker
                            key={stop.id}
                            position={[stop.latitude, stop.longitude]}
                            icon={createIcon(stop.kind)}
                        >
                            <Popup>
                                <div className="p-1">
                                    <strong className="block text-brand-navy mb-1">{stop.name}</strong>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">{stop.kind}</span>
                                        {stop.duration_minutes > 0 && (
                                            <span className="text-xs text-slate-500">{stop.duration_minutes} min</span>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -32]} opacity={1} className="custom-tooltip">
                                {stop.name} ({stop.kind})
                            </Tooltip>
                        </Marker>
                    )
                ))}
                {positions.length > 1 && <Polyline positions={positions} color="blue" />}
            </MapContainer>
        </div>
    );
};

export default MapView;
