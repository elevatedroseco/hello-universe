import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, AlertTriangle, XCircle, Box, ImageIcon, FileText } from 'lucide-react';
import JSZip from 'jszip';

export interface RecognizedFile {
  type: 'sprite' | 'voxel' | 'animation' | 'icon' | 'config' | 'image' | 'buildup' | 'turret' | 'barrel' | 'unknown';
  file: File;
  name: string;
  status: 'recognized' | 'warning' | 'error';
  message?: string;
  thumbnailUrl?: string;
}

export interface ProcessedAssets {
  internalId: string;
  recognizedFiles: RecognizedFile[];
  parsedConfig?: Record<string, string>;
}

interface AssetDropZoneProps {
  onFilesProcessed: (result: ProcessedAssets) => void;
  disabled?: boolean;
  compact?: boolean;
}

const FILE_TYPE_ICONS: Record<string, typeof Box> = {
  voxel: Box,
  animation: Box,
  turret: Box,
  barrel: Box,
  sprite: ImageIcon,
  icon: ImageIcon,
  image: ImageIcon,
  buildup: ImageIcon,
  config: FileText,
  unknown: FileText,
};

const FILE_TYPE_LABELS: Record<string, string> = {
  voxel: 'VXL Model',
  animation: 'HVA Anim',
  turret: 'Turret VXL',
  barrel: 'Barrel VXL',
  sprite: 'SHP Sprite',
  icon: 'Cameo Icon',
  image: 'Image',
  buildup: 'Buildup',
  config: 'Config',
  unknown: 'Unknown',
};

