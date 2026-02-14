import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useUnitSelection } from '@/store/useUnitSelection';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { CustomUnit } from '@/types/units';
import { TiberianSunINIParser } from '@/lib/iniParser';
import { buildEcacheMix, MixFileEntry } from '@/lib/mixBuilder';
import { ORIGINAL_GAME_UNITS } from '@/data/gameUnits';
import { getCachedSkeleton, cacheSkeleton } from '@/lib/skeletonCache';

const SKELETON_URL = 'https://pub-2779116bf9b04734a8ce304c271ce31b.r2.dev/ts_base_skeleton.zip';

export type ExportMode = 'standalone' | 'mod-only' | 'map-mod';

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
function generateReadme(units: CustomUnit[], mode: ExportMode): string {
  const shpUnits = units.filter(u => u.renderType !== 'VOXEL');
  const vxlUnits = units.filter(u => u.renderType === 'VOXEL');

  if (mode === 'map-mod') {
    return `; Map Mod INI Block — paste into FinalSun map editor
; Generated: ${new Date().toLocaleString()}
; Units: ${units.length}
`;
  }

  const modeLabel = mode === 'mod-only' ? 'MOD FILES ONLY' : 'STANDALONE GAME PACKAGE';

  return `==============================================================
  TIBERIAN SUN CUSTOM MOD — ${modeLabel}
==============================================================

Generated: ${new Date().toLocaleString()}
Custom Units: ${units.length} (${shpUnits.length} SHP, ${vxlUnits.length} Voxel)

${mode === 'mod-only' ? `WHAT'S INCLUDED:
  ✅ rules.ini  — Custom unit definitions (mod additions only)
  ✅ art.ini    — Custom unit art definitions
  ✅ ecache99.mix — Custom unit sprites & icons (SHP files)${vxlUnits.length > 0 ? '\n  ✅ expand99.mix — Voxel models (VXL/HVA files)' : ''}

INSTALLATION:
  1. Copy all files into your Tiberian Sun folder
     (where Game.exe lives, e.g. C:\\Games\\TibSun\\)
  2. If you already have rules.ini or art.ini in the root folder,
     you'll need to MERGE these additions manually.
  3. Launch the game normally.
` : `WHAT'S INCLUDED:
  ✅ rules.ini  — MERGED (original game + ${units.length} custom units)
  ✅ art.ini    — MERGED (original game + custom unit art)
  ✅ ecache99.mix — Custom unit sprites & icons (SHP files)${vxlUnits.length > 0 ? '\n  ✅ expand99.mix — Voxel models (VXL/HVA files)' : ''}
  ✅ All original game content PRESERVED

INSTALLATION:
  1. Extract this ZIP into your Tiberian Sun folder
     (where Game.exe lives, e.g. C:\\Games\\TibSun\\)
  2. Overwrite when prompted — original content is preserved inside the files.
  3. Launch the game normally.
`}
CUSTOM UNITS:
${units.map((u, i) => `  ${i + 1}. ${u.displayName} (${u.internalName}) — ${u.faction} ${u.category}${u.renderType === 'VOXEL' ? ' [VOXEL]' : ''}, $${u.cost}`).join('\n')}

MULTIPLAYER:
  ⚠️  All players need identical rules.ini + ecache99.mix${vxlUnits.length > 0 ? ' + expand99.mix' : ''}.

Created with TibSun Mod Kit — https://tibsunmod.lovable.app
`;
}

/**
 * Generate map mod INI block for FinalSun injection
 */
function generateMapModBlock(units: CustomUnit[]): string {
  const byCategory = units.reduce((acc, u) => {
    if (!acc[u.category]) acc[u.category] = [];
    acc[u.category].push(u);
    return acc;
  }, {} as Record<string, CustomUnit[]>);

  const categoryToList: Record<string, string> = {
    Infantry: 'InfantryTypes',
    Vehicle: 'VehicleTypes',
    Aircraft: 'AircraftTypes',
    Structure: 'BuildingTypes',
  };

  let block = '; ===== TIBSUN MOD KIT — MAP MOD BLOCK =====\n';
  block += `; Generated: ${new Date().toLocaleString()}\n`;
  block += `; Units: ${units.length}\n\n`;

  // Type lists
  for (const [cat, catUnits] of Object.entries(byCategory)) {
    const listName = categoryToList[cat];
    if (!listName) continue;
    block += `; Add to [${listName}]:\n`;
    block += `; ${catUnits.map(u => u.internalName.toUpperCase()).join(',')}\n\n`;
  }

  // Unit definitions
  for (const unit of units) {
    const rules = (unit.rulesJson || {}) as Record<string, unknown>;
    const unitName = unit.internalName.toUpperCase();
    const owner = String(rules.Owner || 'GDI,Nod');
    const prerequisite = String(rules.Prerequisite || (unit.faction === 'GDI' ? 'GAPILE' : 'NAHAND'));

    block += `[${unitName}]\n`;
    block += `Name=${unit.displayName}\n`;
    block += `TechLevel=${rules.TechLevel || unit.techLevel}\n`;
    block += `Owner=${owner}\n`;
    block += `Prerequisite=${prerequisite}\n`;
    block += `Cost=${unit.cost}\n`;
    block += `Strength=${rules.Strength || unit.strength || 200}\n`;
    block += `Armor=${rules.Armor || 'light'}\n`;
    block += `Speed=${rules.Speed || unit.speed || 5}\n`;
    block += `Sight=${rules.Sight || 5}\n`;
    block += `Primary=${rules.Primary || 'M1Carbine'}\n`;
    block += '\n';
  }

  block += '; ===== END MAP MOD BLOCK =====\n';
  block += '; Note: Binary assets (SHP/VXL/HVA) must be in ecache99.mix/expand99.mix\n';
  return block;
}

