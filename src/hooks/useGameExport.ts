import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useUnitSelection } from '@/store/useUnitSelection';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { CustomUnit } from '@/types/units';
import { TiberianSunINIParser } from '@/lib/iniParser';
import { buildEcacheMix, MixFileEntry } from '@/lib/mixBuilder';

const SKELETON_URL = 'https://pub-2779116bf9b04734a8ce304c271ce31b.r2.dev/ts_base_skeleton.zip';

/**
 * Download a file from Supabase storage with bucket/path auto-detection and retry.
 */
async function downloadFromStorage(filePath: string): Promise<Blob | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const isPpmAsset = filePath.toLowerCase().startsWith('ppm/');
  const bucketName = isPpmAsset ? 'asset-previews' : 'user_assets';
  const cleanPath = filePath
    .replace(/^user_assets\//, '')
    .replace(/^asset-previews\//, '');

  let { data, error } = await supabase.storage.from(bucketName).download(cleanPath);

  // Retry with units/ prefix
  if (error && !cleanPath.startsWith('units/')) {
    const retry = await supabase.storage.from(bucketName).download(`units/${cleanPath}`);
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.warn(`⚠️ Storage download failed for ${filePath}:`, error);
    return null;
  }
  return data;
}

/**
 * Generate installation instructions
 */
function generateReadme(units: CustomUnit[]): string {
  return `==============================================================
  TIBERIAN SUN CUSTOM MOD — Installation Guide
==============================================================

Generated: ${new Date().toLocaleString()}
Custom Units: ${units.length}

WHAT'S INCLUDED:
  ✅ rules.ini  — MERGED (original game + ${units.length} custom units)
  ✅ art.ini    — MERGED (original game + custom unit art)
  ✅ ecache99.mix — Custom unit sprites & icons (SHP files)
  ✅ All original game content PRESERVED

INSTALLATION:
  1. Extract this ZIP into your Tiberian Sun folder
     (where Game.exe lives, e.g. C:\\Games\\TibSun\\)
  2. Overwrite when prompted — original content is preserved inside the files.
  3. Launch the game normally.

HOW IT WORKS:
  • rules.ini and art.ini in the root folder override the versions
    inside tibsun.mix / patch.mix (engine priority).
  • ecache99.mix is scanned automatically by the engine for SHP files.
  • No original MIX archives are modified.

CUSTOM UNITS:
${units.map((u, i) => `  ${i + 1}. ${u.displayName} (${u.internalName}) — ${u.faction} ${u.category}, $${u.cost}`).join('\n')}

VERIFICATION:
  1. rules.ini should be ~500–700 KB
  2. art.ini   should be ~300–400 KB
  3. ecache99.mix should exist in the root folder
  4. Start skirmish, build prerequisite, see custom units in sidebar.

REVERTING:
  Delete rules.ini, art.ini, and ecache99.mix from the root folder.
  The game falls back to originals inside its MIX archives.

MULTIPLAYER:
  ⚠️  All players need identical rules.ini + ecache99.mix.

Created with TibSun Mod Kit — https://tibsunmod.lovable.app
`;
}

export const useGameExport = (customUnits: CustomUnit[]) => {
  const {
    selectedUnitIds,
    setExporting,
    setExportProgress,
    resetExport
  } = useUnitSelection();

  const exportGame = useCallback(async () => {
    if (selectedUnitIds.size === 0) return;

    const selectedUnits = customUnits.filter(u => selectedUnitIds.has(u.id));
    if (selectedUnits.length === 0) return;

    try {
      setExporting(true);

      // ── A: Fetch skeleton ─────────────────────────────────
      setExportProgress(5, 'Connecting to R2...');
      const response = await fetch(SKELETON_URL, { mode: 'cors' });
      if (!response.ok) throw new Error(`Skeleton fetch failed: ${response.statusText}`);

      setExportProgress(15, 'Downloading base game (~200MB)...');
      const skeletonBlob = await response.blob();
      console.log(`📦 Skeleton: ${(skeletonBlob.size / 1024 / 1024).toFixed(1)} MB`);

      // ── B: Load ZIP ───────────────────────────────────────
      setExportProgress(25, 'Unpacking skeleton...');
      const zip = await JSZip.loadAsync(skeletonBlob);

      // ── C: Read INI files from root ───────────────────────
      setExportProgress(30, 'Reading game configuration...');

      const rulesMatches = zip.file(/rules\.ini$/i);
      const artMatches = zip.file(/art\.ini$/i);
      if (rulesMatches.length === 0) throw new Error('Skeleton missing rules.ini');
      if (artMatches.length === 0) throw new Error('Skeleton missing art.ini');

      const rulesFile = rulesMatches[0];
      const artFile = artMatches[0];

      // Determine path prefix (skeleton may have a wrapper directory)
      // Determine the game root prefix (where Game.exe lives)
      // rules.ini might be nested (e.g. ts_base_skeleton/INI/rules.ini)
      // but ecache99.mix and final INIs must go at the same level as Game.exe
      const rulesPath = rulesFile.name;
      const iniPrefix = rulesPath.substring(0, rulesPath.lastIndexOf('/') + 1);
      
      // Find the game root by looking for Game.exe or the top-level directory
      const gameExeMatch = zip.file(/Game\.exe$/i);
      let gameRoot = '';
      if (gameExeMatch.length > 0) {
        const exePath = gameExeMatch[0].name;
        gameRoot = exePath.substring(0, exePath.lastIndexOf('/') + 1);
      } else {
        // Fallback: use parent of INI prefix, or just the first directory
        gameRoot = iniPrefix.split('/').slice(0, -2).join('/');
        if (gameRoot) gameRoot += '/';
      }
      console.log(`📁 INI prefix: "${iniPrefix}", Game root: "${gameRoot || '(root)'}"`);

      const originalRules = await rulesFile.async('string');
      const originalArt = await artFile.async('string');
      console.log(`📄 rules.ini: ${(originalRules.length / 1024).toFixed(0)} KB, art.ini: ${(originalArt.length / 1024).toFixed(0)} KB`);

      // ── D: Parse + inject rules ───────────────────────────
      setExportProgress(40, 'Merging unit definitions...');
      const rulesData = TiberianSunINIParser.parse(originalRules);
      const withLists = TiberianSunINIParser.injectUnits(rulesData, selectedUnits);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(withLists, selectedUnits);
      const finalRules = TiberianSunINIParser.stringify(withDefs);

      // ── E: Parse + inject art ─────────────────────────────
      setExportProgress(50, 'Merging art definitions...');
      const artData = TiberianSunINIParser.parse(originalArt);
      const withArtDefs = TiberianSunINIParser.addArtDefinitions(artData, selectedUnits);
      const finalArt = TiberianSunINIParser.stringify(withArtDefs);

      // Write merged INI files at game root (where Game.exe lives)
      zip.file(`${gameRoot}rules.ini`, finalRules);
      zip.file(`${gameRoot}art.ini`, finalArt);
      console.log(`✅ Wrote merged rules.ini (${(finalRules.length / 1024).toFixed(0)} KB) and art.ini (${(finalArt.length / 1024).toFixed(0)} KB)`);

      // ── F: Download SHP files ─────────────────────────────
      setExportProgress(55, 'Downloading unit graphics...');
      const shpFiles: MixFileEntry[] = [];
      const perUnit = 25 / selectedUnits.length;
      let shpProgress = 55;

      for (const unit of selectedUnits) {
        setExportProgress(Math.floor(shpProgress), `Packaging ${unit.displayName}...`);

        // Main sprite
        if (unit.shpFilePath) {
          const blob = await downloadFromStorage(unit.shpFilePath);
          if (blob) {
            const name = unit.internalName.substring(0, 8).toUpperCase() + '.SHP';
            shpFiles.push({ name, data: await blob.arrayBuffer() });
            console.log(`✅ SHP: ${name}`);
          }
        }

        // Icon / cameo
        if (unit.icon_file_path) {
          const blob = await downloadFromStorage(unit.icon_file_path);
          if (blob) {
            const iconName = (unit.internalName.substring(0, 4) + 'ICON').toUpperCase() + '.SHP';
            shpFiles.push({ name: iconName, data: await blob.arrayBuffer() });
            console.log(`✅ Icon: ${iconName}`);
          }
        }

        shpProgress += perUnit;
      }

      // ── G: Build ecache99.mix at game root ────────────────
      if (shpFiles.length > 0) {
        setExportProgress(80, `Building ecache99.mix (${shpFiles.length} sprites)...`);
        const mixData = buildEcacheMix(shpFiles);
        zip.file(`${gameRoot}ecache99.mix`, mixData);
        console.log(`✅ ecache99.mix: ${(mixData.byteLength / 1024).toFixed(0)} KB, ${shpFiles.length} files`);
      }

      // ── H: README ─────────────────────────────────────────
      setExportProgress(88, 'Writing installation guide...');
      zip.file(`${gameRoot}MOD_README.txt`, generateReadme(selectedUnits));

      // ── I: Compress + download ────────────────────────────
      setExportProgress(90, 'Compressing final package...');
      const finalBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => setExportProgress(90 + Math.floor(meta.percent * 0.08), 'Compressing...')
      );

      setExportProgress(99, 'Starting download...');
      const date = new Date().toISOString().split('T')[0];
      saveAs(finalBlob, `TiberianSun_Mod_${date}.zip`);

      console.log('🎉 Export complete!');
      setExportProgress(100, 'Done!');
      setTimeout(() => resetExport(), 2000);

    } catch (error) {
      console.error('❌ Export failed:', error);
      setExportProgress(0, `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => resetExport(), 3000);
    }
  }, [customUnits, selectedUnitIds, setExporting, setExportProgress, resetExport]);

  return { exportGame };
};
