'use client';
import { useEffect, useRef } from 'react';

export default function MapComponent({ lat, lng, name, requests, volunteers, onMapClick, selectedLocation, routeCoordinates }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const baseMarkerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    
    // Fix default marker icon issues in Webpack/Next.js
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        dragging: true
      }).setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    } else if (mapRef.current) {
      // Avoid jarring jumps if user is interacting, but center on base if coords change significantly
      const currentCenter = mapRef.current.getCenter();
      if (Math.abs(currentCenter.lat - lat) > 0.05 || Math.abs(currentCenter.lng - lng) > 0.05) {
        mapRef.current.setView([lat, lng]);
      }
    }

    const map = mapRef.current;
    if (!map) return;

    // 1. Sync Base Station Marker as a Resource Depot (Red Pin icon)
    if (baseMarkerRef.current) {
      baseMarkerRef.current.remove();
    }
    const baseIcon = L.divIcon({
      className: 'base-station-marker',
      html: `<div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;"><i class="fas fa-map-pin" style="color: #ef4444; font-size: 26px; filter: drop-shadow(0 0 4px rgba(239,68,68,0.8));"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
    baseMarkerRef.current = L.marker([lat, lng], { icon: baseIcon })
      .addTo(map)
      .bindPopup(`<b>📡 ResQ Link Resource Depot (${name})</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}<br>Status: Active Depot`);

    // 2. Clear old request, volunteer, and shelter markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 3. Add Shelters (Green sphere markers with house icon)
    const mockShelters = [
      { lat: lat + 0.003, lng: lng - 0.004, name: 'Mandya Emergency Shelter A', capacity: '120/150' },
      { lat: lat - 0.004, lng: lng + 0.005, name: 'MIMS Doctors Quarters Shelter', capacity: '85/100' }
    ];
    mockShelters.forEach(s => {
      const shelterIcon = L.divIcon({
        className: 'shelter-marker',
        html: `<div style="background: radial-gradient(circle at 30% 30%, #22c55e, #15803d); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(34,197,94,0.8);"><i class="fas fa-home" style="color: white; font-size: 11px;"></i></div>`,
        iconSize: [24, 24]
      });
      const shelterMarker = L.marker([s.lat, s.lng], { icon: shelterIcon })
        .addTo(map)
        .bindPopup(`<b>🟢 Shelter: ${s.name}</b><br>Capacity: ${s.capacity}<br>Status: Operational`);
      markersRef.current.push(shelterMarker);
    });

    // 4. Add Active Request Markers (Disaster Zones - Red spheres with exclamation triangle)
    requests.forEach(req => {
      if (req.status !== 'resolved') {
        const customIcon = L.divIcon({
          className: 'custom-request-marker',
          html: `<div style="background: radial-gradient(circle at 30% 30%, #ef4444, #b91c1c); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(239,68,68,0.8);"><i class="fas fa-exclamation-triangle" style="color: white; font-size: 10px;"></i></div>`,
          iconSize: [24, 24]
        });

        const reqMarker = L.marker([req.lat, req.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <b>🚨 Disaster Zone: ${req.requestId} (${req.resourceType})</b><br>
            Severity: ${req.severity} | Affected: ${req.individualsAffected}<br>
            Priority Score: ${req.priorityScore}<br>
            Status: ${req.status.toUpperCase()}
          `);
        markersRef.current.push(reqMarker);
      }
    });

    // 5. Add Volunteer Markers (Rescue Teams - Blue spheres with shield icon)
    volunteers.forEach(v => {
      const icon = L.divIcon({
        className: 'volunteer-marker',
        html: `<div style="background: radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(59,130,246,0.8);"><i class="fas fa-user-shield" style="color: white; font-size: 10px;"></i></div>`,
        iconSize: [24, 24]
      });

      const volMarker = L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>🔵 Rescue Team: ${v.name}</b><br>Role: ${v.role}<br>Status: ${v.status.toUpperCase()}`);
      markersRef.current.push(volMarker);
    });

    // 6. Setup map click handler to emit location
    const onMapClicked = (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };
    map.on('click', onMapClicked);

    return () => {
      map.off('click', onMapClicked);
    };
  }, [lat, lng, name, requests, volunteers, onMapClick]);

  // 7. Draw Selected Location Marker dynamically
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const L = require('leaflet');

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedLocation) {
      selectedMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng])
        .addTo(map)
        .bindPopup(`<b>Emergency Target Point</b><br>Lat: ${selectedLocation.lat.toFixed(6)}<br>Lng: ${selectedLocation.lng.toFixed(6)}`)
        .openPopup();
    }
  }, [selectedLocation]);

  // 8. Draw route polyline dynamically
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const L = require('leaflet');

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      routePolylineRef.current = L.polyline(routeCoordinates, { color: '#1a1a1a', weight: 5 }).addTo(map);
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [routeCoordinates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Map Container (90% split) */}
      <div style={{ width: '90%', position: 'relative', minHeight: '400px', height: '100%' }}>
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
      </div>
      
      {/* Scroll Safe Zone (10% split - completely empty) */}
      <div style={{ width: '10%', background: 'transparent' }} />
    </div>
  );
}

