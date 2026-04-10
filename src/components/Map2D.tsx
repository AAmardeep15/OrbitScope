'use client';

import { useSatelliteStore } from '@/lib/satellite-store';
import { calculateOrbitPath } from '@/lib/satellite-utils';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';

// Leaflet uses some global vars which break in SSR, so we only render MapContainer if window is defined.

function ViewHandler() {
  const setViewMode = useSatelliteStore((state) => state.setViewMode);
  
  const map = useMapEvents({
    zoomend: () => {
      // Switch back to 3D mode if user zooms out enough
      if (map.getZoom() < 3) {
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

  return (
    <Polyline 
      positions={positions} 
      pathOptions={{ color: '#facc15', weight: 2, dashArray: '5, 10', opacity: 0.6 }} 
    />
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
        
        let color = '#4ade80'; // Default green
        if (isSelected) color = '#facc15'; // Yellow if selected
        else if (sat.orbitType === 'GEO') color = '#60a5fa'; // Blue
        else if (sat.orbitType === 'MEO') color = '#a78bfa'; // Purple

        return (
          <CircleMarker
            key={sat.id}
            center={[sat.position.latitude, sat.position.longitude]}
            radius={isSelected ? 6 : 3}
            pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: 0.8 }}
            eventHandlers={{
              click: () => selectSatellite(sat)
            }}
          >
            {(showLabels || isSelected) && (
              <Tooltip permanent={isSelected} direction="top" className="bg-black/80 text-white border-0 text-xs">
                {sat.name}
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function Map2D() {
  const isPlaying = useSatelliteStore((state) => state.isPlaying);
  const setCurrentTime = useSatelliteStore((state) => state.setCurrentTime);
  const updatePositions = useSatelliteStore((state) => state.updatePositions);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updatePositions();
    }, 1000); // 1 second update interval for 2D map to save performance over 100ms
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, updatePositions]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[0, 0]} 
        zoom={3} 
        style={{ height: '100%', width: '100%', background: '#000000' }}
        zoomControl={false}
        worldCopyJump={true}
        minZoom={2}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ViewHandler />
        <SatellitesLayer />
        <SelectedOrbitPath />
      </MapContainer>
      
      {/* Small indicator */}
      <div className="absolute top-4 right-4 z-[400] glass-panel px-4 py-2 rounded-full text-xs font-bold text-on-surface/70 uppercase tracking-widest border border-outline-variant/30 backdrop-blur-md bg-surface-container/50 pointer-events-none">
        Zoom out to return to 3D
      </div>
    </div>
  );
}
