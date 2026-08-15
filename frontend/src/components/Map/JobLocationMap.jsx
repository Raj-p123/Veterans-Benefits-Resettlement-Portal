import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Shield, Building2 } from 'lucide-react';
import './JobLocationMap.css';

// Coordinates mapping for major defense / industrial hubs
const CITY_COORDINATES = {
  pune: { lat: 18.5204, lon: 73.8567, zoom: 13 },
  bangalore: { lat: 12.9716, lon: 77.5946, zoom: 13 },
  bengaluru: { lat: 12.9716, lon: 77.5946, zoom: 13 },
  hyderabad: { lat: 17.385, lon: 78.4867, zoom: 13 },
  delhi: { lat: 28.6139, lon: 77.209, zoom: 13 },
  'new delhi': { lat: 28.6139, lon: 77.209, zoom: 13 },
  mumbai: { lat: 19.076, lon: 72.8777, zoom: 13 },
  chennai: { lat: 13.0827, lon: 80.2707, zoom: 13 },
  kolkata: { lat: 22.5726, lon: 88.3639, zoom: 13 },
  nagpur: { lat: 21.1458, lon: 79.0882, zoom: 13 },
  bhubaneswar: { lat: 20.2961, lon: 85.8245, zoom: 13 },
  cuttack: { lat: 20.4625, lon: 85.883, zoom: 13 },
  chandigarh: { lat: 30.7333, lon: 76.7794, zoom: 13 },
  jaipur: { lat: 26.9124, lon: 75.7873, zoom: 13 },
  lucknow: { lat: 26.8467, lon: 80.9462, zoom: 13 },
  dehradun: { lat: 30.3165, lon: 78.0322, zoom: 13 },
  coimbatore: { lat: 11.0168, lon: 76.9558, zoom: 13 },
  nashik: { lat: 19.9975, lon: 73.7898, zoom: 13 },
};

const customLocationPin = L.divIcon({
  className: 'custom-single-pin-container',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: #146EF5;
      box-shadow: 0 4px 10px rgba(20, 110, 245, 0.45);
      border: 2.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export const JobLocationMap = ({
  city = '',
  state = '',
  location = '',
  workMode = 'ONSITE',
  latitude = null,
  longitude = null,
}) => {
  const [mapError, setMapError] = useState(false);

  const cityKey = (city || '').toLowerCase().trim();
  let lat = latitude ? parseFloat(latitude) : null;
  let lon = longitude ? parseFloat(longitude) : null;

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    const fallbackCoords = CITY_COORDINATES[cityKey] || { lat: 20.5937, lon: 78.9629, zoom: 6 };
    lat = fallbackCoords.lat;
    lon = fallbackCoords.lon;
  }

  const searchQuery = encodeURIComponent(
    [location, city, state, 'India'].filter(Boolean).join(', ')
  );
  const directionsUrl = `https://www.openstreetmap.org/search?query=${searchQuery}`;

  return (
    <div className="job-location-map-card">
      <div className="map-header">
        <h3>
          <MapPin size={18} className="text-primary" /> Deployment Location & Facility Map
        </h3>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: workMode === 'REMOTE' ? '#f0fdf4' : '#eff6ff',
            color: workMode === 'REMOTE' ? '#166534' : '#1d4ed8',
          }}
        >
          {workMode}
        </span>
      </div>

      <div className="map-container-frame">
        {!mapError && lat && lon ? (
          <MapContainer
            center={[lat, lon]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <Marker position={[lat, lon]} icon={customLocationPin}>
              <Popup>
                <div style={{ padding: '4px 6px', fontSize: '0.8125rem' }}>
                  <strong style={{ color: '#071B3A', display: 'block' }}>{location || city}</strong>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{city}, {state}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="map-fallback-view">
            <div className="map-fallback-pin">
              <MapPin size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>
              {location || `${city}, ${state}`}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
              Facility map preview unavailable. Click below for live directions.
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
            >
              Open in OpenStreetMap <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>

      <div className="map-footer">
        <div>
          <strong>Facility:</strong> {location ? `${location}, ` : ''}
          {city}, {state}
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#146EF5',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            textDecoration: 'none',
          }}
        >
          Open in OpenStreetMap <Navigation size={13} />
        </a>
      </div>
    </div>
  );
};

export default JobLocationMap;
