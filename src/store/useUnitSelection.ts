import { create } from 'zustand';
import { Faction, UnitCategory } from '@/types/units';

interface UnitSelectionState {
  // Selected custom unit IDs for export
  selectedUnitIds: Set<string>;
  
  // UI State
  activeFaction: Faction;
  activeCategory: UnitCategory;
  isDrawerOpen: boolean;
  
  // Export state
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string;
  
  // Actions
  toggleSelection: (unitId: string) => void;
  selectUnit: (unitId: string) => void;
  deselectUnit: (unitId: string) => void;
  clearSelection: () => void;
  selectAll: (unitIds: string[]) => void;
  
  // UI Actions
  setActiveFaction: (faction: Faction) => void;
  setActiveCategory: (category: UnitCategory) => void;
  setDrawerOpen: (open: boolean) => void;
  
  // Export Actions
  setExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number, message: string) => void;
  resetExport: () => void;
}

export const useUnitSelection = create<UnitSelectionState>((set) => ({
  selectedUnitIds: new Set(),
  activeFaction: 'GDI',
  activeCategory: 'Infantry',
  isDrawerOpen: false,
  isExporting: false,
  exportProgress: 0,
  exportMessage: '',

  toggleSelection: (unitId) =>
    set((state) => {
      const newSet = new Set(state.selectedUnitIds);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
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

  selectAll: (unitIds) =>
    set({ selectedUnitIds: new Set(unitIds) }),

  setActiveFaction: (faction) => set({ activeFaction: faction }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  setExporting: (isExporting) => set({ isExporting }),
  setExportProgress: (progress, message) =>
    set({ exportProgress: progress, exportMessage: message }),
  resetExport: () =>
    set({ isExporting: false, exportProgress: 0, exportMessage: '' }),
}));
