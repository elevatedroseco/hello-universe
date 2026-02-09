import { useState, forwardRef } from 'react';
import { Unit, CustomUnit } from '@/types/units';
import { useUnitSelection } from '@/store/useUnitSelection';
import { useImageLoader } from '@/hooks/useImageLoader';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Zap, Shield, Gauge, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Supabase project URL for storage
const SUPABASE_URL = 'https://jentttucsvqmodbjrtqg.supabase.co';

/**
 * Get the public URL(s) for a unit's preview image based on storage bucket.
 * Returns primary and fallback URLs for multi-layer loading.
 */
function getPreviewImageUrls(unit: Unit): { primary?: string; fallback?: string } {
  // If unit already has an imageUrl or previewImageUrl, use that
  if (unit.imageUrl) return { primary: unit.imageUrl };
  
  // For custom units, check if we have a preview image or can derive from shp path
  if (unit.type === 'custom') {
    const customUnit = unit as CustomUnit;
    if (customUnit.previewImageUrl) return { primary: customUnit.previewImageUrl };
    
    // If we have an shp file path, try to find a matching preview image
    if (customUnit.shpFilePath) {
      const isPpmAsset = customUnit.shpFilePath.toLowerCase().startsWith('ppm/');
      
      if (isPpmAsset) {
        // PPM assets: clean up the path - remove any existing extension first
        const basePath = customUnit.shpFilePath
          .toLowerCase()
          .replace(/\.(shp|png)$/i, ''); // Remove .shp OR .png extension
        const primaryUrl = `${SUPABASE_URL}/storage/v1/object/public/asset-previews/${basePath}.png`;
        // Fallback: try original path as-is (in case it's already a valid file)
        const fallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/asset-previews/${customUnit.shpFilePath.toLowerCase()}`;
        return { primary: primaryUrl, fallback: fallbackUrl };
      } else {
        // User uploads: clean path to avoid double bucket prefixes
        const cleanPath = customUnit.shpFilePath
          .replace(/^user_assets\//, '') // Remove leading bucket name if present
          .replace(/\.(shp|png)$/i, ''); // Remove extension
        return { primary: `${SUPABASE_URL}/storage/v1/object/public/user_assets/${cleanPath}.png` };
      }
    }
  }
  
  // For default units, map internal name to asset-previews bucket
  if (unit.type === 'default') {
    const internalName = unit.internalName.toLowerCase();
    return {
      primary: `${SUPABASE_URL}/storage/v1/object/public/asset-previews/ppm/${internalName}.png`
    };
  }
  
  return {};
}

interface UnitCardProps {
  unit: Unit;
  onEdit?: (unit: Unit) => void;
  hasOverride?: boolean; // True if this default unit has a custom override
}

export const UnitCard = forwardRef<HTMLDivElement, UnitCardProps>(
  ({ unit, onEdit, hasOverride = false }, ref) => {
  const { selectedUnitIds, toggleSelection, activeFaction } = useUnitSelection();
  const isSelected = selectedUnitIds.has(unit.id);
  const isCustom = unit.type === 'custom';
  const { primary: primaryUrl, fallback: fallbackUrl } = getPreviewImageUrls(unit);
  const { objectUrl, isLoading: imageLoading, error: imageError } = useImageLoader(primaryUrl, fallbackUrl);
  const [isHovered, setIsHovered] = useState(false);

  const factionColorClass = 
    activeFaction === 'GDI' ? 'card-gdi' :
    activeFaction === 'Nod' ? 'card-nod' :
    'card-mutant';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative rounded-lg bg-card p-4 transition-all duration-300',
        isCustom ? 'card-modded' : factionColorClass,
        isCustom && isSelected && 'glow-modded',
        !isCustom && isSelected && (
          activeFaction === 'GDI' ? 'glow-gdi' :
          activeFaction === 'Nod' ? 'glow-nod' :
          'glow-mutant'
        ),
        hasOverride && 'opacity-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Modded Badge */}
      {isCustom && (
        <Badge 
          className="absolute -top-2 -right-2 bg-modded-gold text-modded-gold-foreground border-none z-20"
        >
          <Star className="w-3 h-3 mr-1" />
          MODDED
        </Badge>
      )}

      {/* Override indicator for default units that have a custom override */}
      {hasOverride && (
        <Badge 
          className="absolute -top-2 -right-2 bg-muted text-muted-foreground border-none z-20"
        >
          OVERRIDDEN
        </Badge>
      )}

      {/* Edit Button (Gear Icon) - Shows on hover */}
      {isHovered && onEdit && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 w-7 h-7 z-20 opacity-90 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(unit);
          }}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      )}

      {/* Checkbox for custom units - always visible */}
      {isCustom && (
        <div className="absolute top-3 left-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelection(unit.id)}
            onClick={(e) => e.stopPropagation()}
            className="border-modded-gold data-[state=checked]:bg-modded-gold data-[state=checked]:border-modded-gold"
          />
        </div>
      )}

      {/* Unit Image Placeholder */}
      <div className="aspect-square mb-3 rounded-md bg-secondary/50 flex items-center justify-center overflow-hidden relative">
        {objectUrl && !imageError && (
          <img 
            src={objectUrl} 
            alt={unit.displayName}
            className="absolute inset-0 w-full h-full object-contain z-10 rendering-pixelated"
          />
        )}
        {/* Fallback text - show when no image, loading, or error */}
        {(!objectUrl || imageLoading || imageError) && (
          <div className={cn(
            'text-4xl font-display font-bold',
            isCustom ? 'text-modded-gold' :
            activeFaction === 'GDI' ? 'text-gdi-blue' :
            activeFaction === 'Nod' ? 'text-nod-red' :
            'text-mutant-green'
          )}>
            {unit.internalName.substring(0, 2)}
          </div>
        )}
      </div>

      {/* Unit Info */}
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground font-mono-stats uppercase">
            {unit.internalName}
          </p>
          <h3 className="font-medium text-sm truncate">{unit.displayName}</h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 text-xs font-mono-stats">
          <div className="flex items-center gap-1 text-yellow-500">
            <Zap className="w-3 h-3" />
            <span>${unit.cost}</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <Shield className="w-3 h-3" />
            <span>{unit.strength}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-500">
            <Gauge className="w-3 h-3" />
            <span>{unit.speed}</span>
          </div>
        </div>

        {/* Tech Level */}
        {!isCustom && (
          <div className="text-xs text-muted-foreground">
            Tech Level: {unit.techLevel}
          </div>
        )}
      </div>
    </motion.div>
  );
});

UnitCard.displayName = 'UnitCard';
