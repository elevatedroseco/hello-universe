

# Fix: Game Crash on Spawn / Invisible Units with TS Client 7.06

## Problem Summary

Three critical bugs in the export pipeline cause the game to crash or show no custom units when using TS Client 7.06.

---

## Bug 1: MIX File Format is Wrong (Crash on Spawn)

**File:** `src/lib/mixBuilder.ts`

The current MIX builder uses the **C&C1/Red Alert 1 format** (no flags prefix). Tiberian Sun uses an **updated format** that starts with a 4-byte flags field.

**Current (broken):**
```text
[2 bytes] file count
[4 bytes] data size
[index...]
[data...]
```

**Required for TS:**
```text
[4 bytes] flags (0x00000000 = no encryption, no checksum)
[2 bytes] file count
[4 bytes] data size
[index...]
[data...]
```

The game reads the first 2 bytes and sees a non-zero value (the file count), which tells it to interpret the archive as old-format. The rest of the data is then completely misaligned, causing a crash when it tries to load sprites.

**Fix:** Add a 4-byte `0x00000000` prefix to the MIX output. Change `headerSize` from 6 to 10.

---

## Bug 2: Wrong Hash Algorithm (Files Not Found in MIX)

**File:** `src/lib/mixBuilder.ts`

The current `mixHash()` function uses a "rotate-left-1 + add" algorithm. This is the hash from **C&C1/Red Alert 1**. Tiberian Sun switched to **CRC32** for filename lookups (per ModdingWiki: "It was replaced with the less collision-prone CRC32 in Tiberian Sun and later games").

When the game looks up `ZOMBIE.SHP` inside ecache99.mix, it computes a CRC32 hash and searches the index. Since the index was built with the wrong hash, no match is found, and the sprite is missing.

**Fix:** Replace `mixHash()` with a standard CRC32 implementation (polynomial `0xEDB88320`). This can be done inline with a lookup table (~50 lines, no new dependency).

---

## Bug 3: File Placement Mismatches TS Client 7.06 Folder Structure (Units Not Registered)

**File:** `src/hooks/useGameExport.ts`

The user's skeleton has this structure (visible in their screenshot):
```text
Tiberian Sun Client/
  INI/           <-- rules.ini and art.ini live HERE
  MIX/           <-- game MIX archives
  game.exe
```

The export code:
1. Finds `rules.ini` via regex (matches `INI/rules.ini`)
2. Reads and merges custom units into it
3. Writes the result to `${gameRoot}rules.ini` (the ROOT)

This creates TWO copies: the **unmodified** original at `INI/rules.ini` and the **merged** version at root `rules.ini`. TS Client reads from the `INI/` folder, so it never sees the custom unit registrations.

**Fix:** Write the modified INI files back to their **original paths** within the ZIP (the same path the regex matched), not to the root.

---

## Changes Required

### 1. `src/lib/mixBuilder.ts`
- Add CRC32 lookup table and replace `mixHash()` with CRC32 implementation
- Add 4-byte flags prefix (`0x00000000`) before the file count in `buildEcacheMix()`
- Update header size from 6 to 10
- Update all offset calculations accordingly

### 2. `src/hooks/useGameExport.ts`
- Store the matched file paths from the regex search (e.g., `INI/rules.ini`, `INI/art.ini`)
- Write modified INI files back to their original paths instead of `${gameRoot}rules.ini`
- Add debug log entries for file placement decisions

### 3. `src/lib/__tests__/mixBuilder.test.ts`
- Update expected byte offsets: header is now 10 bytes (was 6)
- Update total size calculations
- Add a test verifying the 4-byte flags prefix is `0x00000000`
- Add a test verifying CRC32 hash output for known filenames

### 4. `src/lib/__tests__/exportPipeline.test.ts`
- Update MIX size expectations from `6 + ...` to `10 + ...`
- Keep all other assertions unchanged

---

## Technical Details: CRC32 Implementation

A self-contained CRC32 function using the standard polynomial, no external dependency needed:

```text
1. Pre-compute a 256-entry lookup table from polynomial 0xEDB88320
2. For each character in the uppercase filename:
   - XOR the low byte of the running CRC with the character
   - Look up the result in the table
   - XOR with the CRC shifted right by 8
3. Final XOR with 0xFFFFFFFF
4. Return as unsigned 32-bit integer
```

---

## Why This Fixes "Crash on Spawn" and "No Units Shown"

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Game crashes on spawn | MIX header missing 4-byte flags; game misreads entire archive | Add flags prefix |
| Sprites/icons blank | Wrong hash in MIX index; game can't find files | Switch to CRC32 |
| Units not in build menu | Modified rules.ini written to wrong path; game reads unmodified copy from INI/ folder | Write back to original path |

