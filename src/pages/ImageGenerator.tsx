import { useState, useCallback, useRef, DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, requireSupabase } from '@/integrations/supabase/client';
import { PPM_UNIT_PROMPTS, generateUnitPrompt, exportPromptsToText } from '@/lib/imagePrompts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  Loader2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://jentttucsvqmodbjrtqg.supabase.co';

type UploadStatus = 'uploading' | 'complete' | 'error';

interface PpmAsset {
  id: string;
  asset_code: string;
  name: string;
  faction: string | null;
  category: string | null;
  preview_image_url: string | null;
}

const ImageGenerator = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadStatus>>({});

  // Fetch PPM assets
  const { data: ppmAssets = [], isLoading } = useQuery({
    queryKey: ['ppm-assets-images'],
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client.from('ppm_assets').select('id, asset_code, name, faction, category, preview_image_url');
      if (error) throw error;
      return (data ?? []) as PpmAsset[];
    },
    enabled: isSupabaseConfigured,
  });

  // Also fetch custom units that might need images
  const { data: customUnits = [] } = useQuery({
    queryKey: ['custom-units-images'],
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client.from('custom_units').select('id, internal_name, name, faction, category');
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; internal_name: string; name: string; faction: string; category: string }>;
    },
    enabled: isSupabaseConfigured,
  });

  const withImages = ppmAssets.filter((u) => u.preview_image_url);
  const needImages = ppmAssets.filter((u) => !u.preview_image_url);

  // Export prompts to text file
  const handleExportPrompts = useCallback(() => {
    // Combine PPM prompts + dynamic prompts for custom units without images
    const customPrompts = customUnits
      .map((u) => ({
        unitId: u.internal_name.toUpperCase(),
        unitName: u.name,
        faction: u.faction,
        category: u.category,
        prompt: generateUnitPrompt({ name: u.name, faction: u.faction, category: u.category }),
      }));

    const allPrompts = [...PPM_UNIT_PROMPTS, ...customPrompts];
    const text = exportPromptsToText(allPrompts);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unit_image_prompts.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${allPrompts.length} prompts`);
  }, [customUnits]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const client = requireSupabase();
      const results: Array<{ unitId: string; status: 'success' | 'error' }> = [];

      for (const file of files) {
        const unitId = file.name.split('.')[0].toUpperCase();
        setUploadProgress((prev) => ({ ...prev, [unitId]: 'uploading' }));

        try {
          const fileName = `ppm/${unitId.toLowerCase()}.png`;
          const { error: uploadError } = await client.storage
            .from('asset-previews')
            .upload(fileName, file, { upsert: true, contentType: file.type });

          if (uploadError) throw uploadError;

          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/asset-previews/${fileName}`;

          // Try updating ppm_assets
          const { error: ppmError } = await client
            .from('ppm_assets')
            .update({ preview_image_url: publicUrl })
            .eq('asset_code', unitId);

          // Also try custom_units
          await client
            .from('custom_units')
            .update({ preview_image_url: publicUrl } as any)
            .eq('internal_name', unitId);

          if (ppmError) console.warn(`ppm_assets update for ${unitId}:`, ppmError);

          setUploadProgress((prev) => ({ ...prev, [unitId]: 'complete' }));
          results.push({ unitId, status: 'success' });
        } catch (err) {
          console.error(`Upload failed for ${unitId}:`, err);
          setUploadProgress((prev) => ({ ...prev, [unitId]: 'error' }));
          results.push({ unitId, status: 'error' });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const ok = results.filter((r) => r.status === 'success').length;
      const fail = results.filter((r) => r.status === 'error').length;
      if (ok > 0) toast.success(`${ok} image${ok > 1 ? 's' : ''} uploaded`);
      if (fail > 0) toast.error(`${fail} upload${fail > 1 ? 's' : ''} failed`);
      queryClient.invalidateQueries({ queryKey: ['ppm-assets-images'] });
      queryClient.invalidateQueries({ queryKey: ['custom-units-images'] });
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
    },
  });

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length === 0) {
        toast.error('No image files found');
        return;
      }
      uploadMutation.mutate(imageFiles);
    },
    [uploadMutation]
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const completedCount = Object.values(uploadProgress).filter((s) => s === 'complete').length;
  const errorCount = Object.values(uploadProgress).filter((s) => s === 'error').length;
  const isUploading = uploadMutation.isPending;

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
            IMAGE GENERATOR
          </h1>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {withImages.length}/{ppmAssets.length} images
        </Badge>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Total Units</p>
                <p className="text-2xl font-display">{ppmAssets.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-mutant-green shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">With Images</p>
                <p className="text-2xl font-display text-mutant-green">{withImages.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-modded-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Need Images</p>
                <p className="text-2xl font-display text-modded-gold">{needImages.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="upload" className="font-display text-xs data-[state=active]:bg-card">
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="prompts" className="font-display text-xs data-[state=active]:bg-card">
              AI Prompts
            </TabsTrigger>
            <TabsTrigger value="status" className="font-display text-xs data-[state=active]:bg-card">
              Unit Status
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    DRAG & DROP IMAGES
                  </span>
                  <Button variant="outline" size="sm" className="border-border gap-1.5" onClick={handleExportPrompts}>
                    <Download className="w-3.5 h-3.5" />
                    Export Prompts
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instructions */}
                <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-md bg-secondary/50 border border-border">
                  <p>1. Click <strong>Export Prompts</strong> to download AI image prompts</p>
                  <p>2. Generate images using DALL-E, Midjourney, or similar</p>
                  <p>3. Name files to match unit IDs: <code className="text-primary">zombie.png</code>, <code className="text-primary">hgrunt.png</code>, etc.</p>
                  <p>4. Drag & drop all images below</p>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                  />
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="font-display text-sm">
                    {isDragging ? 'Drop images here...' : 'Drag & Drop Unit Images'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Or click to browse — PNG, JPG, GIF accepted
                  </p>
                </div>

                {/* Upload progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Upload Progress</span>
                      <div className="flex gap-2">
                        {completedCount > 0 && (
                          <Badge className="bg-mutant-green/20 text-mutant-green border-mutant-green/50">
                            {completedCount} done
                          </Badge>
                        )}
                        {errorCount > 0 && (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/50">
                            {errorCount} failed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-border border border-border rounded-md">
                      {Object.entries(uploadProgress).map(([unitId, status]) => (
                        <div key={unitId} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-mono">{unitId}</span>
                          <div className="flex items-center gap-1.5">
                            {status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                            {status === 'complete' && <CheckCircle className="w-3 h-3 text-mutant-green" />}
                            {status === 'error' && <XCircle className="w-3 h-3 text-destructive" />}
                            <span className="text-muted-foreground">{status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File naming guide */}
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-display">FILE NAMING GUIDE</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 font-mono">
                    {PPM_UNIT_PROMPTS.map((u) => (
                      <span key={u.unitId} className="text-muted-foreground">
                        <span className="text-primary">{u.unitId.toLowerCase()}.png</span> → {u.unitName}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="border-border gap-1.5" onClick={handleExportPrompts}>
                <Download className="w-3.5 h-3.5" />
                Download All Prompts
              </Button>
            </div>
            {PPM_UNIT_PROMPTS.map((p) => (
              <Card key={p.unitId} className="border-border bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{p.unitId}</Badge>
                      <span className="text-sm font-medium">{p.unitName}</span>
                      <Badge
                        className={
                          p.faction === 'GDI'
                            ? 'bg-gdi-blue/20 text-gdi-blue border-gdi-blue/50'
                            : p.faction === 'Nod'
                            ? 'bg-nod-red/20 text-nod-red border-nod-red/50'
                            : 'bg-mutant-green/20 text-mutant-green border-mutant-green/50'
                        }
                      >
                        {p.faction}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => {
                        navigator.clipboard.writeText(p.prompt);
                        toast.success(`Copied prompt for ${p.unitName}`);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.prompt}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">UNIT IMAGE STATUS</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {ppmAssets.map((unit) => (
                      <div key={unit.id} className="text-center space-y-2">
                        <div className="aspect-square rounded-md bg-secondary/50 border border-border overflow-hidden flex items-center justify-center">
                          {unit.preview_image_url ? (
                            <img
                              src={unit.preview_image_url}
                              alt={unit.name}
                              className="w-full h-full object-contain rendering-pixelated"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-xs">{unit.asset_code}</p>
                          <p className="text-xs text-muted-foreground truncate">{unit.name}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            unit.preview_image_url
                              ? 'bg-mutant-green/10 text-mutant-green border-mutant-green/30 text-[10px]'
                              : 'bg-modded-gold/10 text-modded-gold border-modded-gold/30 text-[10px]'
                          }
                        >
                          {unit.preview_image_url ? '✓ Has Image' : '⚠ Needs Image'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ImageGenerator;
