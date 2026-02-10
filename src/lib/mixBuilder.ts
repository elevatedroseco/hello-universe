/**
 * Tiberian Sun MIX file builder
 *
 * MIX format (unencrypted, no checksum):
 *   [2 bytes] file count        (uint16 LE)
 *   [4 bytes] total data size   (uint32 LE)
 *   [12 * N]  index entries sorted by ID:
 *       [4 bytes] filename hash (uint32 LE)
 *       [4 bytes] offset from data start (uint32 LE)
 *       [4 bytes] file size (uint32 LE)
 *   [variable] concatenated file data
 */

/**
 * TS-specific rotate-left-1 + add hash used for MIX filename lookups.
 * Input must be the UPPERCASE filename including extension (e.g. "ZOMBIE.SHP").
 */
function mixHash(filename: string): number {
  const name = filename.toUpperCase();
  let id = 0;
  for (let i = 0; i < name.length; i++) {
    id = (((id << 1) | (id >>> 31)) + name.charCodeAt(i)) >>> 0;
  }
  return id;
}

export interface MixFileEntry {
  name: string;       // e.g. "ZOMBIE.SHP"
  data: ArrayBuffer;
}

/**
 * Build an ecacheXX.mix from the given file entries.
 * Returns the complete binary as a Uint8Array ready to be added to a ZIP.
 */
export function buildEcacheMix(files: MixFileEntry[]): Uint8Array {
  if (files.length === 0) {
    throw new Error('Cannot build MIX with zero files');
  }

  const fileCount = files.length;
  const headerSize = 6;            // 2 + 4
  const indexSize = fileCount * 12; // 12 bytes per entry

  // Calculate offsets (data section starts after header + index)
  let dataSize = 0;
  const entries = files.map(f => {
    const offset = dataSize;
    dataSize += f.data.byteLength;
    return { name: f.name, data: f.data, offset, size: f.data.byteLength, hash: mixHash(f.name) };
  });

  // Sort index by hash for faster engine lookup
  const sortedIndex = [...entries].sort((a, b) => {
    // unsigned comparison
    if (a.hash === b.hash) return 0;
    return a.hash > b.hash ? 1 : -1;
  });

  const totalSize = headerSize + indexSize + dataSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let pos = 0;

  // Header
  view.setUint16(pos, fileCount, true); pos += 2;
  view.setUint32(pos, dataSize, true);  pos += 4;

  // Index (sorted by hash)
  for (const entry of sortedIndex) {
    view.setUint32(pos, entry.hash, true);   pos += 4;
    view.setUint32(pos, entry.offset, true); pos += 4;
    view.setUint32(pos, entry.size, true);   pos += 4;
  }

  // Data (original insertion order — offsets already computed)
  for (const entry of entries) {
    new Uint8Array(buffer, pos, entry.size).set(new Uint8Array(entry.data));
    pos += entry.size;
  }

  return new Uint8Array(buffer);
}
