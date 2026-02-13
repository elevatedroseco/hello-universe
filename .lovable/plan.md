

# UI Revamp -- Phase 1 Quick Wins + Phase 2 Structural Improvements

This plan implements the 5 recommended first deliverables from the UX audit, organized into two batches of changes.

## Summary of Changes

1. **Shared SegmentedControl component** replacing FactionTabs and CategoryTabs
2. **Sticky app bar with status chips** + sticky export rail
3. **Search + sort controls** for unit browsing
4. **Tabbed Default/Custom workspace** with richer empty states
5. **Admin Forge split layout** and extracted RenameUnitDialog

---

## Deliverable 1: Shared SegmentedControl Component

Create `src/components/ui/segmented-control.tsx` -- a reusable component that both faction and category selectors will use.

**Props:**
- `items: Array<{ id: string; label: string; icon?: LucideIcon; color?: string }>`
- `value: string`
- `onChange: (id: string) => void`
- `size?: 'sm' | 'md'`

**Behavior:**
- Renders a pill-shaped container with clickable segments
- Active segment gets a filled background (supports custom faction colors via a `color` prop)
- Keyboard accessible with focus-visible ring
- Icon + label layout (icon only on mobile via responsive classes)

**Refactor FactionTabs and CategoryTabs:**
- Replace both with thin wrappers around SegmentedControl
- FactionTabs passes faction color classes; CategoryTabs passes Lucide icons
- Delete the duplicated button styling logic from both components

---

## Deliverable 2: Sticky Header + Sticky Export Rail

### Header changes (`src/components/Header.tsx`)
- Add `sticky top-0 z-40` positioning
- Add compact status chips:
  - Selected count (gold badge, already exists -- keep)
  - Active faction/category as small text chips
  - Backend connection indicator (green dot = connected, red dot = disconnected, based on `isSupabaseConfigured`)
- Add "Unit Forge" link button (links to `/admin`) and "Create Unit" CTA button (opens the drawer)
- Remove the FloatingActionButton component since the CTA moves to the header

### Export rail changes (`src/components/ExportSection.tsx`)
- Add `sticky bottom-0 z-40` positioning
- Condense into a single horizontal bar:
  - Left: selected count + "N units selected" text
  - Center: readiness checks as small icon badges (backend connected, units selected, SHPs present)
  - Right: export button with shorter label "Export Mod Package" instead of "DOWNLOAD MODDED GAME (~200MB)"
- Collapse to zero height when nothing is selected (slide-down animation on first selection)

### Remove FloatingActionButton
- Delete `src/components/FloatingActionButton.tsx`
- Remove from `Index.tsx` imports

---

## Deliverable 3: Search + Sort Controls

### Add to Zustand store (`src/store/useUnitSelection.ts`)
New state fields:
- `searchQuery: string` + `setSearchQuery`
- `sortBy: 'techLevel' | 'cost' | 'strength' | 'name'` + `setSortBy`

### Create FilterBar component (`src/components/FilterBar.tsx`)
Placed between the segmented controls row and the content area in Index.tsx.

**Contents:**
- Search input (magnifying glass icon, placeholder "Search units...", filters by `internalName` and `displayName`)
- Sort dropdown: Tech Level (default), Cost, Strength, Name
- Unit count label: "12 units" (updates with filters)

### Wire into UnitGrid
- `filteredDefaultUnits` and `filteredCustomUnits` memos apply search and sort from store
- Show "No results for [query]" empty state with clear button when search eliminates all

---

## Deliverable 4: Tabbed Default/Custom Workspace

### Replace stacked layout in UnitGrid with tabs
Currently the grid renders "DEFAULT UNITS" section then "CUSTOM UNITS" section stacked vertically. Change to:

- Use Shadcn `<Tabs>` with two tabs: **"Defaults"** and **"Custom (N)"**
- Custom tab shows count badge
- Each tab renders the same card grid
- The "Custom" tab empty state shows:
  - Sparkles icon
  - "Create your first custom unit"
  - CTA button that opens the drawer
  - If backend not connected: show connection instructions instead

### Reduce animation stagger
- Change `transition={{ delay: index * 0.05 }}` to `transition={{ delay: Math.min(index * 0.03, 0.3) }}` to cap max stagger at 300ms regardless of unit count

### UnitCard touch improvements
- Always show the gear (edit) button on mobile (detect via `useIsMobile` hook already in project)
- Add `aria-label` to checkbox, edit button, and card itself
- Add keyboard focus ring styling to the card

---

## Deliverable 5: Admin Forge Layout + Extracted RenameDialog

### Extract RenameUnitDialog (`src/components/admin/RenameUnitDialog.tsx`)
Move the rename overlay from AdminForge.tsx into its own component using Shadcn `<Dialog>`:
- Props: `unit: ForgeUnit | null`, `open: boolean`, `onOpenChange`, `onRenamed`
- Uses the existing `renameUnit()` from `src/lib/renameUnit.ts`
- Includes the live preview of file name changes
- Adds validation: warn if new name collides with `ORIGINAL_GAME_UNITS`

### Split layout for AdminForge (`src/pages/AdminForge.tsx`)
On desktop (>1024px), use a two-column layout:
- **Left column (320px fixed):** Minted units list with search input at top, scrollable list
- **Right column (flex-1):** The creation/edit tabs + INI preview + mint button

On mobile: stack vertically (list on top, collapsible; editor below).

Implementation uses CSS grid: `grid-cols-1 lg:grid-cols-[320px_1fr]`

### Validation hints before mutation
- In the mint button area, show inline warnings:
  - If `internalName` is empty: "Internal name required"
  - If `internalName` length > 8: "Max 8 characters for SHP compatibility"
  - If name matches `ORIGINAL_GAME_UNITS`: amber warning badge

---

## Files Modified

| File | Action |
|---|---|
| `src/components/ui/segmented-control.tsx` | New -- shared segmented control |
| `src/components/FactionTabs.tsx` | Rewrite to use SegmentedControl |
| `src/components/CategoryTabs.tsx` | Rewrite to use SegmentedControl |
| `src/components/Header.tsx` | Add sticky, status chips, nav link, CTA |
| `src/components/ExportSection.tsx` | Add sticky, condense, readiness checks |
| `src/components/FilterBar.tsx` | New -- search + sort + count |
| `src/components/UnitGrid.tsx` | Convert to tabbed layout, reduce stagger, a11y |
| `src/components/UnitCard.tsx` | Touch-friendly actions, ARIA labels, focus ring |
| `src/store/useUnitSelection.ts` | Add search/sort state |
| `src/pages/Index.tsx` | Add FilterBar, remove FAB, adjust layout |
| `src/components/FloatingActionButton.tsx` | Delete |
| `src/components/admin/RenameUnitDialog.tsx` | New -- extracted dialog |
| `src/pages/AdminForge.tsx` | Split layout, use RenameUnitDialog, validation hints |

## No dependency changes needed
All UI elements use existing Shadcn components, Framer Motion, Lucide icons, and Zustand.

