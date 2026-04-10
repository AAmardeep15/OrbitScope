'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSatelliteStore } from '@/lib/satellite-store';
import { parseTLEToSatelliteInfo } from '@/lib/satellite-utils';
import Sidebar from '@/components/Sidebar';
import EarthGlobe from '@/components/Earth';
import SatelliteDetailPanel from '@/components/SatelliteDetailPanel';

// Dynamically import Map2D because leaflet depends on window object
const Map2D = dynamic(() => import('@/components/Map2D'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-surface-container-lowest flex items-center justify-center text-primary animate-pulse">Initializing Terrestrial Map...</div> 
});

export default function Home() {
  const { setSatellites, setLoading, setError, isLoading } = useSatelliteStore();
  const [init, setInit] = useState(false);

  const viewMode = useSatelliteStore((state) => state.viewMode);

  const isPlaying = useSatelliteStore((state) => state.isPlaying);
  const currentTime = useSatelliteStore((state) => state.currentTime);
  const showLabels = useSatelliteStore((state) => state.showLabels);
  const showOrbitPaths = useSatelliteStore((state) => state.showOrbitPaths);
  const togglePlaying = useSatelliteStore((state) => state.togglePlaying);
  const toggleLabels = useSatelliteStore((state) => state.toggleLabels);
  const toggleOrbitPaths = useSatelliteStore((state) => state.toggleOrbitPaths);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // We fetch from our API route that caches the CelesTrak response
        const res = await fetch('/api/tle');
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const tles = await res.json();
        
        // Parse TLEs - just taking the first 1500 for better performance 
        // while still looking impressive
        const limit = Math.min(tles.length, 1500);
        const parsedSatellites = [];
        
        for (let i = 0; i < limit; i++) {
          const sat = parseTLEToSatelliteInfo(tles[i]);
          if (sat && sat.id) {
            parsedSatellites.push(sat as any);
          }
        }
        
        setSatellites(parsedSatellites);
        useSatelliteStore.getState().updatePositions();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setInit(true);
      }
    }

    if (!init) {
      loadData();
    }
  }, [init, setLoading, setSatellites, setError]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-surface-container-lowest font-body text-on-surface selection:bg-primary/30">
      <Sidebar />
      
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-50">
            <div className="w-48 h-48 rounded-full border border-surface-container relative animate-[spin_10s_linear_infinite] mb-8">
              <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_var(--color-primary)]"></div>
              <div className="absolute bottom-0 right-1/2 -mr-1 w-1 h-1 bg-primary-dim rounded-full shadow-[0_0_10px_var(--color-primary-dim)] opacity-50"></div>
            </div>
            <h2 className="text-xl font-display font-medium text-on-surface tracking-[0.2em] uppercase">Tuning Instruments</h2>
            <p className="text-primary font-mono text-[10px] mt-4 uppercase tracking-[0.3em] animate-pulse">Establishing Telemetry Link...</p>
          </div>
        ) : viewMode === '2d' ? (
          <Map2D />
        ) : (
          <EarthGlobe />
        )}
        
        <SatelliteDetailPanel />
        
        {init && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel rounded-full ghost-border p-3 flex items-center gap-6 px-8 opacity-60 hover:opacity-100 transition-opacity duration-300 ambient-shadow">
            <button 
              onClick={() => togglePlaying()}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isPlaying ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(143,245,255,0.2)]' : 'bg-surface-bright text-on-surface hover:text-primary'} ghost-border`}
              aria-label={isPlaying ? 'Pause tracking' : 'Resume tracking'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="font-mono text-sm text-primary flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Live Time</span>
              <span className="flicker-transition font-bold">{currentTime.toISOString().split('T')[1].split('.')[0]} <span className="opacity-50 text-xs">UTC</span></span>
            </div>
            
            <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
            
            <button 
              onClick={() => toggleLabels()}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${showLabels ? 'btn-primary' : 'btn-secondary'}`}
            >
              Labels
            </button>

            <button 
              onClick={() => toggleOrbitPaths()}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${showOrbitPaths ? 'btn-primary' : 'btn-secondary'}`}
            >
              Orbit Paths
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
