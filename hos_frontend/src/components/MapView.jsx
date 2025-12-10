import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
        <div className="h-96 w-full bg-gray-100 rounded-lg overflow-hidden shadow">
            <MapContainer center={center} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stops.map(stop => (
                    stop.latitude && (
                        <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
                            <Popup>
                                {stop.name} ({stop.kind})
                            </Popup>
                            <Tooltip direction="top" offset={[0, -20]} opacity={1}>
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