/**
 * Download unit graphics and build MIX entries
 */
async function downloadUnitAssets(
  selectedUnits: CustomUnit[],
  setExportProgress: (p: number, m: string) => void,
  debugLog: string[],
): Promise<{ shpFiles: MixFileEntry[]; vxlFiles: MixFileEntry[] }> {
  const shpFiles: MixFileEntry[] = [];
  const vxlFiles: MixFileEntry[] = [];
  const perUnit = 25 / selectedUnits.length;
  let progress = 55;

  for (const unit of selectedUnits) {
    setExportProgress(Math.floor(progress), `Packaging ${unit.displayName}...`);
    const unitName = unit.internalName.toUpperCase();
    const isVoxel = unit.renderType === 'VOXEL';

    if (isVoxel) {
      if (unit.voxelFilePath) {
        const blob = await downloadFromStorage(unit.voxelFilePath);
        if (blob) {
          const name = unitName.substring(0, 8) + '.VXL';
          vxlFiles.push({ name, data: await blob.arrayBuffer() });
          debugLog.push(`Added ${name} (${blob.size} bytes)`);
        } else {
          debugLog.push(`FAILED to download VXL for ${unitName}`);
        }
      }
      if (unit.hvaFilePath) {
        const blob = await downloadFromStorage(unit.hvaFilePath);
        if (blob) {
          const name = unitName.substring(0, 8) + '.HVA';
          vxlFiles.push({ name, data: await blob.arrayBuffer() });
          debugLog.push(`Added ${name} (${blob.size} bytes)`);
        }
      }
      if (unit.turretVxlPath) {
        const blob = await downloadFromStorage(unit.turretVxlPath);
        if (blob) {
          const name = unitName.substring(0, 5) + 'TUR.VXL';
          vxlFiles.push({ name, data: await blob.arrayBuffer() });
          debugLog.push(`Added ${name} (${blob.size} bytes)`);
        }
      }
      if (unit.barrelVxlPath) {
        const blob = await downloadFromStorage(unit.barrelVxlPath);
        if (blob) {
          const name = unitName.substring(0, 4) + 'BARL.VXL';
          vxlFiles.push({ name, data: await blob.arrayBuffer() });
          debugLog.push(`Added ${name} (${blob.size} bytes)`);
        }
      }
    } else {
      if (unit.shpFilePath) {
        const blob = await downloadFromStorage(unit.shpFilePath);
        if (blob) {
          const spriteName = unitName + '.SHP';
          shpFiles.push({ name: spriteName, data: await blob.arrayBuffer() });
          debugLog.push(`Added ${spriteName} (${blob.size} bytes)`);
        } else {
          debugLog.push(`FAILED to download SHP for ${unitName}`);
        }
      }
    }

    if (unit.icon_file_path) {
      const blob = await downloadFromStorage(unit.icon_file_path);
      if (blob) {
        const iconName = unitName + 'ICON.SHP';
        shpFiles.push({ name: iconName, data: await blob.arrayBuffer() });
        debugLog.push(`Added ${iconName} (${blob.size} bytes)`);
      } else {
        debugLog.push(`FAILED to download icon for ${unitName}`);
      }
    }

    progress += perUnit;
  }

  return { shpFiles, vxlFiles };
}

/**
 * Generate mod-only rules/art INI (without merging into base game files)
 */
