'use client';

import { useState } from 'react';
import { useSatelliteStore } from '@/lib/satellite-store';

export default function Sidebar() {
  const { filters, setFilters, isLoading, satellites } = useSatelliteStore();
  const filteredCount = useSatelliteStore((state) => state.getFilteredSatellites().length);

  return (
    <div className="w-80 h-full glass-panel border-r border-outline-variant/30 p-6 flex flex-col text-on-surface shadow-xl z-10 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold primary-gradient-text flex items-center gap-3 uppercase tracking-widest">
          <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(143,245,255,0.6)]">🛰️</span>
          OrbitScope
        </h1>
        <p className="text-on-surface-variant text-sm mt-2 font-mono uppercase tracking-wider text-xs">Track Every Object Above Earth</p>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-2 font-display">Search</label>
          <input
            type="text"
            placeholder="SEARCH BY NAME OR ID..."
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(143,245,255,0.15)] transition-all placeholder:text-outline-variant text-on-surface"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
          />
        </div>

        <div>
           <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-2 font-display">Orbit Type</label>
           <select 
             className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary transition-all text-on-surface"
             value={filters.orbitType}
             onChange={(e) => setFilters({ orbitType: e.target.value as any })}
           >
             <option value="All">All Orbits</option>
             <option value="LEO">Low Earth Orbit (LEO)</option>
             <option value="MEO">Medium Earth Orbit (MEO)</option>
             <option value="GEO">Geosynchronous (GEO)</option>
             <option value="HEO">High Earth Orbit (HEO)</option>
             <option value="SSO">Sun-Synchronous (SSO)</option>
           </select>
        </div>

        <div>
           <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-2 font-display">Country / Owner</label>
           <select 
             className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary transition-all text-on-surface"
             value={filters.country}
             onChange={(e) => setFilters({ country: e.target.value })}
           >
             <option value="All">All Countries</option>
             <option value="USA">United States</option>
             <option value="Russia">Russia</option>
             <option value="China">China</option>
             <option value="India">India</option>
             <option value="ESA">ESA</option>
             <option value="International">International</option>
           </select>
        </div>

        <div className="pt-6 border-t border-outline-variant/20 mt-8">
           <div className="flex justify-between text-sm items-center">
             <span className="text-on-surface-variant uppercase tracking-wider text-[10px]">Total Tracked:</span>
             <span className="font-mono text-primary text-lg">{satellites.length.toLocaleString()}</span>
           </div>
           <div className="flex justify-between text-sm items-center mt-2">
             <span className="text-on-surface-variant uppercase tracking-wider text-[10px]">Showing:</span>
             <span className="font-mono text-primary-dim text-lg">{filteredCount.toLocaleString()}</span>
           </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-outline-variant/20 text-[10px] font-mono text-on-surface-variant text-center tracking-widest uppercase">
        Data provided by CelesTrak
      </div>
    </div>
  );
}
