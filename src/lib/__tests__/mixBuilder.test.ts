import { describe, it, expect } from 'vitest';
import { buildEcacheMix, MixFileEntry, mixHash } from '../mixBuilder';

// ─── Helpers ────────────────────────────────────────────

function makeEntry(name: string, content: string): MixFileEntry {
  const encoder = new TextEncoder();
  return { name, data: encoder.encode(content).buffer };
}

// ─── CRC32 hash ─────────────────────────────────────────

describe('mixHash (CRC32)', () => {
  it('produces consistent hashes for the same filename', () => {
    expect(mixHash('TEST.SHP')).toBe(mixHash('TEST.SHP'));
  });

  it('uppercases input automatically', () => {
    expect(mixHash('test.shp')).toBe(mixHash('TEST.SHP'));
  });

  it('produces different hashes for different filenames', () => {
    expect(mixHash('A.SHP')).not.toBe(mixHash('B.SHP'));
  });

  it('returns a non-zero unsigned 32-bit value', () => {
    const h = mixHash('ZOMBIE.SHP');
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
  });
});

// ─── buildEcacheMix() ───────────────────────────────────

describe('buildEcacheMix', () => {
  it('throws on empty file list', () => {
    expect(() => buildEcacheMix([])).toThrow('Cannot build MIX with zero files');
  });

  it('starts with 4-byte flags field set to 0', () => {
    const entry = makeEntry('TEST.SHP', 'hello');
    const mix = buildEcacheMix([entry]);
    const view = new DataView(mix.buffer);

    // First 4 bytes = flags = 0x00000000
    expect(view.getUint32(0, true)).toBe(0);
  });

  it('builds a valid MIX binary from one file', () => {
    const entry = makeEntry('TEST.SHP', 'hello');
    const mix = buildEcacheMix([entry]);
    const view = new DataView(mix.buffer);

    // Header: flags(4) + filecount(2) + datasize(4) = 10
    expect(view.getUint16(4, true)).toBe(1);  // file count at offset 4
    expect(view.getUint32(6, true)).toBe(5);  // data size at offset 6

    // Total size = 10 (header) + 12 (1 index entry) + 5 (data) = 27
    expect(mix.length).toBe(27);
  });

  it('builds a valid MIX with multiple files', () => {
    const files = [
      makeEntry('A.SHP', 'aaa'),
      makeEntry('B.SHP', 'bbbbbb'),
    ];
    const mix = buildEcacheMix(files);
    const view = new DataView(mix.buffer);

    expect(view.getUint16(4, true)).toBe(2);
    expect(view.getUint32(6, true)).toBe(9); // 3 + 6

    // Total = 10 + 24 (2*12) + 9 = 43
    expect(mix.length).toBe(43);
  });

  it('sorts index entries by CRC32 hash ascending', () => {
    const files = [
      makeEntry('Z.SHP', 'z'),
      makeEntry('A.SHP', 'a'),
    ];
    const mix = buildEcacheMix(files);
    const view = new DataView(mix.buffer);

    // Index starts at offset 10
    const hash1 = view.getUint32(10, true);
    const hash2 = view.getUint32(22, true);

    expect(hash1).toBeLessThanOrEqual(hash2);
  });

  it('preserves file data correctly', () => {
    const content = 'ABCDEF';
    const entry = makeEntry('T.SHP', content);
    const mix = buildEcacheMix([entry]);

    // Data starts at offset 10 (header) + 12 (index) = 22
    const dataBytes = mix.slice(22);
    const decoded = new TextDecoder().decode(dataBytes);
    expect(decoded).toBe(content);
  });

  it('handles binary data (ArrayBuffer)', () => {
    const raw = new Uint8Array([0x00, 0xFF, 0x80, 0x7F]);
    const entry: MixFileEntry = { name: 'BIN.SHP', data: raw.buffer };
    const mix = buildEcacheMix([entry]);

    const view = new DataView(mix.buffer);
    expect(view.getUint32(6, true)).toBe(4);
    expect(mix.length).toBe(10 + 12 + 4);
  });
});
