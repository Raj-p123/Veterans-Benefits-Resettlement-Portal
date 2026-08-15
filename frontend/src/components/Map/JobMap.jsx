import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Briefcase, MapPin, Building2, ExternalLink, Navigation, Compass, AlertCircle } from 'lucide-react';
import Button from '../Button/Button.jsx';
import Badge from '../Badge/Badge.jsx';
import './JobMap.css';

// Custom SVG-based Pin Icon for Jobs
const createJobPinIcon = (isSelected = false) => {
  const pinColor = isSelected ? '#10B981' : '#146EF5';
  const shadowColor = isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(20, 110, 245, 0.35)';

  return L.divIcon({
    className: 'custom-job-pin-container',
    html: `
      <div class="custom-job-pin ${isSelected ? 'selected' : ''}" style="--pin-color: ${pinColor}; --pin-shadow: ${shadowColor};">
        <div class="pin-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div class="pin-tail"></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

// Custom Icon for User's Current Geolocation
const userLocationIcon = L.divIcon({
  className: 'custom-user-pin-container',
  html: `
    <div class="custom-user-pin">
      <div class="user-pulse-ring"></div>
      <div class="user-center-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Helper component to auto-recenter map bounds
function AutoRecenter({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom || 10, { animate: true });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

export const JobMap = ({
  jobs = [],
  userLocation = null,
  selectedJobId = null,
  onSelectJob = () => {},
  height = '560px',
  searchRadiusKm = null,
}) => {
  const [mapError, setMapError] = useState(false);

  // Filter jobs with valid coordinates
  const validJobMarkers = jobs.filter(
    (j) => j.latitude && j.longitude && !isNaN(Number(j.latitude)) && !isNaN(Number(j.longitude))
  );

  // Compute sensible default center
  // Default to India center or user location or first job
  let defaultCenter = [20.5937, 78.9629]; // Central India
  let defaultZoom = 5;

  if (userLocation && userLocation.latitude && userLocation.longitude) {
    defaultCenter = [userLocation.latitude, userLocation.longitude];
    defaultZoom = 11;
  } else if (validJobMarkers.length > 0) {
    defaultCenter = [validJobMarkers[0].latitude, validJobMarkers[0].longitude];
    defaultZoom = 8;
  }

  // Calculate bounding box for all markers
  let mapBounds = null;
  if (validJobMarkers.length > 0) {
    const latLngs = validJobMarkers.map((j) => [Number(j.latitude), Number(j.longitude)]);
    if (userLocation && userLocation.latitude) {
      latLngs.push([userLocation.latitude, userLocation.longitude]);
    }
    if (latLngs.length > 1) {
      mapBounds = L.latLngBounds(latLngs);
    }
  }

  if (mapError) {
    return (
      <div className="job-map-fallback-box" style={{ height }}>
        <AlertCircle size={32} color="#EF4444" />
        <h3>Map is currently unavailable</h3>
        <p>Interactive OpenStreetMap failed to render. You can continue viewing all job listings in List View.</p>
      </div>
    );
  }

  return (
    <div className="job-map-root" style={{ height }}>
      {/* Map Header Status Strip */}
      <div className="job-map-info-bar">
        <div className="map-info-left">
          <MapPin size={14} color="#146EF5" />
          <span>
            Showing <strong>{validJobMarkers.length}</strong> location-verified job postings
          </span>
        </div>
        {userLocation && (
          <div className="map-user-loc-badge">
            <Navigation size={12} />
            <span>Nearby GPS Mode Active</span>
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="leaflet-job-map-container"
        whenCreated={() => {}}
      >
        {/* Auto Recenter Manager */}
        <AutoRecenter
          center={defaultCenter}
          zoom={defaultZoom}
          bounds={mapBounds}
        />

        {/* Required OpenStreetMap Tile Layer + Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Geolocation Marker & Radius Circle */}
        {userLocation && userLocation.latitude && userLocation.longitude && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup className="custom-leaflet-popup">
                <div className="user-location-popup">
                  <strong>Your Location</strong>
                  <p>Searching for defense jobs near you</p>
                </div>
              </Popup>
            </Marker>

            {searchRadiusKm && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: '#146EF5',
                  fillColor: '#146EF5',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            )}
          </>
        )}

        {/* Job Markers */}
        {validJobMarkers.map((job) => {
          const isSelected = selectedJobId === (job.id || job._id || job.jobId);
          const salaryDisplay =
            job.salaryMin && job.salaryMax
              ? `₹ ${job.salaryMin.toLocaleString('en-IN')} - ${job.salaryMax.toLocaleString('en-IN')}`
              : job.salaryMin
              ? `₹ ${job.salaryMin.toLocaleString('en-IN')}+`
              : 'Competitive Defense Compensation';

          const employerName =
            job.employer?.companyName || job.companyName || 'Verified Defense Employer';

          return (
            <Marker
              key={job.id || job._id || job.jobId}
              position={[Number(job.latitude), Number(job.longitude)]}
              icon={createJobPinIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectJob(job.id || job._id || job.jobId),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="job-marker-popup-content">
                  <div className="popup-header-row">
                    <span className="popup-category-badge">{job.industry || 'Defense'}</span>
                    <span className="popup-job-type">
                      {(job.employmentType || 'FULL_TIME').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="popup-job-title">{job.title}</h3>

                  <div className="popup-employer-name">
                    <Building2 size={13} />
                    <span>{employerName}</span>
                  </div>

                  <div className="popup-location-row">
                    <MapPin size={13} />
                    <span>{job.city || job.location}, {job.state}</span>
                  </div>

                  {job.distanceText && (
                    <div className="popup-distance-tag">
                      <Navigation size={11} />
                      <span>{job.distanceText}</span>
                    </div>
                  )}

                  <div className="popup-salary-text">{salaryDisplay}</div>

                  <div className="popup-actions-row">
                    <Link to={`/jobs/${job.id || job._id || job.jobId}`} className="popup-view-btn">
                      <span>View Job Details</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default JobMap;
