'use client';

import { useSatelliteStore } from '@/lib/satellite-store';
import { calculateOrbitPath } from '@/lib/satellite-utils';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents, GeoJSON } from 'react-leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';

function ViewHandler() {
  const setViewMode = useSatelliteStore((state) => state.setViewMode);
  
  const map = useMapEvents({
    zoomend: () => {
      if (map.getZoom() <= 2) {
        setViewMode('3d');
      }
    }
  });

  return null;
}

function SelectedOrbitPath() {
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);
  const showOrbitPaths = useSatelliteStore((state) => state.showOrbitPaths);
  const currentTime = useSatelliteStore((state) => state.currentTime);
  
  if (!selectedSatellite || !showOrbitPaths) return null;

  const pathPoints = calculateOrbitPath(selectedSatellite.tle, currentTime, 120, 1);
  const positions: [number, number][] = pathPoints.map(p => [p.lat, p.lng]);

  if (positions.length === 0) return null;

  // Split path at antimeridian crossings to avoid lines across the map
  const segments: [number, number][][] = [[]];
  for (let i = 0; i < positions.length; i++) {
    segments[segments.length - 1].push(positions[i]);
    if (i < positions.length - 1 && Math.abs(positions[i][1] - positions[i + 1][1]) > 180) {
      segments.push([]);
    }
  }

  return (
    <>
      {segments.map((seg, i) => 
        seg.length > 1 ? (
          <Polyline 
            key={i}
            positions={seg} 
            pathOptions={{ color: '#facc15', weight: 2, dashArray: '6, 8', opacity: 0.7 }} 
          />
        ) : null
      )}
    </>
  );
}

function SatellitesLayer() {
  const satellites = useSatelliteStore.getState().getFilteredSatellites();
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  const showLabels = useSatelliteStore((state) => state.showLabels);

  return (
    <>
      {satellites.map((sat) => {
        if (!sat.position) return null;
        
        const isSelected = selectedSatellite?.id === sat.id;
        
        let color = '#4ade80';
        if (isSelected) color = '#facc15';
        else if (sat.orbitType === 'GEO') color = '#60a5fa';
        else if (sat.orbitType === 'MEO') color = '#a78bfa';

        return (
          <CircleMarker
            key={sat.id}
            center={[sat.position.latitude, sat.position.longitude]}
            radius={isSelected ? 7 : 4}
            pathOptions={{ 
              color: isSelected ? '#facc15' : 'transparent', 
              weight: isSelected ? 2 : 0,
              fillColor: color, 
              fillOpacity: 0.9 
            }}
            eventHandlers={{
              click: () => selectSatellite(sat)
            }}
          >
            {(showLabels || isSelected) && (
              <Tooltip 
                permanent={isSelected} 
                direction="top" 
                offset={[0, -8]}
                className="satellite-tooltip"
              >
                <span style={{ 
                  color: isSelected ? '#facc15' : '#8ff5ff', 
                  fontWeight: isSelected ? 700 : 400,
                  fontFamily: 'var(--font-space-grotesk), monospace',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const
                }}>
                  {sat.name}
                </span>
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}

// Country borders overlay via GeoJSON
function CountryBorders() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Load countries GeoJSON for border outlines
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(() => {/* silently fail — tile labels still show countries */});
  }, []);

  if (!geoData) return null;

  return (
    <GeoJSON 
      data={geoData}
      style={() => ({
        color: '#8ff5ff',
        weight: 0.6,
        opacity: 0.25,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false,
      })}
    />
  );
}

export default function Map2D() {
  const isPlaying = useSatelliteStore((state) => state.isPlaying);
  const setCurrentTime = useSatelliteStore((state) => state.setCurrentTime);
  const updatePositions = useSatelliteStore((state) => state.updatePositions);
  const setViewMode = useSatelliteStore((state) => state.setViewMode);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updatePositions();
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, updatePositions]);

  return (
    <div 
      className="w-full h-full relative z-0"
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <MapContainer 
        center={[20, 0]} 
        zoom={3} 
        style={{ height: '100%', width: '100%', background: '#0c0e12' }}
        zoomControl={false}
        worldCopyJump={true}
        minZoom={2}
        maxZoom={18}
      >
        {/* Dark base map with terrain */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Country borders overlay with cyan tint */}
        <CountryBorders />

        <ViewHandler />
        <SatellitesLayer />
        <SelectedOrbitPath />
      </MapContainer>
      
      {/* Transition indicator */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3">
        <button
          onClick={() => setViewMode('3d')}
          className="glass-panel ghost-border px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-primary hover:bg-primary/10 transition-all duration-300 cursor-pointer flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <ellipse cx="12" cy="12" rx="10" ry="4"/>
            <line x1="12" y1="2" x2="12" y2="22"/>
          </svg>
          Return to 3D Globe
        </button>
      </div>

      {/* View mode label */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel ghost-border px-4 py-2 rounded-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-[0.2em] font-mono">
          Terrestrial View — Zoom In for Details
        </span>
      </div>
    </div>
  );
}