function generateModOnlyINI(selectedUnits: CustomUnit[]): { rules: string; art: string } {
  // Build a fresh rules.ini with only custom content
  const fakeBase = TiberianSunINIParser.parse('');
  const withLists = TiberianSunINIParser.injectUnits(fakeBase, selectedUnits);
  const withDefs = TiberianSunINIParser.addUnitDefinitions(withLists, selectedUnits);

  let rules = '; Tiberian Sun Mod Kit — Mod-only rules.ini additions\n';
  rules += `; Generated: ${new Date().toISOString()}\n`;
  rules += `; Units: ${selectedUnits.length}\n\n`;

  // Type lists
  const categoryToList: Record<string, string> = {
    Infantry: 'InfantryTypes', Vehicle: 'VehicleTypes',
    Aircraft: 'AircraftTypes', Structure: 'BuildingTypes',
  };
  const byCategory = selectedUnits.reduce((acc, u) => {
    if (!acc[u.category]) acc[u.category] = [];
    acc[u.category].push(u);
    return acc;
  }, {} as Record<string, CustomUnit[]>);

  for (const [cat, units] of Object.entries(byCategory)) {
    const listName = categoryToList[cat];
    if (!listName) continue;
    rules += `; Append to [${listName}]:\n`;
    units.forEach((u, i) => { rules += `XX${i}=${u.internalName.toUpperCase()}\n`; });
    rules += '\n';
  }

  // Unit definitions
  for (const unitName of Object.keys(withDefs.data)) {
    if (['InfantryTypes', 'VehicleTypes', 'AircraftTypes', 'BuildingTypes'].includes(unitName)) continue;
    const section = withDefs.data[unitName];
    rules += `[${unitName}]\n`;
    for (const [k, v] of Object.entries(section)) {
      rules += `${k}=${v}\n`;
    }
    rules += '\n';
  }

  // Art definitions
  const artResult = TiberianSunINIParser.parse('');
  const withArt = TiberianSunINIParser.addArtDefinitions(artResult, selectedUnits);

  let art = '; Tiberian Sun Mod Kit — Mod-only art.ini additions\n';
  art += `; Generated: ${new Date().toISOString()}\n\n`;

  for (const sectionName of Object.keys(withArt.data)) {
    const section = withArt.data[sectionName];
    art += `[${sectionName}]\n`;
    for (const [k, v] of Object.entries(section)) {
      art += `${k}=${v}\n`;
    }
    art += '\n';
  }

  return { rules, art };
}

