import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured, requireSupabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings2, Swords, Gauge, ImageIcon, Volume2, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TabGeneral } from '@/components/admin/tabs/TabGeneral';
import { TabCombat } from '@/components/admin/tabs/TabCombat';
import { TabPhysics } from '@/components/admin/tabs/TabPhysics';
import { TabArt } from '@/components/admin/tabs/TabArt';
import { TabVoice } from '@/components/admin/tabs/TabVoice';
import { INIPreview } from '@/components/admin/INIPreview';
import { UnitForm, DEFAULT_FORM } from '@/components/admin/types';
import { TS_LOCOMOTORS } from '@/data/tsWeapons';

const AdminForge = () => {
  const [form, setForm] = useState<UnitForm>({ ...DEFAULT_FORM });
  const queryClient = useQueryClient();

  const mintMutation = useMutation({
    mutationFn: async (formData: UnitForm) => {
      const client = requireSupabase();

      let shpFilePath: string | null = null;
      let iconFilePath: string | null = null;

      // Upload sprite SHP
      if (formData.spriteFile) {
        const fileName = `${formData.internalName.toLowerCase()}_${Date.now()}.shp`;
        const filePath = `units/${fileName}`;
        const { error } = await client.storage.from('user_assets').upload(filePath, formData.spriteFile, { upsert: true });
        if (error) throw error;
        shpFilePath = filePath;
      }

      // Upload icon SHP
      if (formData.iconFile) {
        const iconName = `${formData.internalName.toLowerCase()}_icon_${Date.now()}.shp`;
        const iconPath = `units/${iconName}`;
        const { error } = await client.storage.from('user_assets').upload(iconPath, formData.iconFile, { upsert: true });
        if (error) throw error;
        iconFilePath = iconPath;
      }

      const locoGuid = TS_LOCOMOTORS.find((l) => l.id === formData.locomotor)?.guid || '';
      const cameoId = (formData.internalName.substring(0, 4) + 'ICON').toUpperCase();

      const rulesJson = {
        Category: formData.category,
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

      const artJson = {
        Image: formData.internalName,
        Cameo: cameoId,
        Sequence: formData.category === 'Infantry' ? formData.sequence : undefined,
      };

      const { data, error } = await client
        .from('custom_units')
        .insert({
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
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
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
    mintMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-modded-gold" />
            UNIT FORGE
          </h1>
        </div>
        {!isSupabaseConfigured && (
          <span className="text-xs text-destructive font-mono">⚠️ Backend not connected</span>
        )}
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Tabs */}
          <Tabs defaultValue="general">
            <TabsList className="w-full grid grid-cols-5 bg-secondary rounded-none border-b border-border">
              <TabsTrigger value="general" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                <Settings2 className="w-3 h-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="combat" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                <Swords className="w-3 h-3 mr-1" />
                Combat
              </TabsTrigger>
              <TabsTrigger value="physics" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                <Gauge className="w-3 h-3 mr-1" />
                Physics
              </TabsTrigger>
              <TabsTrigger value="art" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                <ImageIcon className="w-3 h-3 mr-1" />
                Art
              </TabsTrigger>
              <TabsTrigger value="voice" className="font-display text-xs data-[state=active]:bg-card data-[state=active]:text-foreground rounded-none">
                <Volume2 className="w-3 h-3 mr-1" />
                Voice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general"><TabGeneral form={form} setForm={setForm} /></TabsContent>
            <TabsContent value="combat"><TabCombat form={form} setForm={setForm} /></TabsContent>
            <TabsContent value="physics"><TabPhysics form={form} setForm={setForm} /></TabsContent>
            <TabsContent value="art"><TabArt form={form} setForm={setForm} /></TabsContent>
            <TabsContent value="voice"><TabVoice form={form} setForm={setForm} /></TabsContent>
          </Tabs>

          {/* INI Preview */}
          <INIPreview form={form} />

          {/* Mint Button */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleMint}
              disabled={mintMutation.isPending || !form.internalName || !form.displayName}
              className="w-full bg-modded-gold hover:bg-modded-gold-glow text-black font-display text-sm h-12"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {mintMutation.isPending ? 'MINTING...' : 'MINT UNIT'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForge;
