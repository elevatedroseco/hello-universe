import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Crosshair,
  Plus,
  Save,
  Trash2,
  Loader2,
  Shield,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────

export interface CustomWeapon {
  id: string;
  weaponId: string;
  name: string;
  damage: number;
  rof: number;
  range: number;
  projectile: string;
  speed: number;
  warheadId: string;
  report: string;
  anim: string;
}

export interface CustomWarhead {
  id: string;
  warheadId: string;
  name: string;
  verses: string;
  spread: number;
  wall: boolean;
  wood: boolean;
  infDeath: number;
}

const DEFAULT_WEAPON: Omit<CustomWeapon, 'id'> = {
  weaponId: '',
  name: '',
  damage: 25,
  rof: 50,
  range: 5,
  projectile: 'Invisible',
  speed: 100,
  warheadId: '',
  report: '',
  anim: '',
};

const DEFAULT_WARHEAD: Omit<CustomWarhead, 'id'> = {
  warheadId: '',
  name: '',
  verses: '100%,100%,100%,100%,100%',
  spread: 1,
  wall: false,
  wood: false,
  infDeath: 0,
};

const PROJECTILES = ['Invisible', 'Cannon', 'HeatSeeker', 'Lobbed', 'AAHeatSeeker', 'Laser', 'ElectricBolt'];
const INF_DEATHS = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Burn' },
  { value: 2, label: 'Explode' },
  { value: 3, label: 'Headshot' },
  { value: 4, label: 'Electro' },
  { value: 5, label: 'Melt' },
];

// ─── Persistence (localStorage for now, can be migrated to Supabase) ──────

function loadWeapons(): CustomWeapon[] {
  try {
    return JSON.parse(localStorage.getItem('ts_custom_weapons') || '[]');
  } catch { return []; }
}

function saveWeapons(weapons: CustomWeapon[]) {
  localStorage.setItem('ts_custom_weapons', JSON.stringify(weapons));
}

function loadWarheads(): CustomWarhead[] {
  try {
    return JSON.parse(localStorage.getItem('ts_custom_warheads') || '[]');
  } catch { return []; }
}

function saveWarheads(warheads: CustomWarhead[]) {
  localStorage.setItem('ts_custom_warheads', JSON.stringify(warheads));
}

// ─── Component ──────────────────────────────────────────

