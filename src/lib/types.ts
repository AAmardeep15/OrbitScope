// Core satellite types for OrbitScope

export interface TLERecord {
  name: string;
  line1: string;
  line2: string;
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
  x: number; // ECI position
  y: number;
  z: number;
}

export interface SatelliteInfo {
  id: string; // NORAD ID
  name: string;
  tle: TLERecord;
  position?: SatellitePosition;
  orbitType: OrbitType;
  country: string;
  launchDate?: string;
  operator?: string;
  purpose?: string;
  inclination: number;
  period: number; // minutes
  apogee: number; // km
  perigee: number; // km
  eccentricity: number;
  active: boolean;
}

export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'SSO' | 'Unknown';

export interface OrbitPoint {
  lat: number;
  lng: number;
  alt: number;
  time: Date;
  x: number;
  y: number;
  z: number;
}

export interface FilterState {
  searchQuery: string;
  orbitType: OrbitType | 'All';
  country: string;
  activeOnly: boolean;
  launchYearFrom?: number;
  launchYearTo?: number;
}

export interface TimeState {
  currentTime: Date;
  playbackSpeed: number;
  isPlaying: boolean;
  isPaused: boolean;
}

export interface CountryStats {
  country: string;
  count: number;
  color: string;
}

export interface OrbitStats {
  type: OrbitType;
  count: number;
}

// Globe coordinate helpers
export interface GlobeCoord {
  phi: number;   // latitude in radians
  theta: number; // longitude in radians
  radius: number;
}
