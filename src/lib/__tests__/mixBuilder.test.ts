import { describe, it, expect } from 'vitest';
import { buildEcacheMix, MixFileEntry } from '../mixBuilder';

// ─── Helpers ────────────────────────────────────────────

function makeEntry(name: string, content: string): MixFileEntry {
  const encoder = new TextEncoder();
  return { name, data: encoder.encode(content).buffer };
}

// ─── buildEcacheMix() ───────────────────────────────────

describe('buildEcacheMix', () => {
  it('throws on empty file list', () => {
    expect(() => buildEcacheMix([])).toThrow('Cannot build MIX with zero files');
  });

  it('builds a valid MIX binary from one file', () => {
    const entry = makeEntry('TEST.SHP', 'hello');
    const mix = buildEcacheMix([entry]);
    const view = new DataView(mix.buffer);

    // Header: file count = 1
    expect(view.getUint16(0, true)).toBe(1);

    // Header: data size = 5 ("hello")
    expect(view.getUint32(2, true)).toBe(5);

    // Total size = 6 (header) + 12 (1 index entry) + 5 (data) = 23
    expect(mix.length).toBe(23);
  });

  it('builds a valid MIX with multiple files', () => {
    const files = [
      makeEntry('A.SHP', 'aaa'),
      makeEntry('B.SHP', 'bbbbbb'),
    ];
    const mix = buildEcacheMix(files);
    const view = new DataView(mix.buffer);

    expect(view.getUint16(0, true)).toBe(2);
    expect(view.getUint32(2, true)).toBe(9); // 3 + 6

    // Total = 6 + 24 (2*12) + 9 = 39
    expect(mix.length).toBe(39);
  });

  it('sorts index entries by hash ascending', () => {
    const files = [
      makeEntry('Z.SHP', 'z'),
      makeEntry('A.SHP', 'a'),
    ];
    const mix = buildEcacheMix(files);
    const view = new DataView(mix.buffer);

    // Read the two hashes from the index
    const hash1 = view.getUint32(6, true);
    const hash2 = view.getUint32(18, true);

    expect(hash1).toBeLessThanOrEqual(hash2);
  });

  it('preserves file data correctly', () => {
    const content = 'ABCDEF';
    const entry = makeEntry('T.SHP', content);
    const mix = buildEcacheMix([entry]);

    // Data starts at offset 6 (header) + 12 (index) = 18
    const dataBytes = mix.slice(18);
    const decoded = new TextDecoder().decode(dataBytes);
    expect(decoded).toBe(content);
  });

  it('handles binary data (ArrayBuffer)', () => {
    const raw = new Uint8Array([0x00, 0xFF, 0x80, 0x7F]);
    const entry: MixFileEntry = { name: 'BIN.SHP', data: raw.buffer };
    const mix = buildEcacheMix([entry]);

    const view = new DataView(mix.buffer);
    expect(view.getUint32(2, true)).toBe(4);
    expect(mix.length).toBe(6 + 12 + 4);
  });
});
