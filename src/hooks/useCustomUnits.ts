import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, requireSupabase } from '@/integrations/supabase/client';
import { CustomUnit, Faction, UnitCategory } from '@/types/units';

interface CreateUnitInput {
  internalName: string;
  displayName: string;
  faction: Faction;
  category: UnitCategory;
  cost: number;
  strength: number;
  speed: number;
  techLevel?: number;
  shpFile?: File;
  armor?: string;
  primaryWeapon?: string;
  secondaryWeapon?: string;
  sightRange?: number;
  locomotor?: string;
  crushable?: boolean;
  crusher?: boolean;
}

// Helper to capitalize first letter (for category normalization)
const capitalize = (str: string): string => 
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// Transform database row to CustomUnit type
// Note: faction, category, cost, strength, speed, techLevel are stored inside rules_json
const transformToCustomUnit = (row: Record<string, unknown>): CustomUnit => {
  const rules = (row.rules_json as Record<string, unknown>) || {};
  
  const rawCategory = (row.category as string) || (rules.Category as string) || 'Infantry';
  const rawFaction = (rules.Owner as string) || (rules.owner as string) || 'GDI';
  
  // Normalize category — database stores exact values like 'Structure', 'Infantry', etc.
  const normalizeCategory = (cat: string): string => {
    const lower = cat.toLowerCase();
    if (lower === 'structure' || lower === 'support') return 'Structure';
    if (lower === 'infantry' || lower === 'soldier') return 'Infantry';
    if (lower === 'vehicle' || lower === 'afv') return 'Vehicle';
    if (lower === 'aircraft' || lower === 'airpower') return 'Aircraft';
    return capitalize(cat);
  };

  return {
    id: row.id as string,
    type: 'custom',
    internalName: row.internal_name as string,
    displayName: row.name as string,
    faction: rawFaction as Faction,
    category: normalizeCategory(rawCategory) as UnitCategory,
    cost: (rules.Cost as number) || (rules.cost as number) || 0,
    strength: (rules.Strength as number) || (rules.strength as number) || 0,
    speed: (rules.Speed as number) || (rules.speed as number) || 0,
    techLevel: (rules.TechLevel as number) || (rules.techLevel as number) || 1,
    renderType: (row.render_type as string as any) || 'SHP',
    shpFilePath: row.shp_file_path as string | undefined,
    voxelFilePath: row.vxl_file_path as string | undefined,
    hvaFilePath: row.hva_file_path as string | undefined,
    turretVxlPath: row.turret_vxl_path as string | undefined,
    barrelVxlPath: row.barrel_vxl_path as string | undefined,
    cameoFilePath: row.cameo_file_path as string | undefined,
    previewImageUrl: row.preview_image_url as string | undefined,
    rulesJson: rules,
    artJson: row.art_json as Record<string, unknown> | undefined,
    creatorNotes: row.creator_notes as string | undefined,
    // Structure-specific
    foundation: row.foundation as string | undefined,
    power: row.power as number | undefined,
    powerDrain: row.power_drain as number | undefined,
    buildCat: row.build_cat as string | undefined,
    isFactory: row.is_factory as boolean | undefined,
    hasBib: row.has_bib as boolean | undefined,
    buildupFilePath: row.buildup_file_path as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
};

export const useCustomUnits = () => {
  const queryClient = useQueryClient();

  // If Supabase is not configured, return early with empty state
  const isConfigMissing = !isSupabaseConfigured;

  // Fetch all custom units
  const { data: customUnits = [], isLoading, error } = useQuery({
    queryKey: ['custom-units'],
    queryFn: async () => {
      const client = requireSupabase();

      const { data, error } = await client
        .from('custom_units')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data ?? []).map(transformToCustomUnit);
    },
    enabled: isSupabaseConfigured,
  });

  // Create unit mutation
  const createUnitMutation = useMutation({
    mutationFn: async (input: CreateUnitInput) => {
      const client = requireSupabase();

      let shpFilePath: string | null = null;

      // Upload SHP file if provided
      if (input.shpFile) {
        const fileName = `${input.internalName.toLowerCase()}_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;

        const { error: uploadError } = await client.storage
          .from('user_assets')
          .upload(filePath, input.shpFile, { upsert: true });

        if (uploadError) throw uploadError;
        shpFilePath = filePath;
      }

      // Insert unit record
      const { data, error } = await client
        .from('custom_units')
        .insert({
          internal_name: input.internalName,
          name: input.displayName,
          faction: input.faction,
          category: input.category,
          cost: input.cost,
          strength: input.strength,
          speed: input.speed,
          tech_level: input.techLevel ?? 1,
          shp_file_path: shpFilePath,
          rules_json: {
            Category: input.category,
            Cost: input.cost,
            Strength: input.strength,
            Speed: input.speed,
            Owner: input.faction,
            Prerequisite: input.category === 'Infantry'
              ? (input.faction === 'GDI' ? 'GAPILE' : 'NAHAND')
              : (input.faction === 'GDI' ? 'GAWEAP' : 'NAWEAP'),
            Primary: input.primaryWeapon || '',
            Secondary: input.secondaryWeapon || '',
            Armor: input.armor || 'none',
            TechLevel: input.techLevel ?? 1,
            Sight: input.sightRange ?? 5,
            Locomotor: input.locomotor || 'Foot',
            Crushable: input.crushable !== undefined ? (input.crushable ? 'yes' : 'no') : (input.category === 'Infantry' ? 'yes' : 'no'),
            Crusher: input.crusher !== undefined ? (input.crusher ? 'yes' : 'no') : (input.category === 'Vehicle' ? 'yes' : 'no'),
          },
        })
        .select()
        .single();

      if (error) throw error;
      return transformToCustomUnit(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
    },
  });

  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      const client = requireSupabase();

      const { error } = await client
        .from('custom_units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
    },
  });

  // Update unit mutation (for editing existing custom units or creating overrides)
  const updateUnitMutation = useMutation({
    mutationFn: async (input: {
      id?: string; // If provided, update existing; otherwise insert new
      internalName: string;
      displayName: string;
      faction: Faction;
      category: UnitCategory;
      cost: number;
      strength: number;
      speed: number;
      techLevel?: number;
      armor?: string;
      primaryWeapon?: string;
      secondaryWeapon?: string;
      sightRange?: number;
      locomotor?: string;
      shpFilePath?: string;
      crushable?: boolean;
      crusher?: boolean;
    }) => {
      const client = requireSupabase();

      const rulesJson = {
        Category: input.category,
        Cost: input.cost,
        Strength: input.strength,
        Speed: input.speed,
        Owner: input.faction,
        TechLevel: input.techLevel ?? 1,
        Armor: input.armor || 'none',
        Primary: input.primaryWeapon || '',
        Secondary: input.secondaryWeapon || '',
        Sight: input.sightRange ?? 5,
        Locomotor: input.locomotor || 'Foot',
        Prerequisite: input.category === 'Infantry'
          ? (input.faction === 'GDI' ? 'GAPILE' : 'NAHAND')
          : (input.faction === 'GDI' ? 'GAWEAP' : 'NAWEAP'),
        Crushable: input.crushable !== undefined ? (input.crushable ? 'yes' : 'no') : (input.category === 'Infantry' ? 'yes' : 'no'),
        Crusher: input.crusher !== undefined ? (input.crusher ? 'yes' : 'no') : (input.category === 'Vehicle' ? 'yes' : 'no'),
      };

      if (input.id) {
        // Update existing custom unit
        const { data, error } = await client
          .from('custom_units')
          .update({
            name: input.displayName,
            internal_name: input.internalName,
            faction: input.faction,
            category: input.category,
            rules_json: rulesJson,
            shp_file_path: input.shpFilePath,
          })
          .eq('id', input.id)
          .select()
          .single();

        if (error) throw error;
        return transformToCustomUnit(data);
      } else {
        // Insert new custom unit (override for default unit)
        const { data, error } = await client
          .from('custom_units')
          .insert({
            internal_name: input.internalName,
            name: input.displayName,
            faction: input.faction,
            category: input.category,
            rules_json: rulesJson,
            shp_file_path: input.shpFilePath,
          })
          .select()
          .single();

        if (error) throw error;
        return transformToCustomUnit(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
    },
  });

  // Filter helper
  const getUnitsByFactionAndCategory = (faction: Faction, category: UnitCategory) => {
    return customUnits.filter(
      (u) => u.faction === faction && u.category === category
    );
  };

  // Get the Supabase client for storage access (used by export)
  const getSupabaseClient = () => {
    return isSupabaseConfigured ? supabase : null;
  };

  return {
    customUnits,
    isLoading,
    error,
    isConfigMissing,
    addUnit: createUnitMutation.mutateAsync,
    updateUnit: updateUnitMutation.mutateAsync,
    removeUnit: deleteUnitMutation.mutateAsync,
    isCreating: createUnitMutation.isPending,
    isUpdating: updateUnitMutation.isPending,
    isDeleting: deleteUnitMutation.isPending,
    getUnitsByFactionAndCategory,
    getSupabaseClient,
  };
};
