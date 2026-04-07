'use client';

import { useEffect, useState } from 'react';
import { useSatelliteStore } from '@/lib/satellite-store';
import { parseTLEToSatelliteInfo } from '@/lib/satellite-utils';
import Sidebar from '@/components/Sidebar';
import EarthGlobe from '@/components/Earth';
import SatelliteDetailPanel from '@/components/SatelliteDetailPanel';

export default function Home() {
  const { setSatellites, setLoading, setError, isLoading } = useSatelliteStore();
  const [init, setInit] = useState(false);

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
    <main className="flex h-screen w-screen overflow-hidden bg-surface-container-lowest font-body text-on-surface">
      <Sidebar />
      
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest z-50">
            <div className="w-16 h-16 border-2 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-display primary-gradient-text tracking-widest uppercase">Initializing OrbitScope</h2>
            <p className="text-on-surface-variant font-mono text-xs mt-2 uppercase tracking-wider">Connecting to orbital databanks...</p>
          </div>
        ) : (
          <EarthGlobe />
        )}
        
        <SatelliteDetailPanel />
        
        {init && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel rounded-full border border-outline-variant/30 p-2 flex items-center gap-4 px-6 opacity-80 hover:opacity-100 transition-opacity">
            <button 
              onClick={() => togglePlaying()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-highest hover:bg-surface-bright text-on-surface border border-outline-variant/50 transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="font-mono text-sm text-primary flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Live Time</span>
              {currentTime.toISOString().split('T')[1].split('.')[0]} UTC
            </div>
            
            <div className="h-6 w-px bg-outline-variant/50 mx-2"></div>
            
            <button 
              onClick={() => toggleLabels()}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${showLabels ? 'bg-primary text-surface-container-lowest' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
            >
              Labels
            </button>

            <button 
              onClick={() => toggleOrbitPaths()}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${showOrbitPaths ? 'bg-primary text-surface-container-lowest' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
            >
              Orbit Path
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
