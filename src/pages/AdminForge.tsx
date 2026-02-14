import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, requireSupabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings2, Swords, Gauge, ImageIcon, Volume2, Sparkles, ArrowLeft, PenLine, Search, AlertTriangle, Building2, ShieldCheck, Lock, RotateCcw, Wand2, Zap } from 'lucide-react';
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
import { AssetDropZone, ProcessedAssets, RecognizedFile } from '@/components/admin/AssetDropZone';
import { IconGenerator } from '@/components/admin/IconGenerator';

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

  // Asset-first state
  const [assetsDropped, setAssetsDropped] = useState(false);
  const [droppedInternalId, setDroppedInternalId] = useState('');
  const [droppedFiles, setDroppedFiles] = useState<RecognizedFile[]>([]);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);

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

  // Handle asset drop
  const handleFilesProcessed = (result: ProcessedAssets) => {
    const { internalId, recognizedFiles, parsedConfig } = result;
    const filled: string[] = [];

    // Set internal ID
    if (internalId) {
      setDroppedInternalId(internalId);
      setForm((prev) => ({ ...prev, internalName: internalId }));
      filled.push('internalName');
    }

    // Detect render type
    const hasVXL = recognizedFiles.some((f) => f.type === 'voxel');
    const renderType = hasVXL ? 'VOXEL' : 'SHP';
    setForm((prev) => ({ ...prev, renderType }));
    filled.push('renderType');

    // Assign files to form
    for (const rf of recognizedFiles) {
      if (rf.type === 'sprite') {
        setForm((prev) => ({ ...prev, spriteFile: rf.file }));
      } else if (rf.type === 'voxel') {
        setForm((prev) => ({ ...prev, vxlFile: rf.file }));
      } else if (rf.type === 'animation') {
        setForm((prev) => ({ ...prev, hvaFile: rf.file }));
      } else if (rf.type === 'icon') {
        setForm((prev) => ({ ...prev, iconFile: rf.file }));
      } else if (rf.type === 'image') {
        setIconImageFile(rf.file);
      } else if (rf.type === 'turret') {
        setForm((prev) => ({ ...prev, hasTurret: true, turretVxlFile: rf.file }));
        filled.push('hasTurret');
      } else if (rf.type === 'barrel') {
        setForm((prev) => ({ ...prev, hasBarrel: true, barrelVxlFile: rf.file }));
        filled.push('hasBarrel');
      } else if (rf.type === 'buildup') {
        setForm((prev) => ({ ...prev, buildupFile: rf.file }));
      }
    }

    // Auto-fill from config
    if (parsedConfig) {
      autoFillFromConfig(parsedConfig, filled);
    } else {
      applySmartDefaults(renderType, filled);
    }

    setDroppedFiles(recognizedFiles);
    setAutoFilledFields(filled);
    setAssetsDropped(true);

    // Flash animation
    setTimeout(() => {
      filled.forEach((field) => {
        const el = document.getElementById(`field-${field}`);
        if (el) {
          el.classList.add('animate-flash-green');
          setTimeout(() => el.classList.remove('animate-flash-green'), 2000);
        }
      });
    }, 100);
  };

  const autoFillFromConfig = (config: Record<string, string>, filled: string[]) => {
    setForm((prev) => {
      const updates: Partial<UnitForm> = {};

      if (config.Name) { updates.displayName = config.Name; filled.push('displayName'); }
      if (config.Owner) {
        const owner = config.Owner.split(',')[0].trim();
        updates.faction = (owner === 'GDI' ? 'GDI' : owner === 'Nod' ? 'Nod' : 'Mutant') as UnitForm['faction'];
        filled.push('faction');
      }
      if (config.Category) {
        const cat = config.Category.toLowerCase();
        if (cat === 'soldier') updates.category = 'Infantry';
        else if (cat === 'afv') updates.category = 'Vehicle';
        else if (cat === 'airpower') updates.category = 'Aircraft';
        else if (cat === 'support') updates.category = 'Structure';
        filled.push('category');
      }
      if (config.Cost) { updates.cost = parseInt(config.Cost); filled.push('cost'); }
      if (config.Strength) { updates.strength = parseInt(config.Strength); filled.push('strength'); }
      if (config.Speed) { updates.speed = parseInt(config.Speed); filled.push('speed'); }
      if (config.TechLevel) { updates.techLevel = parseInt(config.TechLevel); filled.push('techLevel'); }
      if (config.Prerequisite) { updates.prerequisite = config.Prerequisite; filled.push('prerequisite'); }
      if (config.Primary) { updates.primaryWeapon = config.Primary; filled.push('primaryWeapon'); }
      if (config.Armor) { updates.armor = config.Armor; filled.push('armor'); }

      return { ...prev, ...updates };
    });
  };

  const applySmartDefaults = (renderType: 'SHP' | 'VOXEL', filled: string[]) => {
    setForm((prev) => {
      if (renderType === 'VOXEL') {
        filled.push('category', 'strength', 'speed', 'armor', 'locomotor');
        return {
          ...prev,
          category: 'Vehicle',
          strength: 400,
          speed: 6,
          armor: 'light',
          locomotor: 'Drive',
          crushable: false,
          crusher: true,
        };
      } else {
        filled.push('category');
        return { ...prev, category: 'Infantry' };
      }
    });
  };

  const handleStartOver = () => {
    setAssetsDropped(false);
    setDroppedInternalId('');
    setDroppedFiles([]);
    setAutoFilledFields([]);
    setIconImageFile(null);
    setForm({ ...DEFAULT_FORM });
  };

  const handleIconReady = (file: File) => {
    setIconImageFile(file);
  };

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
      let previewImageUrl: string | null = null;

      const isVoxel = formData.renderType === 'VOXEL';
      const isStruct = formData.category === 'Structure';

      if (isVoxel && (!formData.vxlFile || !formData.hvaFile)) {
        throw new Error('Voxel units require both VXL and HVA files');
      }

      // Upload SHP
      if ((!isVoxel || isStruct) && formData.spriteFile) {
        const fileName = `${formData.internalName.toLowerCase()}_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.spriteFile, { upsert: true });
        if (error) throw error;
        shpFilePath = filePath;
      }

      // Upload buildup
      if (isStruct && formData.buildupFile) {
        const fileName = `${formData.internalName.toLowerCase()}_buildup_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.buildupFile, { upsert: true });
        if (error) throw error;
        buildupFilePath = filePath;
      }

      // Upload VXL
      if (isVoxel && formData.vxlFile) {
        const filePath = `units/${formData.internalName.toUpperCase()}.VXL`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.vxlFile, { upsert: true });
        if (error) throw error;
        vxlFilePath = filePath;
      }

      // Upload HVA
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

      // Upload icon SHP
      if (formData.iconFile) {
        const iconName = `${formData.internalName.toLowerCase()}_icon_${Date.now()}.shp`;
        const iconPath = `units/${iconName}`;
        const { error } = await client.storage.from('user_assets').upload(iconPath, formData.iconFile, { upsert: true });
        if (error) throw error;
        iconFilePath = iconPath;
      }

      // Upload preview image (from icon generator)
      if (iconImageFile) {
        const ext = iconImageFile.name.split('.').pop() || 'png';
        const imgName = `${formData.internalName.toLowerCase()}_preview_${Date.now()}.${ext}`;
        const imgPath = `previews/${imgName}`;
        const { error } = await client.storage.from('user_assets').upload(imgPath, iconImageFile, { upsert: true });
        if (error) throw error;
        const { data: urlData } = client.storage.from('user_assets').getPublicUrl(imgPath);
        previewImageUrl = urlData.publicUrl;
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

      if (isStruct) {
        rulesJson.Power = formData.power;
        rulesJson.PowerDrain = formData.powerDrain;
        rulesJson.BuildCat = formData.buildCat;
        rulesJson.IsFactory = formData.isFactory;
        rulesJson.Bib = formData.hasBib;
        rulesJson.BaseNormal = true;
        rulesJson.IsBase = true;
      }

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
        preview_image_url: previewImageUrl,
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
      handleStartOver();
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
    setAssetsDropped(true);
    setDroppedInternalId(clonedFields.internalName || '');
    toast.info('Unit cloned! Modify as needed, then mint.');
  };

  // Validation hints
  const nameEmpty = !form.internalName;
  const nameTooLong = form.internalName.length > 8;
  const nameCollision = form.internalName ? ORIGINAL_GAME_UNITS.has(form.internalName.toUpperCase()) : false;
  const showStructureTab = isStructure;

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
          {assetsDropped && (
            <Badge className="bg-mutant-green/20 text-mutant-green border-mutant-green/30 font-mono text-xs">
              ASSET-FIRST MODE
            </Badge>
          )}
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

            {/* STATE 1: Before Assets Dropped */}
            {!assetsDropped && (
              <div className="space-y-6">
                {/* Hero card */}
                <Card className="border-border bg-gradient-to-br from-secondary to-card overflow-hidden">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-modded-gold/10 border border-modded-gold/30 flex items-center justify-center mx-auto">
                      <Zap className="w-8 h-8 text-modded-gold" />
                    </div>
                    <h2 className="text-2xl font-display text-foreground">
                      Asset-First Unit Creation
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Drop your unit files to get started. Everything auto-fills from your assets!
                    </p>
                    <div className="flex justify-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-modded-gold" /> 3× faster
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-mutant-green" /> No mismatches
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-primary" /> AI icon gen
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Drop Zone */}
                <AssetDropZone onFilesProcessed={handleFilesProcessed} />

                {/* Or manual mode */}
                <div className="text-center">
                  <button
                    onClick={() => setAssetsDropped(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    Or start manually without files →
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: After Assets Dropped */}
            {assetsDropped && (
              <div className="space-y-4">
                {/* Locked ID Header */}
                {droppedInternalId && (
                  <Card className="border-mutant-green/30 bg-mutant-green/5">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-mutant-green" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Internal ID:</span>
                            <code className="text-base font-bold font-mono text-foreground">{droppedInternalId}</code>
                            <Badge variant="outline" className="text-[10px] border-mutant-green/50 text-mutant-green">
                              🔒 Locked
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {droppedFiles.length} files processed
                            {autoFilledFields.length > 0 && ` · ${autoFilledFields.length} fields auto-filled`}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleStartOver} className="gap-1.5 border-border">
                        <RotateCcw className="w-3 h-3" /> Start Over
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Auto-filled fields summary */}
                {autoFilledFields.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-modded-gold" />
                    <span className="text-muted-foreground">Auto-filled:</span>
                    <div className="flex flex-wrap gap-1">
                      {autoFilledFields.slice(0, 8).map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px] border-modded-gold/30 text-modded-gold">
                          {f}
                        </Badge>
                      ))}
                      {autoFilledFields.length > 8 && (
                        <Badge variant="outline" className="text-[10px] border-border">
                          +{autoFilledFields.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Tabs */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {showStructureTab ? (
                    <Tabs defaultValue="general">
                      <TabsList className="w-full grid grid-cols-4 bg-secondary rounded-none border-b border-border">
                        <TabsTrigger value="general" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                          <Settings2 className="w-3 h-3 mr-1" /> General
                        </TabsTrigger>
                        <TabsTrigger value="structure" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                          <Building2 className="w-3 h-3 mr-1" /> Structure
                        </TabsTrigger>
                        <TabsTrigger value="combat" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                          <Swords className="w-3 h-3 mr-1" /> Combat
                        </TabsTrigger>
                        <TabsTrigger value="icon" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                          <Wand2 className="w-3 h-3 mr-1" /> Icon
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="general"><TabGeneral form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="structure"><TabStructure form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="combat"><TabCombat form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="icon">
                        <IconGenerator
                          unitData={{
                            internalId: form.internalName,
                            displayName: form.displayName,
                            faction: form.faction,
                            category: form.category,
                            renderType: form.renderType,
                          }}
                          onIconReady={handleIconReady}
                          currentIcon={iconImageFile}
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Tabs defaultValue="general">
                      <TabsList className="w-full grid grid-cols-6 bg-secondary rounded-none border-b border-border">
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
                        <TabsTrigger value="icon" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                          <Wand2 className="w-3 h-3 mr-1" /> Icon
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="general"><TabGeneral form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="combat"><TabCombat form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="physics"><TabPhysics form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="art"><TabArt form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="voice"><TabVoice form={form} setForm={setForm} /></TabsContent>
                      <TabsContent value="icon">
                        <IconGenerator
                          unitData={{
                            internalId: form.internalName,
                            displayName: form.displayName,
                            faction: form.faction,
                            category: form.category,
                            renderType: form.renderType,
                          }}
                          onIconReady={handleIconReady}
                          currentIcon={iconImageFile}
                        />
                      </TabsContent>
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
                      {mintMutation.isPending ? 'MINTING...' : isStructure ? 'MINT STRUCTURE' : '✨ MINT UNIT'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
