import { describe, expect, it } from 'vitest';
import { shortAddress } from './address.js';

describe('shortAddress', () => {
  it('keeps the first and last four, in any spelling', () => {
    expect(shortAddress('NQ12 3456 7890 ABCD EFGH JKLM NPQR STUV AB34')).toBe('NQ12 … AB34');
    expect(shortAddress('nq1234567890abcdefghjklmnpqrstuvab34')).toBe('NQ12 … AB34');
  });
});
