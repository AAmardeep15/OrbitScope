'use client';

import { useSatelliteStore } from '@/lib/satellite-store';

export default function SatelliteDetailPanel() {
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);

  if (!selectedSatellite) return null;

  return (
    <div className="absolute top-6 right-6 w-96 max-h-[calc(100vh-3rem)] overflow-y-auto bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-6 text-slate-200 z-10 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{selectedSatellite.name}</h2>
          <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 text-xs border border-slate-700">NORAD: {selectedSatellite.id}</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 text-xs border border-slate-700">{selectedSatellite.orbitType}</span>
          </div>
        </div>
        <button 
          onClick={() => selectSatellite(null)}
          className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center border border-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox label="Country" value={selectedSatellite.country} icon="🌍" />
        <StatBox label="Launch Year" value={selectedSatellite.launchDate || 'Unknown'} icon="🚀" />
        <StatBox label="Apogee" value={`${Math.round(selectedSatellite.apogee)} km`} icon="⬆️" />
        <StatBox label="Perigee" value={`${Math.round(selectedSatellite.perigee)} km`} icon="⬇️" />
        <StatBox label="Inclination" value={`${selectedSatellite.inclination.toFixed(2)}°`} icon="📐" />
        <StatBox label="Period" value={`${selectedSatellite.period.toFixed(1)} min`} icon="⏱️" />
      </div>

      {selectedSatellite.position && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Telemetry</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Altitude</span>
              <span className="text-white">{selectedSatellite.position.altitude.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Speed</span>
              <span className="text-emerald-400">{selectedSatellite.position.velocity.toFixed(2)} km/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Latitude</span>
              <span className="text-white">{selectedSatellite.position.latitude.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Longitude</span>
              <span className="text-white">{selectedSatellite.position.longitude.toFixed(4)}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col">
      <span className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-slate-200 truncate" title={value}>{value}</span>
    </div>
  );
}