export const useGameExport = (customUnits: CustomUnit[]) => {
  const {
    selectedUnitIds,
    setExporting,
    setExportProgress,
    resetExport
  } = useUnitSelection();

  const exportGame = useCallback(async (mode: ExportMode = 'standalone') => {
    if (selectedUnitIds.size === 0) return;

    const selectedUnits = customUnits.filter(u => selectedUnitIds.has(u.id));
    if (selectedUnits.length === 0) return;

    try {
      setExporting(true);
      const debugLog: string[] = [`Export started: ${new Date().toISOString()}`, `Mode: ${mode}`, `Units: ${selectedUnits.map(u => u.internalName.toUpperCase()).join(', ')}`];
      const conflicts = selectedUnits.filter(u =>
        ORIGINAL_GAME_UNITS.has(u.internalName.toUpperCase())
      );
      if (conflicts.length > 0) {
        throw new Error(
          `Name conflict with base game units: ${conflicts.map(u => u.internalName).join(', ')}. ` +
          `Rename these units in the Unit Forge before exporting.`
        );
      }

      // ── MAP-MOD MODE ──────────────────────────────────────
      if (mode === 'map-mod') {
        setExportProgress(50, 'Generating map mod block...');
        const block = generateMapModBlock(selectedUnits);
        const blob = new Blob([block], { type: 'text/plain' });
        const date = new Date().toISOString().split('T')[0];
        saveAs(blob, `TibSun_MapMod_${date}.txt`);
        setExportProgress(100, 'Done!');
        setTimeout(() => resetExport(), 2000);
        return;
      }

      // ── MOD-ONLY MODE ─────────────────────────────────────
      if (mode === 'mod-only') {
        setExportProgress(10, 'Generating mod files...');
        const { rules, art } = generateModOnlyINI(selectedUnits);
        debugLog.push('Generated mod-only rules.ini and art.ini');

        setExportProgress(40, 'Downloading unit graphics...');
        const { shpFiles, vxlFiles } = await downloadUnitAssets(selectedUnits, setExportProgress, debugLog);

        setExportProgress(75, 'Building package...');
        const zip = new JSZip();
        zip.file('rules.ini', rules);
        zip.file('art.ini', art);

        if (shpFiles.length > 0) {
          zip.file('ecache99.mix', buildEcacheMix(shpFiles));
          debugLog.push(`Built ecache99.mix with ${shpFiles.length} files: ${shpFiles.map(f => f.name).join(', ')}`);
        }
        if (vxlFiles.length > 0) {
          zip.file('expand99.mix', buildEcacheMix(vxlFiles));
          debugLog.push(`Built expand99.mix with ${vxlFiles.length} files: ${vxlFiles.map(f => f.name).join(', ')}`);
        }
        zip.file('MOD_README.txt', generateReadme(selectedUnits, 'mod-only'));

        // Debug log
        debugLog.push(`Export complete: ${new Date().toISOString()}`);
        zip.file('export_debug_log.txt', debugLog.join('\n'));

        setExportProgress(85, 'Compressing...');
        const blob = await zip.generateAsync(
          { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
          (meta) => setExportProgress(85 + Math.floor(meta.percent * 0.12), 'Compressing...')
        );

        const date = new Date().toISOString().split('T')[0];
        saveAs(blob, `TibSun_ModFiles_${date}.zip`);
        setExportProgress(100, 'Done!');
        setTimeout(() => resetExport(), 2000);
        return;
      }

      // ── STANDALONE MODE (with caching) ────────────────────
      setExportProgress(5, 'Checking cache...');
      let skeletonBlob = await getCachedSkeleton();

      if (!skeletonBlob) {
        setExportProgress(8, 'Downloading base game (~200MB)...');
        const response = await fetch(SKELETON_URL, { mode: 'cors' });
        if (!response.ok) throw new Error(`Skeleton fetch failed: ${response.statusText}`);
        setExportProgress(15, 'Downloading base game (~200MB)...');
        skeletonBlob = await response.blob();
        console.log(`📦 Skeleton: ${(skeletonBlob.size / 1024 / 1024).toFixed(1)} MB`);

        // Cache for next time
        setExportProgress(22, 'Caching skeleton for future exports...');
        await cacheSkeleton(skeletonBlob);
      } else {
        setExportProgress(22, 'Using cached skeleton ✓');
      }

      // Load ZIP
      setExportProgress(25, 'Unpacking skeleton...');
      const zip = await JSZip.loadAsync(skeletonBlob);

      // Find game root
      setExportProgress(30, 'Reading game configuration...');
      const gameExeMatch = zip.file(/Game\.exe$/i);
      let gameRoot = '';
      if (gameExeMatch.length > 0) {
        const exePath = gameExeMatch[0].name;
        gameRoot = exePath.substring(0, exePath.lastIndexOf('/') + 1);
      }

      const rulesMatches = zip.file(/rules\.ini$/i);
      const artMatches = zip.file(/art\.ini$/i);
      if (rulesMatches.length === 0) throw new Error('Skeleton missing rules.ini');
      if (artMatches.length === 0) throw new Error('Skeleton missing art.ini');

      const originalRules = await rulesMatches[0].async('string');
      const originalArt = await artMatches[0].async('string');

      // Parse + inject rules
      setExportProgress(40, 'Merging unit definitions...');
      const rulesData = TiberianSunINIParser.parse(originalRules);
      const withLists = TiberianSunINIParser.injectUnits(rulesData, selectedUnits);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(withLists, selectedUnits);
      const finalRules = TiberianSunINIParser.stringify(withDefs);
      debugLog.push('Merged rules.ini with unit definitions and type lists');

      // Parse + inject art
      setExportProgress(50, 'Merging art definitions...');
      const artData = TiberianSunINIParser.parse(originalArt);
      const withArtDefs = TiberianSunINIParser.addArtDefinitions(artData, selectedUnits);
      const finalArt = TiberianSunINIParser.stringify(withArtDefs);
      debugLog.push('Merged art.ini with art definitions (Image, Cameo, AltCameo)');

      zip.file(`${gameRoot}rules.ini`, finalRules);
      zip.file(`${gameRoot}art.ini`, finalArt);

      // Download assets
      setExportProgress(55, 'Downloading unit graphics...');
      const { shpFiles, vxlFiles } = await downloadUnitAssets(selectedUnits, setExportProgress, debugLog);

      // Build MIX files
      if (shpFiles.length > 0) {
        setExportProgress(80, `Building ecache99.mix (${shpFiles.length} sprites)...`);
        const mixData = buildEcacheMix(shpFiles);
        zip.file(`${gameRoot}ecache99.mix`, mixData);
        debugLog.push(`Built ecache99.mix with ${shpFiles.length} files: ${shpFiles.map(f => f.name).join(', ')}`);
      }
      if (vxlFiles.length > 0) {
        setExportProgress(83, `Building expand99.mix (${vxlFiles.length} voxel files)...`);
        zip.file(`${gameRoot}expand99.mix`, buildEcacheMix(vxlFiles));
        debugLog.push(`Built expand99.mix with ${vxlFiles.length} files: ${vxlFiles.map(f => f.name).join(', ')}`);
      }

      // README + debug log
      setExportProgress(88, 'Writing installation guide...');
      zip.file(`${gameRoot}MOD_README.txt`, generateReadme(selectedUnits, 'standalone'));
      debugLog.push(`Export complete: ${new Date().toISOString()}`);
      zip.file(`${gameRoot}export_debug_log.txt`, debugLog.join('\n'));

      // Compress + download
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
