'use client';

import { useSatelliteStore } from '@/lib/satellite-store';

export default function SatelliteDetailPanel() {
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);

  if (!selectedSatellite) return null;

  return (
    <div className="absolute top-6 right-6 w-[400px] max-h-[calc(100vh-3rem)] overflow-y-auto glass-panel rounded-xl border border-outline-variant/30 shadow-[0_0_40px_rgba(0,238,252,0.05)] p-6 text-on-surface z-10 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-on-surface mb-2 uppercase tracking-wide">{selectedSatellite.name}</h2>
          <div className="flex items-center gap-2 text-sm font-mono text-on-surface-variant flex-wrap">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] tracking-widest font-bold uppercase">NORAD: {selectedSatellite.id}</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] tracking-widest font-bold uppercase border border-primary/20">{selectedSatellite.orbitType}</span>
          </div>
        </div>
        <button 
          onClick={() => selectSatellite(null)}
          className="text-on-surface-variant hover:text-primary transition-colors bg-surface-container-highest hover:bg-surface-bright rounded text-lg w-8 h-8 flex items-center justify-center border border-outline-variant/30"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatBox label="Country" value={selectedSatellite.country} icon="🌍" />
        <StatBox label="Launch Year" value={selectedSatellite.launchDate || 'Unknown'} icon="🚀" />
        <StatBox label="Apogee" value={`${Math.round(selectedSatellite.apogee)} km`} icon="⬆️" />
        <StatBox label="Perigee" value={`${Math.round(selectedSatellite.perigee)} km`} icon="⬇️" />
        <StatBox label="Inclination" value={`${selectedSatellite.inclination.toFixed(2)}°`} icon="📐" />
        <StatBox label="Period" value={`${selectedSatellite.period.toFixed(1)} min`} icon="⏱️" />
      </div>

      {selectedSatellite.position && (
        <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
          <h3 className="text-[10px] font-display font-semibold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Live Telemetry
          </h3>
          <div className="space-y-4 font-mono text-sm relative z-10">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-1">
              <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Altitude</span>
              <span className="text-on-surface text-base">{selectedSatellite.position.altitude.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-1">
              <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Speed</span>
              <span className="text-primary text-base drop-shadow-[0_0_5px_rgba(143,245,255,0.4)]">{selectedSatellite.position.velocity.toFixed(2)} km/s</span>
            </div>
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-1">
              <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Latitude</span>
              <span className="text-on-surface text-base">{selectedSatellite.position.latitude.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-1">
              <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Longitude</span>
              <span className="text-on-surface text-base">{selectedSatellite.position.longitude.toFixed(4)}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-surface-container-high/50 p-4 rounded text-left border border-outline-variant/20 hover:border-primary/30 transition-colors">
      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-display mb-2 flex items-center gap-1.5">
        <span className="opacity-70">{icon}</span> {label}
      </span>
      <span className="text-sm font-mono text-on-surface truncate block" title={value}>{value}</span>
    </div>
  );
}
