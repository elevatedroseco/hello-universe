

# Fix Export Functionality and Image Loading Issues

## Summary

Two issues need fixing: (1) the game export fails because the skeleton ZIP has files in a subdirectory, and (2) some unit images return 404 from Supabase storage due to case sensitivity or missing files.

---

## Issue 1: Export Failure - "Skeleton is missing rules.ini"

The skeleton ZIP file downloaded from R2 stores all game files inside a `ts_base_skeleton/` subdirectory. The export code tries to find `rules.ini` and `art.ini` at the ZIP root, which fails.

**Fix in `src/hooks/useGameExport.ts`:**

- After loading the ZIP, detect the top-level folder prefix (e.g., `ts_base_skeleton/`) by scanning the ZIP entries
- Use the detected prefix when reading `rules.ini` and `art.ini`
- When writing back modified files and SHP files, place them inside the same prefix so the ZIP structure stays consistent
- Alternatively, strip the prefix and place everything at root level (simpler approach, since the user extracts to their game folder anyway)

The simpler approach: after loading the ZIP, find `rules.ini` wherever it is (search all paths), and when writing back, write to the same path. Also write SHP files to the same directory level as `rules.ini`.

---

## Issue 2: Some Unit Images Return 404

Several images fail to load from Supabase Storage:
- `ppm/e1.png`, `ppm/dvader.png`, `ppm/sniper.png` -- these files may not exist in the `asset-previews` bucket
- `user_assets/CLOUDTEST.png` -- case sensitivity issue (file may be stored as `cloudtest.png`)

**Fix in `src/components/UnitCard.tsx`:**

- Try lowercase versions of filenames as additional fallbacks
- The `useImageLoader` hook already supports primary + fallback URLs, but only tries two. We could extend it or adjust the URL generation logic to normalize to lowercase

**Note:** Some images genuinely don't exist in storage -- for those, the existing 2-letter abbreviation fallback already works well. This is a data issue, not a code bug.

---

## Technical Plan

### File: `src/hooks/useGameExport.ts`

1. After loading the ZIP with `JSZip.loadAsync()`, scan entries to find the path to `rules.ini`:
   - Use `zip.file(/rules\.ini$/i)` to search for the file regardless of directory depth
   - Extract the prefix from its path (e.g., `ts_base_skeleton/`)
2. Use the discovered prefix for reading `art.ini` as well
3. When writing back modified `rules.ini`, `art.ini`, and `.SHP` files, write them using the same prefix
4. Add error logging to show what paths are available in the ZIP if lookup fails (for debugging)

### File: `src/components/UnitCard.tsx`

1. In `getPreviewImageUrls()`, ensure all path components are lowercased consistently
2. For user uploads, try both the original case and lowercase as fallback

### File: `src/hooks/useImageLoader.ts`

No changes needed -- the existing primary/fallback mechanism handles the image loading correctly.

---

## What Won't Change

- Checkbox behavior (already fixed and verified working)
- Unit selection store logic (working correctly)
- Export section UI (counter and button work properly)
- INI parser logic (works fine once it receives the file content)

