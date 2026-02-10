import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TS_VOICE_SETS } from '@/data/tsWeapons';
import { cn } from '@/lib/utils';
import { Volume2, Copy } from 'lucide-react';
import type { UnitForm } from '../types';

interface TabVoiceProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

export const TabVoice = ({ form, setForm }: TabVoiceProps) => {
  const updateField = <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const voiceCategory = TS_VOICE_SETS['Infantry'] || {};
  const presetKeys = Object.keys(voiceCategory);

  const handlePresetChange = (presetId: string) => {
    updateField('voicePreset', presetId);
    if (presetId !== 'custom') {
      const preset = voiceCategory[presetId];
      if (preset) {
        setForm((prev) => ({
          ...prev,
          voicePreset: presetId,
          voiceSelect: preset.Select,
          voiceMove: preset.Move,
          voiceAttack: preset.Attack,
          voiceFeedback: preset.Feedback,
        }));
      }
    }
  };

  const copyFromPreset = (field: keyof UnitForm, presetField: 'Select' | 'Move' | 'Attack' | 'Feedback') => {
    const preset = voiceCategory[form.voicePreset];
    if (preset) {
      updateField(field, preset[presetField]);
    }
  };

  const isCustom = form.voicePreset === 'custom';

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">Voice Preset</p>

      <RadioGroup
        value={form.voicePreset}
        onValueChange={handlePresetChange}
        className="space-y-2"
      >
        {presetKeys.map((key) => (
          <div key={key} className="flex items-center">
            <RadioGroupItem value={key} id={`voice-${key}`} className="sr-only" />
            <Label
              htmlFor={`voice-${key}`}
              className={cn(
                'w-full px-3 py-2 rounded-md cursor-pointer transition-all border text-sm flex items-center gap-2',
                form.voicePreset === key
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-secondary border-border hover:border-primary/50'
              )}
            >
              <Volume2 className="w-4 h-4" />
              {voiceCategory[key].label}
            </Label>
          </div>
        ))}
        <div className="flex items-center">
          <RadioGroupItem value="custom" id="voice-custom" className="sr-only" />
          <Label
            htmlFor="voice-custom"
            className={cn(
              'w-full px-3 py-2 rounded-md cursor-pointer transition-all border text-sm flex items-center gap-2',
              isCustom
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-secondary border-border hover:border-primary/50'
            )}
          >
            <Volume2 className="w-4 h-4" />
            Custom
          </Label>
        </div>
      </RadioGroup>

      {isCustom && (
        <div className="space-y-3 pt-2">
          {([
            { field: 'voiceSelect' as const, label: 'VoiceSelect', preset: 'Select' as const },
            { field: 'voiceMove' as const, label: 'VoiceMove', preset: 'Move' as const },
            { field: 'voiceAttack' as const, label: 'VoiceAttack', preset: 'Attack' as const },
            { field: 'voiceFeedback' as const, label: 'VoiceFeedback', preset: 'Feedback' as const },
          ]).map(({ field, label, preset }) => (
            <div key={field} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-mono">{label}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => copyFromPreset(field, preset)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy from preset
                </Button>
              </div>
              <Input
                value={form[field] as string}
                onChange={(e) => updateField(field, e.target.value)}
                placeholder="Comma-separated sound IDs"
                className="font-mono text-xs bg-secondary border-border"
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-secondary/50 rounded-md p-3 mt-4">
        <p className="text-xs text-muted-foreground">
          Voice IDs reference audio entries in the game's sound.ini.
          Using standard presets ensures compatibility.
          Only change these if you have custom audio files.
        </p>
      </div>
    </div>
  );
};
