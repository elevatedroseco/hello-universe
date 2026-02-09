

# Definitive Tiberian Sun Export System - Complete Rewrite

## Analysis Summary

Your research is **100% correct**. The current implementation has a fundamental flaw:

| Current Approach | Reality |
|-----------------|---------|
| Creates `rules_custom.ini` | ❌ Tiberian Sun does NOT load `rules_custom.ini` |
| Expects automatic merging | ❌ No wildcard INI loading exists in the engine |
| Original `rules.ini` untouched | ❌ Game loads original, ignores custom file |

### Confirmed Tiberian Sun INI Loading Order:
```text
1. rules.ini in GAME FOLDER (if exists, overrides everything)
2. rules.ini in patch.mix
3. rules.ini in expandXX.mix
4. rules.ini in tibsun.mix → local.mix
```

There is **no support** for `rules_custom.ini`, `rules*.ini` wildcards, or any auto-merge behavior.

---

## Correct Approach

Parse the **original rules.ini** from the skeleton ZIP, inject custom units into the existing type lists, and regenerate a **complete rules.ini** containing both original + custom content.

---

## Implementation Plan

### Part 1: Create INI Parser Utility

**New file: `src/lib/iniParser.ts`**

A lightweight INI parser/serializer for Tiberian Sun format:

| Function | Purpose |
|----------|---------|
| `parse(text)` | Convert INI text → JS object, preserving sections |
| `stringify(data)` | Convert JS object → INI text |
| `getNextIndex(section)` | Find highest numeric index in a type list |
| `injectUnits(rulesData, units)` | Add units to InfantryTypes/VehicleTypes/etc |
| `addUnitDefinitions(rulesData, units)` | Create [UNITNAME] sections |
| `addArtDefinitions(artData, units)` | Create art entries |

### Part 2: Update Export Logic

**Modified file: `src/hooks/useGameExport.ts`**

New workflow:

```text
1. Download skeleton ZIP from R2
2. Extract rules.ini and art.ini as TEXT
3. Parse into structured objects
4. Inject custom units into type lists (find highest index, append)
5. Add unit definition sections
6. Regenerate complete INI files
7. Replace rules.ini and art.ini in ZIP (complete files)
8. Add .SHP files to root
9. Add installation guide
10. Compress and download
```

### Part 3: SHP File Placement

**Already correct!** The current code places SHP files at the ZIP root:
```typescript
zip.file(`${shpName}.SHP`, data);  // No path = root folder
```

This is the proper location for loose files. The game will load SHP files from:
- Game folder root (✅ what we do)
- ecacheXX.mix archives

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/lib/iniParser.ts` | CREATE | INI parser with TS-specific methods |
| `src/hooks/useGameExport.ts` | MODIFY | Complete rewrite of export logic |

---

## Technical Details

### INI Parser Implementation

```typescript
// Key features:
- Preserve section order from original file
- Handle numeric indices in type lists (0=E1, 1=E2, etc.)
- Find next available index (e.g., 47) and append custom units
- Generate valid INI format output
- Handle comments (lines starting with ;)
```

### Export Flow

```text
Step 1-3: Download and parse
├── Fetch skeleton (~200MB) from R2
├── Extract rules.ini (~500KB of text)
└── Parse into { InfantryTypes: {0: 'E1', 1: 'E2'...}, E1: {...}, ... }

Step 4-5: Inject custom units
├── Find last index in InfantryTypes (e.g., 46)
├── Add: 47=MYUNIT, 48=MYUNIT2, etc.
└── Add [MYUNIT] section with all properties

Step 6-7: Regenerate
├── stringify() back to INI format
└── Replace rules.ini in ZIP (now ~510KB)

Step 8-10: Finalize
├── Add .SHP files to root
├── Add installation guide
└── Compress and download
```

### Generated rules.ini Structure

```ini
; === ORIGINAL GAME CONTENT (lines 1-15000) ===
[InfantryTypes]
0=E1
1=E2
...
46=INTRUDER
47=MYUNIT        ; <-- Custom unit appended here
48=ANOTHERUNIT   ; <-- More custom units

; === ORIGINAL UNIT DEFINITIONS ===
[E1]
Name=Light Infantry
...

; === CUSTOM UNIT DEFINITIONS (end of file) ===
[MYUNIT]
; Added by TibSun Mod Kit
Name=My Custom Unit
Cost=500
...
```

---

## Verification Checklist

After export, the ZIP should contain:

| File | Size | Contents |
|------|------|----------|
| `rules.ini` | ~500-700KB | Original + custom units merged |
| `art.ini` | ~300-400KB | Original + custom art merged |
| `*.SHP` | varies | Unit sprites in ROOT folder |
| `MOD_INSTALL.txt` | ~5KB | Installation guide |

To verify correct export:
1. Open `rules.ini` in text editor
2. Search for `[InfantryTypes]` - should contain E1, E2... AND your custom units
3. Search for your unit's internal name - should have a full `[UNITNAME]` section
4. File size should be ~500KB+ (not ~5KB like the broken custom-only approach)

---

## Dependencies

The `ini` npm package is not strictly required - a custom parser can handle Tiberian Sun's format. This avoids adding a new dependency.

