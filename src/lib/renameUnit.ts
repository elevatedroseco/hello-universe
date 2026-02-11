import { supabase } from '@/integrations/supabase/client';

export async function renameUnit(
  unitId: string,
  oldName: string,
  newName: string,
  onStep: (msg: string) => void
): Promise<void> {
  const OLD = oldName.toUpperCase().substring(0, 8);
  const NEW = newName.toUpperCase().substring(0, 8);
  const OLD_ICON = (OLD + 'ICON').substring(0, 8);
  const NEW_ICON = (NEW + 'ICON').substring(0, 8);

  // Step 1: Rename sprite in Storage
  onStep(`Renaming ${OLD}.SHP → ${NEW}.SHP...`);
  try {
    const { data: spriteData } = await supabase.storage
      .from('user_assets')
      .download(`units/${OLD}.SHP`);

    if (spriteData) {
      await supabase.storage
        .from('user_assets')
        .upload(`units/${NEW}.SHP`, spriteData, { upsert: true });

      await supabase.storage
        .from('user_assets')
        .remove([`units/${OLD}.SHP`]);
    }
  } catch {
    onStep('Note: sprite file not found in storage, skipping...');
  }

  // Step 2: Rename icon in Storage
  onStep(`Renaming ${OLD_ICON}.SHP → ${NEW_ICON}.SHP...`);
  try {
    const { data: iconData } = await supabase.storage
      .from('user_assets')
      .download(`units/${OLD_ICON}.SHP`);

    if (iconData) {
      await supabase.storage
        .from('user_assets')
        .upload(`units/${NEW_ICON}.SHP`, iconData, { upsert: true });

      await supabase.storage
        .from('user_assets')
        .remove([`units/${OLD_ICON}.SHP`]);
    }
  } catch {
    onStep('Note: icon file not found in storage, skipping...');
  }

  // Step 3: Get existing rules_json
  onStep('Updating database record...');
  const { data: existing } = await supabase
    .from('custom_units')
    .select('rules_json')
    .eq('id', unitId)
    .single();

  const existingRules = (existing?.rules_json as Record<string, unknown>) || {};

  // Step 4: Update database row with all new references
  const { error } = await supabase
    .from('custom_units')
    .update({
      internal_name: NEW,
      shp_file_path: `units/${NEW}.SHP`,
      cameo_file_path: `units/${NEW_ICON}.SHP`,
      rules_json: {
        ...existingRules,
        Image: NEW,
      },
    })
    .eq('id', unitId);

  if (error) throw new Error(`Database update failed: ${error.message}`);
  onStep(`Done! Unit renamed to ${NEW}`);
}
