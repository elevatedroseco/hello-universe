import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Wand2, Copy, Upload, ImageIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateUnitPrompt } from '@/lib/imagePrompts';

interface IconGeneratorProps {
  unitData: {
    internalId: string;
    displayName: string;
    faction: string;
    category: string;
    renderType: 'SHP' | 'VOXEL';
  };
  onIconReady: (file: File) => void;
  currentIcon?: File | null;
}

export const IconGenerator = ({ unitData, onIconReady, currentIcon }: IconGeneratorProps) => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const prompt = generateUnitPrompt({
      name: unitData.displayName || unitData.internalId,
      faction: unitData.faction,
      category: unitData.category,
    });
    setGeneratedPrompt(prompt);
  }, [unitData.displayName, unitData.faction, unitData.category, unitData.internalId]);

  useEffect(() => {
    if (currentIcon) {
      setPreviewUrl(URL.createObjectURL(currentIcon));
    }
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [currentIcon]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(useCustom ? customPrompt : generatedPrompt);
    toast.success('Prompt copied to clipboard!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onIconReady(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success('Icon image uploaded!');
    }
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">
        AI Icon Generation
      </p>

      {/* Generated Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-display">Suggested AI Prompt</Label>
          <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="gap-1.5 border-border">
            <Copy className="w-3 h-3" /> Copy
          </Button>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground border border-border leading-relaxed">
          {useCustom ? customPrompt || 'Enter a custom prompt below...' : generatedPrompt}
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-border bg-card/30">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Wand2 className="w-4 h-4 text-modded-gold mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">How to use:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Copy the prompt above</li>
                <li>Paste into ChatGPT, DALL-E, or Midjourney</li>
                <li>Generate image (1024×1024 recommended)</li>
                <li>Upload the result below</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Prompt Toggle */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-custom-prompt"
            checked={useCustom}
            onCheckedChange={(v) => setUseCustom(!!v)}
            className="data-[state=checked]:bg-modded-gold data-[state=checked]:border-modded-gold"
          />
          <Label htmlFor="use-custom-prompt" className="text-sm cursor-pointer">Use custom prompt</Label>
        </div>
        {useCustom && (
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Write your custom image generation prompt..."
            className="min-h-[80px] bg-secondary border-border"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">
        Upload Icon
      </p>

      {/* Upload Area + Preview */}
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-modded-gold/50 transition-colors relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-display text-foreground">Upload Generated Icon</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or GIF</p>
        </div>

        {previewUrl && (
          <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-secondary flex items-center justify-center relative">
            <img src={previewUrl} alt="Icon preview" className="w-full h-full object-cover" />
            <CheckCircle className="absolute bottom-1 right-1 w-4 h-4 text-mutant-green" />
          </div>
        )}
      </div>

      {currentIcon && (
        <Badge className="bg-mutant-green/20 text-mutant-green border-mutant-green/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          {currentIcon.name}
        </Badge>
      )}
    </div>
  );
};