const WeaponEditor = () => {
  const [tab, setTab] = useState<'weapons' | 'warheads'>('weapons');

  // Weapons
  const [weapons, setWeapons] = useState<CustomWeapon[]>(loadWeapons);
  const [editWeapon, setEditWeapon] = useState<CustomWeapon | null>(null);
  const [weaponForm, setWeaponForm] = useState<Omit<CustomWeapon, 'id'>>(DEFAULT_WEAPON);

  // Warheads
  const [warheads, setWarheads] = useState<CustomWarhead[]>(loadWarheads);
  const [editWarhead, setEditWarhead] = useState<CustomWarhead | null>(null);
  const [warheadForm, setWarheadForm] = useState<Omit<CustomWarhead, 'id'>>(DEFAULT_WARHEAD);

  useEffect(() => { saveWeapons(weapons); }, [weapons]);
  useEffect(() => { saveWarheads(warheads); }, [warheads]);

  // ─── Weapon CRUD ───
  const handleSaveWeapon = () => {
    if (!weaponForm.weaponId || !weaponForm.name) {
      toast.error('Weapon ID and Name are required');
      return;
    }
    if (!/^[A-Z0-9]{1,8}$/i.test(weaponForm.weaponId)) {
      toast.error('Weapon ID must be A-Z0-9, max 8 chars');
      return;
    }

    if (editWeapon) {
      setWeapons(prev => prev.map(w => w.id === editWeapon.id ? { ...weaponForm, id: editWeapon.id } : w));
      toast.success(`Updated ${weaponForm.name}`);
    } else {
      const newWeapon: CustomWeapon = { ...weaponForm, id: crypto.randomUUID() };
      setWeapons(prev => [...prev, newWeapon]);
      toast.success(`Created ${weaponForm.name}`);
    }
    setEditWeapon(null);
    setWeaponForm(DEFAULT_WEAPON);
  };

  const handleDeleteWeapon = (id: string) => {
    setWeapons(prev => prev.filter(w => w.id !== id));
    if (editWeapon?.id === id) {
      setEditWeapon(null);
      setWeaponForm(DEFAULT_WEAPON);
    }
    toast.success('Weapon deleted');
  };

  const handleEditWeapon = (w: CustomWeapon) => {
    setEditWeapon(w);
    setWeaponForm({ weaponId: w.weaponId, name: w.name, damage: w.damage, rof: w.rof, range: w.range, projectile: w.projectile, speed: w.speed, warheadId: w.warheadId, report: w.report, anim: w.anim });
  };

  // ─── Warhead CRUD ───
  const handleSaveWarhead = () => {
    if (!warheadForm.warheadId || !warheadForm.name) {
      toast.error('Warhead ID and Name are required');
      return;
    }
    if (!/^[A-Z0-9]{1,8}$/i.test(warheadForm.warheadId)) {
      toast.error('Warhead ID must be A-Z0-9, max 8 chars');
      return;
    }

    if (editWarhead) {
      setWarheads(prev => prev.map(w => w.id === editWarhead.id ? { ...warheadForm, id: editWarhead.id } : w));
      toast.success(`Updated ${warheadForm.name}`);
    } else {
      const newWarhead: CustomWarhead = { ...warheadForm, id: crypto.randomUUID() };
      setWarheads(prev => [...prev, newWarhead]);
      toast.success(`Created ${warheadForm.name}`);
    }
    setEditWarhead(null);
    setWarheadForm(DEFAULT_WARHEAD);
  };

  const handleDeleteWarhead = (id: string) => {
    setWarheads(prev => prev.filter(w => w.id !== id));
    if (editWarhead?.id === id) {
      setEditWarhead(null);
      setWarheadForm(DEFAULT_WARHEAD);
    }
    toast.success('Warhead deleted');
  };

  const handleEditWarhead = (w: CustomWarhead) => {
    setEditWarhead(w);
    setWarheadForm({ warheadId: w.warheadId, name: w.name, verses: w.verses, spread: w.spread, wall: w.wall, wood: w.wood, infDeath: w.infDeath });
  };

  // ─── INI Preview ───
  const iniPreview = () => {
    let ini = '';
    for (const w of weapons) {
      ini += `[${w.weaponId.toUpperCase()}]\n`;
      ini += `Damage=${w.damage}\n`;
      ini += `ROF=${w.rof}\n`;
      ini += `Range=${w.range}\n`;
      ini += `Projectile=${w.projectile}\n`;
      ini += `Speed=${w.speed}\n`;
      if (w.warheadId) ini += `Warhead=${w.warheadId.toUpperCase()}\n`;
      if (w.report) ini += `Report=${w.report}\n`;
      if (w.anim) ini += `Anim=${w.anim}\n`;
      ini += '\n';
    }
    for (const wh of warheads) {
      ini += `[${wh.warheadId.toUpperCase()}]\n`;
      ini += `Verses=${wh.verses}\n`;
      ini += `Spread=${wh.spread}\n`;
      ini += `Wall=${wh.wall ? 'yes' : 'no'}\n`;
      ini += `Wood=${wh.wood ? 'yes' : 'no'}\n`;
      ini += `InfDeath=${wh.infDeath}\n`;
      ini += '\n';
    }
    return ini || '; No weapons or warheads defined yet.';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-primary" />
            WEAPON FORGE
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="font-mono text-xs">{weapons.length} weapons</Badge>
          <Badge variant="outline" className="font-mono text-xs">{warheads.length} warheads</Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Tab Switcher */}
        <div className="flex gap-2">
          <Button
            variant={tab === 'weapons' ? 'default' : 'outline'}
            onClick={() => setTab('weapons')}
            className="font-display text-xs"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Weapons
          </Button>
          <Button
            variant={tab === 'warheads' ? 'default' : 'outline'}
            onClick={() => setTab('warheads')}
            className="font-display text-xs"
          >
            <Shield className="w-4 h-4 mr-1.5" />
            Warheads
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── LEFT: List ─── */}
          {tab === 'weapons' ? (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display text-sm">WEAPONS</CardTitle>
                <Button size="sm" onClick={() => { setEditWeapon(null); setWeaponForm(DEFAULT_WEAPON); }}>
                  <Plus className="w-3 h-3 mr-1" /> New
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">DMG</TableHead>
                      <TableHead className="text-xs">ROF</TableHead>
                      <TableHead className="text-xs w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weapons.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">No weapons yet. Create one!</TableCell></TableRow>
                    ) : weapons.map(w => (
                      <TableRow key={w.id} className={`border-border cursor-pointer ${editWeapon?.id === w.id ? 'bg-primary/10' : ''}`} onClick={() => handleEditWeapon(w)}>
                        <TableCell className="font-mono text-xs">{w.weaponId}</TableCell>
                        <TableCell className="text-sm">{w.name}</TableCell>
                        <TableCell className="text-sm text-destructive">{w.damage}</TableCell>
                        <TableCell className="text-sm">{w.rof}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteWeapon(w.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display text-sm">WARHEADS</CardTitle>
                <Button size="sm" onClick={() => { setEditWarhead(null); setWarheadForm(DEFAULT_WARHEAD); }}>
                  <Plus className="w-3 h-3 mr-1" /> New
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Verses</TableHead>
                      <TableHead className="text-xs w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warheads.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">No warheads yet. Create one!</TableCell></TableRow>
                    ) : warheads.map(wh => (
                      <TableRow key={wh.id} className={`border-border cursor-pointer ${editWarhead?.id === wh.id ? 'bg-primary/10' : ''}`} onClick={() => handleEditWarhead(wh)}>
                        <TableCell className="font-mono text-xs">{wh.warheadId}</TableCell>
                        <TableCell className="text-sm">{wh.name}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[120px]">{wh.verses}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteWarhead(wh.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ─── RIGHT: Form ─── */}
          {tab === 'weapons' ? (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">
                  {editWeapon ? `EDIT: ${editWeapon.name}` : 'NEW WEAPON'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Weapon ID (max 8 chars)</Label>
                    <Input value={weaponForm.weaponId} onChange={e => setWeaponForm(f => ({ ...f, weaponId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) }))} placeholder="LASER1" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Name</Label>
                    <Input value={weaponForm.name} onChange={e => setWeaponForm(f => ({ ...f, name: e.target.value }))} placeholder="Laser Cannon" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Damage</Label>
                    <span className="text-xs font-mono text-destructive">{weaponForm.damage}</span>
                  </div>
                  <Slider value={[weaponForm.damage]} onValueChange={([v]) => setWeaponForm(f => ({ ...f, damage: v }))} min={1} max={500} step={1} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Rate of Fire (lower = faster)</Label>
                    <span className="text-xs font-mono">{weaponForm.rof}</span>
                  </div>
                  <Slider value={[weaponForm.rof]} onValueChange={([v]) => setWeaponForm(f => ({ ...f, rof: v }))} min={1} max={200} step={1} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Range (cells)</Label>
                    <Input type="number" value={weaponForm.range} onChange={e => setWeaponForm(f => ({ ...f, range: Number(e.target.value) }))} min={1} max={30} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Projectile Speed</Label>
                    <Input type="number" value={weaponForm.speed} onChange={e => setWeaponForm(f => ({ ...f, speed: Number(e.target.value) }))} min={1} max={255} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Projectile Type</Label>
                  <Select value={weaponForm.projectile} onValueChange={v => setWeaponForm(f => ({ ...f, projectile: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECTILES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Warhead</Label>
                  <Select value={weaponForm.warheadId} onValueChange={v => setWeaponForm(f => ({ ...f, warheadId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select warhead" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (use default)</SelectItem>
                      {warheads.map(wh => <SelectItem key={wh.id} value={wh.warheadId}>{wh.name} ({wh.warheadId})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sound Report</Label>
                    <Input value={weaponForm.report} onChange={e => setWeaponForm(f => ({ ...f, report: e.target.value }))} placeholder="e.g. GunFire" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Muzzle Anim</Label>
                    <Input value={weaponForm.anim} onChange={e => setWeaponForm(f => ({ ...f, anim: e.target.value }))} placeholder="e.g. GUNFIRE" />
                  </div>
                </div>

                <Button onClick={handleSaveWeapon} className="w-full font-display">
                  <Save className="w-4 h-4 mr-1.5" />
                  {editWeapon ? 'Update Weapon' : 'Save Weapon'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">
                  {editWarhead ? `EDIT: ${editWarhead.name}` : 'NEW WARHEAD'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Warhead ID (max 8 chars)</Label>
                    <Input value={warheadForm.warheadId} onChange={e => setWarheadForm(f => ({ ...f, warheadId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) }))} placeholder="LASERWH" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Name</Label>
                    <Input value={warheadForm.name} onChange={e => setWarheadForm(f => ({ ...f, name: e.target.value }))} placeholder="Laser Warhead" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Verses (armor effectiveness %)</Label>
                  <Input value={warheadForm.verses} onChange={e => setWarheadForm(f => ({ ...f, verses: e.target.value }))} placeholder="100%,100%,100%,100%,100%" className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground">Order: None, Flak, Plate, Light, Medium, Heavy, Wood, Steel, Concrete, Special_1, Special_2</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Spread (cell radius)</Label>
                    <span className="text-xs font-mono">{warheadForm.spread}</span>
                  </div>
                  <Slider value={[warheadForm.spread]} onValueChange={([v]) => setWarheadForm(f => ({ ...f, spread: v }))} min={1} max={10} step={1} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Infantry Death Animation</Label>
                  <Select value={String(warheadForm.infDeath)} onValueChange={v => setWarheadForm(f => ({ ...f, infDeath: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INF_DEATHS.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label} ({d.value})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={warheadForm.wall} onCheckedChange={v => setWarheadForm(f => ({ ...f, wall: v }))} />
                    <Label className="text-xs">Damages Walls</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={warheadForm.wood} onCheckedChange={v => setWarheadForm(f => ({ ...f, wood: v }))} />
                    <Label className="text-xs">Damages Trees</Label>
                  </div>
                </div>

                <Button onClick={handleSaveWarhead} className="w-full font-display">
                  <Save className="w-4 h-4 mr-1.5" />
                  {editWarhead ? 'Update Warhead' : 'Save Warhead'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* INI Preview */}
        {(weapons.length > 0 || warheads.length > 0) && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-primary" />
                RULES.INI PREVIEW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="font-mono text-xs text-green-400 bg-black/50 p-4 rounded-md overflow-auto max-h-80 whitespace-pre-wrap">
                {iniPreview()}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeaponEditor;
