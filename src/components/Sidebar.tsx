'use client';

import { useState } from 'react';
import { useSatelliteStore } from '@/lib/satellite-store';

export default function Sidebar() {
  const { filters, setFilters, isLoading, satellites } = useSatelliteStore();
  const filteredCount = useSatelliteStore((state) => state.getFilteredSatellites().length);

  return (
    <div className="w-80 h-full bg-slate-900/80 backdrop-blur-md border-r border-slate-700 p-6 flex flex-col text-slate-200 shadow-xl overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
          <span className="text-4xl">🛰️</span>
          OrbitScope
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-mono">Track Every Object Above Earth</p>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name, ID..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
          />
        </div>

        <div>
           <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Orbit Type</label>
           <select 
             className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
           <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Country / Owner</label>
           <select 
             className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
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

        <div className="pt-4 border-t border-slate-800">
           <div className="flex justify-between text-sm items-center">
             <span className="text-slate-400">Total Tracked:</span>
             <span className="font-mono text-emerald-400">{satellites.length.toLocaleString()}</span>
           </div>
           <div className="flex justify-between text-sm items-center mt-2">
             <span className="text-slate-400">Showing:</span>
             <span className="font-mono text-blue-400">{filteredCount.toLocaleString()}</span>
           </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Data provided by CelesTrak
      </div>
    </div>
  );
}
