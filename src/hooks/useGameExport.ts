import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useUnitSelection } from '@/store/useUnitSelection';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { CustomUnit } from '@/types/units';
import { TiberianSunINIParser } from '@/lib/iniParser';

const SKELETON_URL = 'https://pub-2779116bf9b04734a8ce304c271ce31b.r2.dev/ts_base_skeleton.zip';

/**
 * Generate installation instructions
 */
function generateInstallationGuide(units: CustomUnit[]): string {
  return `
==============================================================
  TIBERIAN SUN CUSTOM MOD - Installation Guide
==============================================================

Generated: ${new Date().toLocaleString()}
Custom Units: ${units.length}

WHAT'S INCLUDED:
----------------
✅ rules.ini - COMPLETE file (original game + ${units.length} custom units)
✅ art.ini - COMPLETE file (original game + custom unit art)
✅ ${units.length} .SHP files (unit sprites)
✅ All original game content PRESERVED

FILE INTEGRITY:
---------------
This mod uses the PROPER Tiberian Sun modding method:
✅ Original units: E1, E2, Titan, Wolverine, etc. (ALL INTACT)
✅ Custom units: Added to end of build lists
✅ Base game fully playable
✅ Custom units appear when prerequisites met

INSTALLATION:
-------------
1. BACKUP YOUR GAME (recommended)
   - Copy your TS folder to "TibSun_Backup" first

2. Extract this ZIP to your Tiberian Sun folder:
   Examples:
   - C:\\Games\\TibSun\\
   - C:\\CnCNet\\TibSun\\
   - Wherever Game.exe is located

3. When prompted to overwrite:
   - Click "YES TO ALL"
   - This replaces rules.ini and art.ini with modded versions
   - Original content is preserved within the files!

4. Launch the game normally:
   - Game.exe or ts-spawn.exe or CnCNet launcher

5. Start Skirmish or Multiplayer

6. Build your custom units!

CUSTOM UNITS:
-------------
${units.map((u, i) => `${i + 1}. ${u.displayName} (${u.internalName})
   Faction: ${u.faction}
   Type: ${u.category}
   Cost: $${u.cost}
   Tech Level: ${u.techLevel}
   Unlocks with: ${
     u.category === 'Infantry' 
       ? (u.faction === 'GDI' ? 'Barracks' : 'Hand of Nod')
       : (u.faction === 'GDI' ? 'War Factory' : 'War Factory')
   }`).join('\n\n')}

VERIFICATION:
-------------
After installation:
1. Check that rules.ini and art.ini are in your TS root folder
2. Check file sizes:
   - rules.ini should be ~500-700 KB (original ~500KB + custom)
   - art.ini should be ~300-400 KB (original ~300KB + custom)
3. Launch game
4. Start skirmish as ${units[0]?.faction || 'GDI'}
5. Build prerequisite building
6. Custom units appear in sidebar!

TROUBLESHOOTING:
----------------
Q: Custom units don't appear?
A: Build the prerequisite building first

Q: Game crashes on startup?
A: One of the .SHP files may be corrupted - check file sizes

Q: Units visible but no graphics?
A: Verify .SHP files are in ROOT folder (not in subfolders)

Q: Want to remove mod?
A: Delete rules.ini and art.ini, game loads originals from MIX

MULTIPLAYER:
------------
⚠️  All players need IDENTICAL rules.ini for multiplayer
⚠️  Share this ZIP with opponents before playing
⚠️  CnCNet supports custom rules - enable in lobby

REVERTING TO VANILLA:
---------------------
1. Delete rules.ini from root folder
2. Delete art.ini from root folder
3. Game will load original files from MIX archives
4. Or restore from your backup folder

CREATED WITH:
-------------
TibSun Mod Kit - https://tibsunmod.lovable.app

Enjoy your custom units! 🎮
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
    if (selectedUnitIds.size === 0) {
      console.warn('No units selected for export');
      return;
    }

    const selectedUnits = customUnits.filter(u => selectedUnitIds.has(u.id));
    
    if (selectedUnits.length === 0) {
      console.warn('Selected unit IDs do not match any custom units');
      return;
    }

    try {
      setExporting(true);
      setExportProgress(5, 'Initializing export...');

      // Step 1: Fetch base game skeleton from R2
      setExportProgress(10, 'Downloading base game (~200MB)...');
      console.log('📦 Fetching skeleton from R2...');
      
      const response = await fetch(SKELETON_URL, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`Failed to download game skeleton: ${response.statusText}`);
      }

      setExportProgress(25, 'Loading game engine...');
      const skeletonBlob = await response.blob();
      console.log(`📦 Downloaded skeleton: ${(skeletonBlob.size / 1024 / 1024).toFixed(1)} MB`);

      // Step 2: Load skeleton into JSZip
      setExportProgress(30, 'Extracting game archive...');
      const zip = await JSZip.loadAsync(skeletonBlob);

      // Step 3: Extract and parse original INI files
      setExportProgress(35, 'Reading original rules.ini...');
      
      const rulesFile = zip.file('rules.ini');
      const artFile = zip.file('art.ini');
      
      if (!rulesFile) {
        throw new Error('Skeleton is missing rules.ini - invalid game package');
      }
      if (!artFile) {
        throw new Error('Skeleton is missing art.ini - invalid game package');
      }

      const originalRulesText = await rulesFile.async('string');
      const originalArtText = await artFile.async('string');
      
      console.log(`📄 Original rules.ini: ${originalRulesText.length} chars (~${(originalRulesText.length / 1024).toFixed(0)} KB)`);
      console.log(`📄 Original art.ini: ${originalArtText.length} chars (~${(originalArtText.length / 1024).toFixed(0)} KB)`);

      // Step 4: Parse INI files into structured objects
      setExportProgress(40, 'Parsing game configuration...');
      const rulesData = TiberianSunINIParser.parse(originalRulesText);
      const artData = TiberianSunINIParser.parse(originalArtText);
      
      console.log(`📄 Parsed ${rulesData.sectionOrder.length} sections from rules.ini`);
      console.log(`📄 Parsed ${artData.sectionOrder.length} sections from art.ini`);

      // Step 5: Inject custom units into type lists
      setExportProgress(45, 'Adding units to build lists...');
      console.log(`🔧 Injecting ${selectedUnits.length} custom units...`);
      const rulesWithLists = TiberianSunINIParser.injectUnits(rulesData, selectedUnits);

      // Step 6: Add unit definition sections
      setExportProgress(50, 'Adding unit definitions...');
      const rulesComplete = TiberianSunINIParser.addUnitDefinitions(rulesWithLists, selectedUnits);

      // Step 7: Add art definition sections
      setExportProgress(55, 'Adding art definitions...');
      const artComplete = TiberianSunINIParser.addArtDefinitions(artData, selectedUnits);

      // Step 8: Regenerate complete INI files
      setExportProgress(60, 'Generating modified rules.ini...');
      const finalRulesText = TiberianSunINIParser.stringify(rulesComplete);
      
      setExportProgress(62, 'Generating modified art.ini...');
      const finalArtText = TiberianSunINIParser.stringify(artComplete);
      
      console.log(`📄 Final rules.ini: ${finalRulesText.length} chars (~${(finalRulesText.length / 1024).toFixed(0)} KB)`);
      console.log(`📄 Final art.ini: ${finalArtText.length} chars (~${(finalArtText.length / 1024).toFixed(0)} KB)`);

      // Step 9: Replace INI files in ZIP
      setExportProgress(65, 'Updating game files...');
      zip.file('rules.ini', finalRulesText);
      zip.file('art.ini', finalArtText);
      console.log('✅ Replaced rules.ini and art.ini with modded versions');

      // Step 10: Download and add .SHP files to root
      setExportProgress(68, 'Downloading unit graphics...');
      let unitIndex = 0;
      
      for (const unit of selectedUnits) {
        unitIndex++;
        const progress = 68 + Math.floor((unitIndex / selectedUnits.length) * 17);
        setExportProgress(progress, `Adding ${unit.displayName}...`);

        if (unit.shpFilePath && isSupabaseConfigured && supabase) {
          try {
            // Determine bucket based on path prefix
            const isPpmAsset = unit.shpFilePath.toLowerCase().startsWith('ppm/');
            const bucketName = isPpmAsset ? 'asset-previews' : 'user_assets';
            
            // Clean the path
            const cleanPath = unit.shpFilePath
              .replace(/^user_assets\//, '')
              .replace(/^asset-previews\//, '');
            
            const { data, error } = await supabase.storage
              .from(bucketName)
              .download(cleanPath);

            if (!error && data) {
              // CRITICAL: 8.3 filename format (max 8 chars before extension)
              const shpName = unit.internalName.substring(0, 8).toUpperCase();
              zip.file(`${shpName}.SHP`, data);
              console.log(`✅ Added ${shpName}.SHP to root folder`);
            } else {
              console.warn(`⚠️ Could not download SHP for ${unit.internalName}:`, error);
            }
          } catch (err) {
            console.warn(`⚠️ Error downloading SHP for ${unit.internalName}:`, err);
          }
        }
      }

      // Step 11: Generate installation guide
      setExportProgress(88, 'Creating installation guide...');
      const readme = generateInstallationGuide(selectedUnits);
      zip.file('MOD_INSTALL.txt', readme);
      console.log('✅ Created MOD_INSTALL.txt');

      // Step 12: Compress and download
      setExportProgress(90, 'Compressing final package...');
      const finalBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        const compressionProgress = 90 + Math.floor(metadata.percent * 0.08);
        setExportProgress(compressionProgress, 'Compressing...');
      });

      setExportProgress(100, 'Download starting...');

      // Trigger download with date-stamped filename
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(finalBlob, `TiberianSun_Mod_${timestamp}.zip`);

      console.log('🎉 Export complete!');
      console.log(`📦 Package contains:`);
      console.log(`   - rules.ini: ${(finalRulesText.length / 1024).toFixed(0)} KB (original + ${selectedUnits.length} custom units)`);
      console.log(`   - art.ini: ${(finalArtText.length / 1024).toFixed(0)} KB (original + custom art)`);
      console.log(`   - ${selectedUnits.length} .SHP files in root folder`);

      // Reset after a short delay
      setTimeout(() => {
        resetExport();
      }, 2000);

    } catch (error) {
      console.error('❌ Export failed:', error);
      setExportProgress(0, `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setTimeout(() => {
        resetExport();
      }, 3000);
    }
  }, [customUnits, selectedUnitIds, setExporting, setExportProgress, resetExport]);

  return { exportGame };
};