export const AssetDropZone = ({ onFilesProcessed, disabled, compact }: AssetDropZoneProps) => {
  const [recognizedFiles, setRecognizedFiles] = useState<RecognizedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const recognized: RecognizedFile[] = [];
    let internalId = '';
    let configData: Record<string, string> | undefined;

    // Expand ZIP files first
    const expandedFiles: File[] = [];
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
              const blob = await zipEntry.async('blob');
              const baseName = filename.split('/').pop() || filename;
              const extractedFile = new File([blob], baseName, { type: blob.type });
              expandedFiles.push(extractedFile);
            }
          }
        } catch (error) {
          console.error('Error extracting ZIP:', error);
        }
      } else {
        expandedFiles.push(file);
      }
    }

    // Identify each file
    for (const file of expandedFiles) {
      const fileName = file.name.toUpperCase();
      const ext = fileName.split('.').pop() || '';
      const baseName = fileName.replace(`.${ext}`, '');

      let fileType: RecognizedFile['type'] = 'unknown';
      let status: RecognizedFile['status'] = 'recognized';
      let message = '';
      let thumbnailUrl: string | undefined;

      if (ext === 'VXL') {
        if (baseName.endsWith('TUR')) {
          fileType = 'turret';
          message = 'Turret model detected';
        } else if (baseName.endsWith('BARL')) {
          fileType = 'barrel';
          message = 'Barrel model detected';
        } else {
          fileType = 'voxel';
          message = 'Main voxel model';
          if (!internalId) internalId = baseName.substring(0, 8);
        }
      } else if (ext === 'HVA') {
        fileType = 'animation';
        message = 'Voxel animation file';
      } else if (ext === 'SHP') {
        if (baseName.includes('ICON')) {
          fileType = 'icon';
          message = 'Cameo icon';
        } else if (baseName.includes('BUP') || baseName.includes('BUILDUP')) {
          fileType = 'buildup';
          message = 'Structure buildup animation';
        } else {
          fileType = 'sprite';
          message = 'Unit sprite';
          if (!internalId) internalId = baseName.substring(0, 8);
        }
      } else if (ext === 'INI' || ext === 'TXT') {
        fileType = 'config';
        message = 'Configuration file — will parse for stats';
        try {
          const text = await file.text();
          configData = parseINIConfig(text);
        } catch {
          status = 'warning';
          message = 'Config file found but could not parse';
        }
      } else if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(ext)) {
        fileType = 'image';
        message = 'Image file — will use as preview icon';
        thumbnailUrl = URL.createObjectURL(file);
      } else {
        status = 'warning';
        message = 'Unknown file type — ignoring';
      }

      recognized.push({ type: fileType, file, name: file.name, status, message, thumbnailUrl });
    }

    // Validate: VXL without HVA
    const hasVXL = recognized.some((f) => f.type === 'voxel');
    const hasHVA = recognized.some((f) => f.type === 'animation');
    const hasSHP = recognized.some((f) => f.type === 'sprite');

    if (hasVXL && !hasHVA) {
      const vxlFile = recognized.find((f) => f.type === 'voxel');
      if (vxlFile) {
        vxlFile.status = 'error';
        vxlFile.message = 'Missing .HVA file — voxel units require both VXL and HVA';
      }
    }

    if (!hasVXL && !hasSHP && !recognized.some((f) => f.type === 'image')) {
      recognized.unshift({
        type: 'unknown',
        file: files[0],
        name: 'No valid asset',
        status: 'error',
        message: 'No .SHP sprite or .VXL model found',
      });
      setRecognizedFiles(recognized);
      setIsProcessing(false);
      return;
    }

    internalId = cleanInternalId(internalId);

    setRecognizedFiles(recognized);
    onFilesProcessed({ internalId, recognizedFiles: recognized, parsedConfig: configData });
    setIsProcessing(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || isProcessing) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) processFiles(files);
    },
    [disabled, isProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) processFiles(files);
      e.target.value = '';
    },
    [disabled, isProcessing]
  );

  const statusIcon = (status: RecognizedFile['status']) => {
    if (status === 'recognized') return <CheckCircle className="w-4 h-4 text-mutant-green shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-modded-gold shrink-0" />;
    return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          isDragOver
            ? 'border-modded-gold bg-modded-gold/5 scale-[1.01]'
            : recognizedFiles.length > 0
              ? 'border-mutant-green/50 bg-mutant-green/5'
              : 'border-border hover:border-muted-foreground/50'
        } ${compact ? 'p-4' : 'p-8'}`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".shp,.vxl,.hva,.zip,.ini,.txt,.png,.jpg,.jpeg,.gif,.webp"
          disabled={disabled || isProcessing}
        />

        {isProcessing ? (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-modded-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground font-display">Processing assets...</p>
          </div>
        ) : recognizedFiles.length === 0 ? (
          <div className="text-center space-y-3">
            <Upload className={`mx-auto text-muted-foreground ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
            <div>
              <p className={`font-display text-foreground ${compact ? 'text-sm' : 'text-lg'}`}>
                🎯 Drop Your Unit Assets Here
              </p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
            </div>
            {!compact && (
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-border">✓ .SHP sprite</Badge>
                <Badge variant="outline" className="border-border">✓ .VXL + .HVA</Badge>
                <Badge variant="outline" className="border-border">✓ .ZIP bundle</Badge>
                <Badge variant="outline" className="border-border">✓ .INI config</Badge>
                <Badge variant="outline" className="border-border">✓ Image icon</Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-1">
            <CheckCircle className="w-6 h-6 text-mutant-green mx-auto" />
            <p className="text-sm text-mutant-green font-display">Assets recognized! Drop more or review below.</p>
          </div>
        )}
      </div>

      {/* Recognized Files List */}
      {recognizedFiles.length > 0 && (
        <Card className="border-border bg-card/50">
          <CardContent className="p-3 space-y-1">
            <p className="text-xs text-muted-foreground font-display mb-2">
              RECOGNIZED FILES ({recognizedFiles.length})
            </p>
            {recognizedFiles.map((rf, idx) => {
              const Icon = FILE_TYPE_ICONS[rf.type] || FileText;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-md bg-secondary/30"
                >
                  {rf.thumbnailUrl ? (
                    <img src={rf.thumbnailUrl} className="w-8 h-8 rounded object-cover shrink-0" alt="" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate text-foreground">{rf.name}</p>
                    <p className="text-xs text-muted-foreground">{rf.message}</p>
                  </div>
                  {statusIcon(rf.status)}
                  <Badge variant="outline" className="text-[10px] border-border shrink-0">
                    {FILE_TYPE_LABELS[rf.type]}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helpers
const parseINIConfig = (text: string): Record<string, string> => {
  const lines = text.split('\n');
  const config: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('[')) continue;
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch) config[kvMatch[1].trim()] = kvMatch[2].trim();
  }
  return config;
};

const cleanInternalId = (id: string): string =>
  id.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
