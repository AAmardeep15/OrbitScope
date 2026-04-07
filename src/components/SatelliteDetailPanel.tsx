'use client';

import { useSatelliteStore } from '@/lib/satellite-store';

export default function SatelliteDetailPanel() {
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);

  if (!selectedSatellite) return null;

  return (
    <div className="absolute top-8 right-8 w-96 max-h-[calc(100vh-4rem)] overflow-y-auto glass-panel rounded-2xl ghost-border ambient-shadow p-8 text-on-surface z-10 transition-all opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex justify-between items-start mb-8 border-b-0">
        <div className="pr-4">
          <h2 className="text-4xl font-display font-bold text-on-surface mb-3 uppercase tracking-wide leading-none">{selectedSatellite.name}</h2>
          <div className="flex items-center gap-3 text-sm font-mono text-on-surface-variant flex-wrap mt-2">
            <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-[10px] tracking-widest font-bold uppercase flicker-transition hover:bg-secondary-dim hover:text-on-surface">NORAD: {selectedSatellite.id}</span>
            <span className="bg-primary/5 text-primary px-4 py-1.5 rounded-full text-[10px] tracking-widest font-bold uppercase ghost-border flicker-transition hover:bg-primary/20">{selectedSatellite.orbitType}</span>
          </div>
        </div>
        <button 
          onClick={() => selectSatellite(null)}
          className="text-on-surface-variant hover:text-primary bg-surface-container hover:bg-surface-bright rounded text-lg w-10 h-10 flex items-center justify-center ghost-border transition-all hover:shadow-[0_0_15px_var(--color-primary-dim)]"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6 mb-8">
        <StatRow label="Country / Owner" value={selectedSatellite.country} icon="🌍" />
        <StatRow label="Launch Year" value={selectedSatellite.launchDate || 'Unknown'} icon="🚀" />
        <StatRow label="Apogee" value={`${Math.round(selectedSatellite.apogee).toLocaleString()} km`} icon="⬆" />
        <StatRow label="Perigee" value={`${Math.round(selectedSatellite.perigee).toLocaleString()} km`} icon="⬇" />
        <StatRow label="Inclination" value={`${selectedSatellite.inclination.toFixed(2)}°`} icon="📐" />
        <StatRow label="Orbital Period" value={`${selectedSatellite.period.toFixed(1)} min`} icon="⏱" />
      </div>

      {selectedSatellite.position && (
        <div className="bg-surface-container-lowest rounded-xl p-6 ghost-border relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-[64px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
          
          <h3 className="text-[10px] font-display font-semibold text-primary uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shadow-[0_0_10px_var(--color-primary)]"></span>
            Real-Time Telemetry
          </h3>
          
          <div className="space-y-5 font-mono text-sm relative z-10">
            <TelemetryRow label="Altitude" value={`${selectedSatellite.position.altitude.toFixed(2)} km`} highlight={false} />
            <TelemetryRow label="Velocity" value={`${selectedSatellite.position.velocity.toFixed(3)} km/s`} highlight={true} />
            <TelemetryRow label="Latitude" value={`${selectedSatellite.position.latitude.toFixed(4)}°`} highlight={false} />
            <TelemetryRow label="Longitude" value={`${selectedSatellite.position.longitude.toFixed(4)}°`} highlight={false} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="flex justify-between items-end p-2 -mx-2 hover:bg-surface-container-low rounded transition-colors group">
      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-display flex items-center gap-2">
        <span className="opacity-50 text-xs">{icon}</span> {label}
      </span>
      <span className="text-sm font-mono text-on-surface truncate group-hover:text-primary transition-colors" title={value}>{value}</span>
    </div>
  );
}

function TelemetryRow({ label, value, highlight }: { label: string, value: string, highlight: boolean }) {
  return (
    <div className="flex justify-between items-end">
      <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">{label}</span>
      <span className={`text-base flicker-transition ${highlight ? 'text-primary drop-shadow-[0_0_5px_rgba(143,245,255,0.4)] font-bold' : 'text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}
