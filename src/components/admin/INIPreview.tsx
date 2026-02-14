import { Code } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TS_LOCOMOTORS, TS_VOICE_SETS } from '@/data/tsWeapons';
import type { UnitForm } from './types';

interface INIPreviewProps {
  form: UnitForm;
}

function generatePreview(form: UnitForm): string {
  const loco = TS_LOCOMOTORS.find((l) => l.id === form.locomotor)?.guid || '';
  const cameoId = (form.internalName.substring(0, 4) + 'ICON').toUpperCase();
  const isVoxel = form.renderType === 'VOXEL';
  const listType = form.category === 'Infantry'
    ? 'InfantryTypes'
    : form.category === 'Aircraft'
      ? 'AircraftTypes'
      : 'VehicleTypes';

  const rulesSection = `; Preview — what will be added to rules.ini
; ================================================

[${listType}]
XX=${form.internalName || 'MYUNIT'}

[${form.internalName || 'MYUNIT'}]
Name=${form.displayName || 'My Unit'}
Cost=${form.cost}
Strength=${form.strength}
Armor=${form.armor}
TechLevel=${form.techLevel}
Speed=${form.speed}
Sight=${form.sight}
Primary=${form.primaryWeapon}${form.eliteWeapon ? '\nElite=' + form.eliteWeapon : ''}
ROT=${form.rof}
Range=${form.range}
Prerequisite=${form.prerequisite}
Locomotor=${loco}
Owner=${form.faction}
Image=${form.internalName || 'MYUNIT'}
Points=${form.points}
Crushable=${form.crushable ? 'yes' : 'no'}${form.cloakable ? '\nCloakable=yes' : ''}${form.sensors ? '\nSensors=yes' : ''}${form.fearless ? '\nFearless=yes' : ''}${form.tiberiumHeal ? '\nTiberiumHeal=yes' : ''}${isVoxel && form.hasTurret ? '\nTurret=yes' : ''}
VoiceSelect=${form.voiceSelect}
VoiceMove=${form.voiceMove}
VoiceAttack=${form.voiceAttack}`;

  const artSection = isVoxel
    ? `
; ================================================
; art.ini addition:

[${form.internalName || 'MYUNIT'}]
Voxel=yes
Remapable=yes
Shadow=yes
Normalized=yes
Cameo=${cameoId}
PrimaryFireFLH=${form.primaryFireFLH}
SecondaryFireFLH=${form.secondaryFireFLH}${form.hasTurret ? '\nTurret=yes\nTurretOffset=' + form.turretOffset : ''}
`
    : `
; ================================================
; art.ini addition:

[${form.internalName || 'MYUNIT'}]
Image=${form.internalName || 'MYUNIT'}
Cameo=${cameoId}${form.category === 'Infantry' ? '\nSequence=' + form.sequence : ''}
`;

  return rulesSection + artSection;
}

export const INIPreview = ({ form }: INIPreviewProps) => {
  return (
    <Collapsible className="border-t border-border">
      <CollapsibleTrigger className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Code className="w-3 h-3" />
        Preview rules.ini output
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="bg-[hsl(222,47%,4%)] text-green-400 font-mono text-xs p-4 overflow-auto max-h-64 mx-4 mb-4 rounded">
          {generatePreview(form)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
};
