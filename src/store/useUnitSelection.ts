import { create } from 'zustand';
import { Faction, UnitCategory } from '@/types/units';

export type SortBy = 'techLevel' | 'cost' | 'strength' | 'name';

interface UnitSelectionState {
  selectedUnitIds: Set<string>;
  activeFaction: Faction;
  activeCategory: UnitCategory;
  isDrawerOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string;
  searchQuery: string;
  sortBy: SortBy;

  toggleSelection: (unitId: string) => void;
  selectUnit: (unitId: string) => void;
  deselectUnit: (unitId: string) => void;
  clearSelection: () => void;
  selectAll: (unitIds: string[]) => void;
  setActiveFaction: (faction: Faction) => void;
  setActiveCategory: (category: UnitCategory) => void;
  setDrawerOpen: (open: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number, message: string) => void;
  resetExport: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortBy) => void;
}

export const useUnitSelection = create<UnitSelectionState>((set) => ({
  selectedUnitIds: new Set(),
  activeFaction: 'GDI',
  activeCategory: 'Infantry',
  isDrawerOpen: false,
  isExporting: false,
  exportProgress: 0,
  exportMessage: '',
  searchQuery: '',
  sortBy: 'techLevel',

  toggleSelection: (unitId) =>
    set((state) => {
      const newSet = new Set(state.selectedUnitIds);
      if (newSet.has(unitId)) newSet.delete(unitId);
      else newSet.add(unitId);
      return { selectedUnitIds: newSet };
    }),

  selectUnit: (unitId) =>
    set((state) => {
      const newSet = new Set(state.selectedUnitIds);
      newSet.add(unitId);
      return { selectedUnitIds: newSet };
    }),

  deselectUnit: (unitId) =>
    set((state) => {
      const newSet = new Set(state.selectedUnitIds);
      newSet.delete(unitId);
      return { selectedUnitIds: newSet };
    }),

  clearSelection: () => set({ selectedUnitIds: new Set() }),
  selectAll: (unitIds) => set({ selectedUnitIds: new Set(unitIds) }),
  setActiveFaction: (faction) => set({ activeFaction: faction }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  setExporting: (isExporting) => set({ isExporting }),
  setExportProgress: (progress, message) => set({ exportProgress: progress, exportMessage: message }),
  resetExport: () => set({ isExporting: false, exportProgress: 0, exportMessage: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
