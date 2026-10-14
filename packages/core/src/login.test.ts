import { describe, expect, it } from 'vitest';
import {
  LOGIN_SKEW_MS,
  LOGIN_TTL_MS,
  decodeProof,
  encodeProof,
  loginMessage,
  normalizeOrigin,
  proofIsFresh,
} from './login.js';

describe('loginMessage', () => {
  it('is exactly the v1 text, since changing it breaks every proof in the wild', () => {
    expect(loginMessage({ project: 'shitti', origin: 'https://shitti.me', issued: 0 })).toBe(
      'PleaseNoBugs login\nProject: shitti\nOrigin: https://shitti.me\nIssued: 1970-01-01T00:00:00.000Z',
    );
  });

  it('spells the origin one way, so a trailing slash cannot make two messages', () => {
    const a = loginMessage({ project: 'p', origin: 'https://Shitti.me/', issued: 1 });
    const b = loginMessage({ project: 'p', origin: 'https://shitti.me', issued: 1 });
    expect(a).toBe(b);
  });

  it('differs per project, which is what stops one board reusing another one’s proofs', () => {
    const a = loginMessage({ project: 'one', origin: 'https://x.app', issued: 1 });
    const b = loginMessage({ project: 'two', origin: 'https://x.app', issued: 1 });
    expect(a).not.toBe(b);
  });
});

describe('normalizeOrigin', () => {
  it('drops paths and lower-cases the host', () => {
    expect(normalizeOrigin('https://Example.com/board?x=1')).toBe('https://example.com');
  });
  it('leaves a non-URL alone so it simply never matches', () => {
    expect(normalizeOrigin('not a url')).toBe('not a url');
  });
});

describe('proofIsFresh', () => {
  const now = 1_000_000_000_000;
  it('accepts a proof inside its lifetime', () => {
    expect(proofIsFresh(now - LOGIN_TTL_MS + 1, now)).toBe(true);
  });
  it('refuses one past it', () => {
    expect(proofIsFresh(now - LOGIN_TTL_MS - 1, now)).toBe(false);
  });
  it('tolerates a fast clock, up to a point', () => {
    expect(proofIsFresh(now + LOGIN_SKEW_MS, now)).toBe(true);
    expect(proofIsFresh(now + LOGIN_SKEW_MS + 1, now)).toBe(false);
  });
  it('refuses nonsense', () => {
    expect(proofIsFresh(Number.NaN, now)).toBe(false);
  });
});

describe('encodeProof / decodeProof', () => {
  const proof = {
    address: 'NQ07 0000',
    publicKey: 'ab',
    signature: 'cd',
    origin: 'https://x.app',
    issued: 42,
  };

  it('round-trips', () => {
    expect(decodeProof(encodeProof(proof))).toEqual(proof);
  });

  it('survives non-ASCII, since base64 alone would not', () => {
    const odd = { ...proof, address: 'NQ€ ü' };
    expect(decodeProof(encodeProof(odd))).toEqual(odd);
  });

  it('is url-safe, so it can never break a header', () => {
    expect(encodeProof(proof)).toMatch(/^Nimiq [A-Za-z0-9_-]+$/);
  });

  it('answers null for anything that is not a proof', () => {
    expect(decodeProof(undefined)).toBeNull();
    expect(decodeProof('Bearer abc')).toBeNull();
    expect(decodeProof('Nimiq !!!')).toBeNull();
    expect(decodeProof(`Nimiq ${btoa(JSON.stringify({ address: 'x' }))}`)).toBeNull();
  });
});
