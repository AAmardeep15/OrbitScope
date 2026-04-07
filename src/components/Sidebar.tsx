'use client';

import { useState } from 'react';
import { useSatelliteStore } from '@/lib/satellite-store';

export default function Sidebar() {
  const { filters, setFilters, isLoading, satellites } = useSatelliteStore();
  const filteredCount = useSatelliteStore((state) => state.getFilteredSatellites().length);

  return (
    <div className="w-96 h-full glass-panel border-r ghost-border p-8 flex flex-col text-on-surface z-10 overflow-y-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold primary-gradient-text flex items-center gap-4 uppercase tracking-widest leading-none">
          <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(143,245,255,0.6)] mix-blend-screen">🛰️</span>
          Orbit<br/>Scope
        </h1>
        <p className="text-on-surface-variant mt-4 font-mono uppercase tracking-wider text-xs">Track Every Object Above Earth</p>
      </div>

      <div className="space-y-8 flex-1">
        <div>
          <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-3 font-display">Search</label>
          <input
            type="text"
            placeholder="SEARCH BY NAME OR ID..."
            className="w-full bg-surface-container-lowest ghost-border rounded px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/20 focus:shadow-[0_0_15px_var(--color-primary-dim)] transition-all placeholder:text-outline-variant text-on-surface flicker-transition"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
          />
        </div>

        <div>
           <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-3 font-display">Orbit Type</label>
           <select 
             className="w-full bg-surface-container-lowest ghost-border rounded px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/20 focus:shadow-[0_0_15px_var(--color-primary-dim)] transition-all text-on-surface"
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
           <label className="text-[10px] text-primary uppercase tracking-widest font-semibold block mb-3 font-display">Country / Owner</label>
           <select 
             className="w-full bg-surface-container-lowest ghost-border rounded px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/20 focus:shadow-[0_0_15px_var(--color-primary-dim)] transition-all text-on-surface"
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

        <div className="pt-8 border-t border-outline-variant/15 mt-8">
           <div className="flex justify-between text-sm items-center hover:bg-surface-container-low p-2 -mx-2 rounded transition-colors flicker-transition">
             <span className="text-on-surface-variant uppercase tracking-wider text-[10px]">Total Tracked:</span>
             <span className="font-mono text-primary text-lg font-bold">{satellites.length.toLocaleString()}</span>
           </div>
           <div className="flex justify-between text-sm items-center hover:bg-surface-container-low p-2 -mx-2 rounded transition-colors mt-2 flicker-transition">
             <span className="text-on-surface-variant uppercase tracking-wider text-[10px]">Showing:</span>
             <span className="font-mono text-primary-dim text-lg">{filteredCount.toLocaleString()}</span>
           </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-outline-variant/15 text-[10px] font-mono text-on-surface-variant text-center tracking-widest uppercase opacity-60">
        Data provided by CelesTrak
      </div>
    </div>
  );
}
