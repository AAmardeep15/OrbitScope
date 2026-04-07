import { create } from 'zustand';
import { SatelliteInfo, FilterState, OrbitType } from './types';
import { propagateSatellite } from './satellite-utils';

interface SatelliteStore {
  // Data
  satellites: SatelliteInfo[];
  selectedSatellite: SatelliteInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Filters
  filters: FilterState;

  // Time
  currentTime: Date;
  playbackSpeed: number;
  isPlaying: boolean;

  // View
  viewMode: '3d' | '2d';
  showOrbitPaths: boolean;
  showLabels: boolean;

  // Actions
  setSatellites: (satellites: SatelliteInfo[]) => void;
  selectSatellite: (satellite: SatelliteInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setCurrentTime: (time: Date) => void;
  setPlaybackSpeed: (speed: number) => void;
  togglePlaying: () => void;
  setViewMode: (mode: '3d' | '2d') => void;
  toggleOrbitPaths: () => void;
  toggleLabels: () => void;
  updatePositions: () => void;
  getFilteredSatellites: () => SatelliteInfo[];
}

const defaultFilters: FilterState = {
  searchQuery: '',
  orbitType: 'All',
  country: 'All',
  activeOnly: false,
};

export const useSatelliteStore = create<SatelliteStore>((set, get) => ({
  // Initial state
  satellites: [],
  selectedSatellite: null,
  isLoading: true,
  error: null,
  lastUpdate: null,

  filters: { ...defaultFilters },

  currentTime: new Date(),
  playbackSpeed: 1,
  isPlaying: true,

  viewMode: '3d',
  showOrbitPaths: true,
  showLabels: false,

  // Actions
  setSatellites: (satellites) =>
    set({ satellites, lastUpdate: new Date(), isLoading: false }),

  selectSatellite: (satellite) => set({ selectedSatellite: satellite }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setViewMode: (viewMode) => set({ viewMode }),

  toggleOrbitPaths: () =>
    set((state) => ({ showOrbitPaths: !state.showOrbitPaths })),

  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  updatePositions: () => {
    const { satellites, currentTime } = get();
    const updated = satellites.map((sat) => {
      const position = propagateSatellite(sat.tle, currentTime);
      return position ? { ...sat, position } : sat;
    });
    set({ satellites: updated });
  },

  getFilteredSatellites: () => {
    const { satellites, filters } = get();
    return satellites.filter((sat) => {
      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = sat.name.toLowerCase().includes(q);
        const matchesId = sat.id.includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Orbit type
      if (filters.orbitType !== 'All' && sat.orbitType !== filters.orbitType) {
        return false;
      }

      // Country
      if (filters.country !== 'All' && sat.country !== filters.country) {
        return false;
      }

      // Active only
      if (filters.activeOnly && !sat.active) {
        return false;
      }

      // Launch year
      if (filters.launchYearFrom && sat.launchDate) {
        const year = parseInt(sat.launchDate);
        if (year < filters.launchYearFrom) return false;
      }
      if (filters.launchYearTo && sat.launchDate) {
        const year = parseInt(sat.launchDate);
        if (year > filters.launchYearTo) return false;
      }

      return true;
    });
  },
}));
