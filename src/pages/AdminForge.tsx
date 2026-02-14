import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, requireSupabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings2, Swords, Gauge, ImageIcon, Volume2, Sparkles, ArrowLeft, PenLine, Search, AlertTriangle, Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TabGeneral } from '@/components/admin/tabs/TabGeneral';
import { TabCombat } from '@/components/admin/tabs/TabCombat';
import { TabPhysics } from '@/components/admin/tabs/TabPhysics';
import { TabArt } from '@/components/admin/tabs/TabArt';
import { TabVoice } from '@/components/admin/tabs/TabVoice';
import { TabStructure } from '@/components/admin/tabs/TabStructure';
import { INIPreview } from '@/components/admin/INIPreview';
import { CloneUnitDialog } from '@/components/admin/CloneUnitDialog';
import { UnitForm, DEFAULT_FORM } from '@/components/admin/types';
import { TS_LOCOMOTORS } from '@/data/tsWeapons';
import { ORIGINAL_GAME_UNITS } from '@/data/gameUnits';
import { RenameUnitDialog } from '@/components/admin/RenameUnitDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ForgeUnit {
  id: string;
  internal_name: string;
  name: string;
  faction: string;
  category: string;
  render_type?: string;
}

const AdminForge = () => {
  const [form, setForm] = useState<UnitForm>({ ...DEFAULT_FORM });
  const queryClient = useQueryClient();
  const [renamingUnit, setRenamingUnit] = useState<ForgeUnit | null>(null);
  const [listSearch, setListSearch] = useState('');

  const { data: forgeUnits = [], isLoading: forgeLoading } = useQuery({
    queryKey: ['forge-units'],
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('custom_units')
        .select('*')
        .order('internal_name');
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        internal_name: row.internal_name,
        name: row.name,
        faction: row.faction,
        category: row.category,
        render_type: row.render_type || 'SHP',
      })) as ForgeUnit[];
    },
    enabled: isSupabaseConfigured,
  });

  const filteredForgeUnits = forgeUnits.filter((u) => {
    if (!listSearch) return true;
    const q = listSearch.toLowerCase();
    return u.internal_name.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const isStructure = form.category === 'Structure';

  const mintMutation = useMutation({
    mutationFn: async (formData: UnitForm) => {
      const client = requireSupabase();
      let shpFilePath: string | null = null;
      let iconFilePath: string | null = null;
      let vxlFilePath: string | null = null;
      let hvaFilePath: string | null = null;
      let turretVxlPath: string | null = null;
      let barrelVxlPath: string | null = null;
      let buildupFilePath: string | null = null;

      const isVoxel = formData.renderType === 'VOXEL';
      const isStruct = formData.category === 'Structure';

      // Validate voxel files
      if (isVoxel && (!formData.vxlFile || !formData.hvaFile)) {
        throw new Error('Voxel units require both VXL and HVA files');
      }

      // Upload SHP sprite (for SHP render type or structures)
      if ((!isVoxel || isStruct) && formData.spriteFile) {
        const fileName = `${formData.internalName.toLowerCase()}_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.spriteFile, { upsert: true });
        if (error) throw error;
        shpFilePath = filePath;
      }

      // Upload buildup SHP for structures
      if (isStruct && formData.buildupFile) {
        const fileName = `${formData.internalName.toLowerCase()}_buildup_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.buildupFile, { upsert: true });
        if (error) throw error;
        buildupFilePath = filePath;
      }

      // Upload VXL file
      if (isVoxel && formData.vxlFile) {
        const filePath = `units/${formData.internalName.toUpperCase()}.VXL`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.vxlFile, { upsert: true });
        if (error) throw error;
        vxlFilePath = filePath;
      }

      // Upload HVA file
      if (isVoxel && formData.hvaFile) {
        const filePath = `units/${formData.internalName.toUpperCase()}.HVA`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.hvaFile, { upsert: true });
        if (error) throw error;
        hvaFilePath = filePath;
      }

      // Upload turret VXL
      if (isVoxel && formData.hasTurret && formData.turretVxlFile) {
        const filePath = `units/${formData.internalName.toUpperCase()}TUR.VXL`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.turretVxlFile, { upsert: true });
        if (error) throw error;
        turretVxlPath = filePath;
      }

      // Upload barrel VXL
      if (isVoxel && formData.hasBarrel && formData.barrelVxlFile) {
        const filePath = `units/${formData.internalName.toUpperCase()}BARL.VXL`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.barrelVxlFile, { upsert: true });
        if (error) throw error;
        barrelVxlPath = filePath;
      }

      // Upload icon/cameo (always SHP)
      if (formData.iconFile) {
        const iconName = `${formData.internalName.toLowerCase()}_icon_${Date.now()}.shp`;
        const iconPath = `units/${iconName}`;
        const { error } = await client.storage.from('user_assets').upload(iconPath, formData.iconFile, { upsert: true });
        if (error) throw error;
        iconFilePath = iconPath;
      }

      const locoGuid = TS_LOCOMOTORS.find((l) => l.id === formData.locomotor)?.guid || '';
      const cameoId = (formData.internalName.substring(0, 4) + 'ICON').toUpperCase();

      const rulesJson: Record<string, unknown> = {
        Category: isStruct ? 'Support' : formData.category,
        Cost: formData.cost,
        Strength: formData.strength,
        Speed: formData.speed,
        Owner: formData.faction,
        TechLevel: formData.techLevel,
        Prerequisite: formData.prerequisite,
        Primary: formData.primaryWeapon,
        Elite: formData.eliteWeapon || null,
        Warhead: formData.warhead,
        Armor: formData.armor,
        ROF: formData.rof,
        Range: formData.range,
        Locomotor: locoGuid,
        Crushable: formData.crushable,
        Crusher: formData.crusher,
        Cloakable: formData.cloakable,
        Sensors: formData.sensors,
        Fearless: formData.fearless,
        TiberiumHeal: formData.tiberiumHeal,
        Sight: formData.sight,
        VoiceSelect: formData.voiceSelect,
        VoiceMove: formData.voiceMove,
        VoiceAttack: formData.voiceAttack,
        VoiceFeedback: formData.voiceFeedback,
        Points: formData.points,
      };

      // Structure-specific rules
      if (isStruct) {
        rulesJson.Power = formData.power;
        rulesJson.PowerDrain = formData.powerDrain;
        rulesJson.BuildCat = formData.buildCat;
        rulesJson.IsFactory = formData.isFactory;
        rulesJson.Bib = formData.hasBib;
        rulesJson.BaseNormal = true;
        rulesJson.IsBase = true;
      }

      // Voxel-specific rules
      if (isVoxel && formData.hasTurret) {
        rulesJson.Turret = true;
      }

      const artJson: Record<string, unknown> = isStruct
        ? {
            Image: formData.internalName,
            Foundation: formData.foundation,
            Cameo: cameoId,
            Remapable: 'yes',
            NewTheater: 'yes',
            ...(buildupFilePath ? { Buildup: formData.internalName.substring(0, 5).toUpperCase() + 'BUP' } : {}),
          }
        : isVoxel
          ? {
              Voxel: 'yes',
              Remapable: 'yes',
              Shadow: 'yes',
              Normalized: 'yes',
              Cameo: cameoId,
              PrimaryFireFLH: formData.primaryFireFLH,
              SecondaryFireFLH: formData.secondaryFireFLH,
              TurretOffset: formData.turretOffset,
              Turret: formData.hasTurret ? 'yes' : undefined,
            }
          : {
              Image: formData.internalName,
              Cameo: cameoId,
              Sequence: formData.category === 'Infantry' ? formData.sequence : undefined,
            };

      const insertData: Record<string, unknown> = {
        internal_name: formData.internalName,
        name: formData.displayName,
        faction: formData.faction,
        category: formData.category,
        cost: formData.cost,
        strength: formData.strength,
        speed: formData.speed,
        tech_level: formData.techLevel,
        shp_file_path: shpFilePath,
        icon_file_path: iconFilePath,
        rules_json: rulesJson,
        art_json: artJson,
        render_type: formData.renderType,
        vxl_file_path: vxlFilePath,
        hva_file_path: hvaFilePath,
        turret_vxl_path: turretVxlPath,
        barrel_vxl_path: barrelVxlPath,
        buildup_file_path: buildupFilePath,
        foundation: isStruct ? formData.foundation : null,
        power: isStruct ? formData.power : 0,
        power_drain: isStruct ? formData.powerDrain : 0,
        build_cat: isStruct ? formData.buildCat : null,
        is_factory: isStruct ? formData.isFactory : false,
        has_bib: isStruct ? formData.hasBib : false,
      };

      const { data, error } = await client
        .from('custom_units')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
      queryClient.invalidateQueries({ queryKey: ['forge-units'] });
      toast.success(`Unit "${form.displayName}" minted!`);
      setForm({ ...DEFAULT_FORM });
    },
    onError: (err) => {
      toast.error(`Mint failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const handleMint = () => {
    if (!form.internalName || !form.displayName) {
      toast.error('Internal Name and Display Name are required');
      return;
    }
    if (form.renderType === 'VOXEL' && (!form.vxlFile || !form.hvaFile)) {
      toast.error('Voxel units require both VXL and HVA files');
      return;
    }
    if (ORIGINAL_GAME_UNITS.has(form.internalName.toUpperCase())) {
      const confirmed = window.confirm(
        `"${form.internalName}" is an original Tiberian Sun unit.\n\n` +
        `Minting this will overwrite the base game unit during export.\n\n` +
        `Recommended: use a unique name like "${form.internalName}X" or "${form.internalName}2".\n\n` +
        `Continue anyway?`
      );
      if (!confirmed) return;
    }
    mintMutation.mutate(form);
  };

  const handleClone = (clonedFields: Partial<UnitForm>) => {
    setForm((prev) => ({ ...prev, ...clonedFields }));
    toast.info('Unit cloned! Modify as needed, then mint.');
  };

  // Validation hints
  const nameEmpty = !form.internalName;
  const nameTooLong = form.internalName.length > 8;
  const nameCollision = form.internalName ? ORIGINAL_GAME_UNITS.has(form.internalName.toUpperCase()) : false;

  // Determine which tabs to show
  const showStructureTab = isStructure;
  const showCombatPhysicsArtVoice = !isStructure;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-modded-gold" />
            UNIT FORGE
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CloneUnitDialog onClone={handleClone} />
          <Link to="/validate">
            <Button variant="outline" size="sm" className="gap-1.5 border-border">
              <ShieldCheck className="w-3.5 h-3.5" />
              Validate
            </Button>
          </Link>
          {!isSupabaseConfigured && (
            <span className="text-xs text-destructive font-mono">⚠️ Backend not connected</span>
          )}
        </div>
      </header>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[calc(100vh-57px)]">
        {/* Left: Minted units list */}
        <aside className="border-b lg:border-b-0 lg:border-r border-border bg-card/30 overflow-y-auto max-h-[300px] lg:max-h-[calc(100vh-57px)]">
          <div className="p-3 border-b border-border sticky top-0 bg-card/80 backdrop-blur-sm z-10 space-y-2">
            <h2 className="font-display text-xs text-muted-foreground">
              MINTED UNITS ({forgeUnits.length})
            </h2>
            {forgeUnits.length > 3 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 h-8 text-xs bg-card/50"
                />
              </div>
            )}
          </div>
          {forgeLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : filteredForgeUnits.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredForgeUnits.map((unit) => (
                <div key={unit.id} className="flex items-center justify-between px-3 py-2.5 group hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm text-foreground block truncate">{unit.internal_name}</span>
                    <span className="text-xs text-muted-foreground truncate block">
                      {unit.name} · {unit.faction}
                      {unit.render_type === 'VOXEL' && <span className="ml-1 text-primary">⬡</span>}
                      {unit.category === 'Structure' && <span className="ml-1 text-mutant-green">⌂</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => setRenamingUnit(unit)}
                    className="p-1.5 rounded bg-primary/10 hover:bg-primary/30 text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                    title="Rename unit"
                    aria-label={`Rename ${unit.internal_name}`}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {forgeUnits.length === 0 ? 'No minted units yet' : 'No matches'}
            </div>
          )}
        </aside>

        {/* Right: Editor */}
        <div className="overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {showStructureTab ? (
                /* Structure-specific tabs */
                <Tabs defaultValue="general">
                  <TabsList className="w-full grid grid-cols-3 bg-secondary rounded-none border-b border-border">
                    <TabsTrigger value="general" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Settings2 className="w-3 h-3 mr-1" /> General
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Building2 className="w-3 h-3 mr-1" /> Structure
                    </TabsTrigger>
                    <TabsTrigger value="combat" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Swords className="w-3 h-3 mr-1" /> Combat
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="general"><TabGeneral form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="structure"><TabStructure form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="combat"><TabCombat form={form} setForm={setForm} /></TabsContent>
                </Tabs>
              ) : (
                /* Unit tabs (Infantry/Vehicle/Aircraft) */
                <Tabs defaultValue="general">
                  <TabsList className="w-full grid grid-cols-5 bg-secondary rounded-none border-b border-border">
                    <TabsTrigger value="general" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Settings2 className="w-3 h-3 mr-1" /> General
                    </TabsTrigger>
                    <TabsTrigger value="combat" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Swords className="w-3 h-3 mr-1" /> Combat
                    </TabsTrigger>
                    <TabsTrigger value="physics" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Gauge className="w-3 h-3 mr-1" /> Physics
                    </TabsTrigger>
                    <TabsTrigger value="art" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <ImageIcon className="w-3 h-3 mr-1" /> Art
                    </TabsTrigger>
                    <TabsTrigger value="voice" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                      <Volume2 className="w-3 h-3 mr-1" /> Voice
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="general"><TabGeneral form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="combat"><TabCombat form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="physics"><TabPhysics form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="art"><TabArt form={form} setForm={setForm} /></TabsContent>
                  <TabsContent value="voice"><TabVoice form={form} setForm={setForm} /></TabsContent>
                </Tabs>
              )}

              <INIPreview form={form} />

              {/* Validation hints + Mint */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex flex-wrap gap-2 empty:hidden">
                  {nameEmpty && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/50 gap-1">
                      <AlertTriangle className="w-3 h-3" /> Internal name required
                    </Badge>
                  )}
                  {nameTooLong && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/50 gap-1">
                      <AlertTriangle className="w-3 h-3" /> Max 8 characters
                    </Badge>
                  )}
                  {nameCollision && !nameEmpty && (
                    <Badge variant="outline" className="text-xs text-modded-gold border-modded-gold/50 gap-1">
                      <AlertTriangle className="w-3 h-3" /> Conflicts with base game unit
                    </Badge>
                  )}
                  {form.renderType === 'VOXEL' && (!form.vxlFile || !form.hvaFile) && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/50 gap-1">
                      <AlertTriangle className="w-3 h-3" /> VXL + HVA files required
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleMint}
                  disabled={mintMutation.isPending || nameEmpty || !form.displayName}
                  className="w-full bg-modded-gold hover:bg-modded-gold-glow text-black font-display text-sm h-12"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {mintMutation.isPending ? 'MINTING...' : isStructure ? 'MINT STRUCTURE' : 'MINT UNIT'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <RenameUnitDialog
        unit={renamingUnit}
        open={!!renamingUnit}
        onOpenChange={(open) => { if (!open) setRenamingUnit(null); }}
      />
    </div>
  );
};

export default AdminForge;
