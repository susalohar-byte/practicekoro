import { describe, it, expect } from 'vitest';
import {
  WEST_BENGAL_DISTRICTS,
  WEST_BENGAL_BLOCKS,
  isValidDistrict,
  getBlocksForDistrict,
} from './districts';

describe('West Bengal Districts and Blocks Master Data', () => {
  it('contains exactly all 23 districts of West Bengal', () => {
    expect(WEST_BENGAL_DISTRICTS).toHaveLength(23);
  });

  it('contains key districts including Kolkata, Purulia, Bankura, Howrah, North 24 Parganas', () => {
    expect(WEST_BENGAL_DISTRICTS).toContain('Kolkata');
    expect(WEST_BENGAL_DISTRICTS).toContain('Purulia');
    expect(WEST_BENGAL_DISTRICTS).toContain('Bankura');
    expect(WEST_BENGAL_DISTRICTS).toContain('Howrah');
    expect(WEST_BENGAL_DISTRICTS).toContain('North 24 Parganas');
    expect(WEST_BENGAL_DISTRICTS).toContain('South 24 Parganas');
  });

  it('validates genuine districts using isValidDistrict', () => {
    expect(isValidDistrict('Kolkata')).toBe(true);
    expect(isValidDistrict('Purulia')).toBe(true);
    expect(isValidDistrict('Mumbai')).toBe(false);
    expect(isValidDistrict('')).toBe(false);
  });

  it('maps every district to its non-empty list of blocks', () => {
    for (const district of WEST_BENGAL_DISTRICTS) {
      const blocks = WEST_BENGAL_BLOCKS[district];
      expect(blocks).toBeDefined();
      expect(blocks.length).toBeGreaterThan(0);
    }
  });

  it('retrieves blocks by district using getBlocksForDistrict', () => {
    const puruliaBlocks = getBlocksForDistrict('Purulia');
    expect(puruliaBlocks).toContain('Manbazar I');
    expect(puruliaBlocks).toContain('Balarampur');
    expect(puruliaBlocks).toContain('Hura');

    const bankuraBlocks = getBlocksForDistrict('Bankura');
    expect(bankuraBlocks).toContain('Bishnupur');
    expect(bankuraBlocks).toContain('Onda');

    // Case-insensitive lookup
    expect(getBlocksForDistrict('purulia')).toEqual(puruliaBlocks);
    expect(getBlocksForDistrict(null)).toEqual([]);
    expect(getBlocksForDistrict('UnknownDistrict')).toEqual([]);
  });
});
