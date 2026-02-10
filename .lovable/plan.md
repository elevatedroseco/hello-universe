

# Complete Tiberian Sun Mod Pipeline

## Overview

This is a major architectural upgrade to the export system. The key change: **SHP files cannot be loose in the game root** -- they must be packaged into an `ecache99.mix` binary file. The current system places SHPs as loose files, which means custom unit sprites never load in-game.

## What Changes

### 1. New file: `src/lib/mixBuilder.ts` -- MIX File Builder

A pure JavaScript implementation of the Tiberian Sun MIX binary format. This takes an array of `{ name, data }` file entries and produces a valid `ecache99.mix` that the game engine can read.

- Header: 2 bytes (file count) + 4 bytes (total data size)
- Index: 12 bytes per file (CRC32 hash of filename, offset, size), sorted by CRC
- Data: concatenated raw file bytes
- Uses the TS-specific rotate-left CRC hash for filename lookup

### 2. Rewrite export pipeline in `src/hooks/useGameExport.ts`

**Current behavior (broken):** Downloads SHPs and places them as loose files in the ZIP root alongside `rules.ini`.

**New behavior (correct):**
- Read `rules.ini` and `art.ini` from the skeleton ZIP root (not from a subdirectory -- the skeleton should have them at root level)
- Parse, inject custom unit definitions, and write back merged INI files to the ZIP root
- Download all SHP files (sprites + icons) from Supabase storage
- Package ALL SHPs into a single `ecache99.mix` using the new MIX builder
- Add `ecache99.mix` to the ZIP root (no loose SHPs)
- Update the README to reflect the correct installation instructions (mentioning `ecache99.mix`)

**Progress steps updated:**
- 5-15%: Fetch skeleton from R2
- 25-30%: Unpack and read INI files
- 35%: Fetch custom units from Supabase
- 40-50%: Parse and inject rules.ini + art.ini
- 55-80%: Download SHP files from storage
- 80-85%: Build ecache99.mix
- 88%: Generate README
- 90-100%: Compress and trigger download

### 3. Update `src/lib/iniParser.ts` -- INI file placement

Currently the export uses prefix detection (`iniPrefix`, `rootPrefix`) that looks for an `INI/` subdirectory. The new approach simplifies this:
- `rules.ini` and `art.ini` are expected at the ZIP root (or detected via regex as currently done)
- The merged INI files are written back to the **root** of the ZIP (not inside a subdirectory), because the game engine reads root INI files with highest priority
- Remove the `rootPrefix` SHP file placement logic since SHPs no longer go loose in the ZIP

### 4. Update `src/components/ExportSection.tsx` -- README text

Update the installation guide to mention `ecache99.mix` instead of loose SHP files. Update the verification section and troubleshooting accordingly.

### 5. No changes needed to:
- `src/types/units.ts` -- already correct
- `src/data/tsWeapons.ts` -- already correct
- `src/pages/AdminForge.tsx` -- already correct (mint logic saves SHPs to Supabase storage)
- `src/components/admin/*` -- Unit Forge tabs are unaffected

## Technical Details

### MIX File Binary Format

```text
Offset  Size  Description
0       2     File count (uint16 LE)
2       4     Total data size (uint32 LE)
6       12*N  Index entries, sorted by CRC:
              - 4 bytes: CRC32 of filename (uint32 LE)
              - 4 bytes: Offset from data start (uint32 LE)
              - 4 bytes: File size (uint32 LE)
6+12*N  ...   Concatenated file data
```

### CRC Hash Function (TS-specific)

The engine uses a rotate-left-1 + add hash, not standard CRC32:
```text
for each char in UPPERCASE filename:
  id = rotateLeft(id, 1) + charCode
```

### Final ZIP Structure

```text
MyMod.zip
  rules.ini        -- merged (original + custom units)
  art.ini           -- merged (original + custom art)
  ecache99.mix      -- contains all custom SHP files
  tibsun.mix        -- original (untouched)
  patch.mix         -- original (untouched)
  Game.exe          -- original
  MOD_README.txt    -- updated install guide
```

### Edge Cases Handled

- If no SHP files are available for download, skip ecache99.mix generation
- Filename truncation to 8.3 format for SHP names inside the MIX
- Icon names use the `[NAME]ICON` convention truncated to 8 chars + `.SHP`
- Graceful fallback if Supabase storage download fails for individual files (warn, continue with remaining)

