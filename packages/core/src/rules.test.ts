import { describe, expect, it } from 'vitest';
import { cleanCodeLink, cleanFix, cleanVersion, codeSite } from './rules.js';

/**
 * A fix's link is something an app's users are invited to tap, on a board the
 * app's owner wrote on. These are the ways it could go somewhere other than
 * GitHub or GitLab, and the ways people really paste one.
 */
describe('cleanCodeLink', () => {
  it('takes a page on github.com however it was pasted', () => {
    expect(cleanCodeLink('https://github.com/me/app/pull/42')).toBe('https://github.com/me/app/pull/42');
    expect(cleanCodeLink('github.com/me/app/releases/tag/v1.4.2')).toBe(
      'https://github.com/me/app/releases/tag/v1.4.2',
    );
    expect(cleanCodeLink(' http://www.GitHub.com/me/app/commit/abc123#diff ')).toBe(
      'https://github.com/me/app/commit/abc123#diff',
    );
  });

  it('takes a page on gitlab.com the same way', () => {
    expect(cleanCodeLink('gitlab.com/me/app/-/merge_requests/7')).toBe('https://gitlab.com/me/app/-/merge_requests/7');
    expect(cleanCodeLink('http://www.GitLab.com/me/app/-/releases/v2.0')).toBe(
      'https://gitlab.com/me/app/-/releases/v2.0',
    );
  });

  it('answers empty for nothing, so a fix can leave its link out', () => {
    expect(cleanCodeLink('')).toBe('');
    expect(cleanCodeLink('   ')).toBe('');
  });

  it('refuses anything that is not github.com or gitlab.com, or points at nothing there', () => {
    for (const bad of [
      'https://github.com.evil.example/me',
      'https://evil.example/github.com/me',
      'https://gist.github.com/me/1',
      'https://gitlab.example.com/me/app',
      'https://about.gitlab.com/pricing',
      'https://gitlab.com.evil.example/me',
      'https://bitbucket.org/me/app',
      'gitlab.com',
      'https://user:pass@github.com/me',
      'https://github.com:8443/me',
      'javascript:alert(1)',
      'ftp://github.com/me',
      'https://github.com/',
      'github.com',
      `https://github.com/${'a'.repeat(300)}`,
      42,
      null,
    ]) {
      expect(cleanCodeLink(bad), String(bad)).toBeNull();
    }
  });
});

describe('codeSite', () => {
  it('names the site a link goes to, and nothing for one that is refused', () => {
    expect(codeSite('https://github.com/me/app/pull/42')).toBe('GitHub');
    expect(codeSite('gitlab.com/me/app/-/releases/v2')).toBe('GitLab');
    expect(codeSite('https://bitbucket.org/me/app')).toBeNull();
  });
});

describe('cleanVersion', () => {
  it('keeps a version, trimmed, and refuses one that is more than a label', () => {
    expect(cleanVersion(' v1.4.2 ')).toBe('v1.4.2');
    expect(cleanVersion('2.0.0-beta.1+build')).toBe('2.0.0-beta.1+build');
    expect(cleanVersion('')).toBe('');
    expect(cleanVersion('1.4 beta')).toBeNull();
    expect(cleanVersion('.1')).toBeNull();
    expect(cleanVersion('1'.repeat(25))).toBeNull();
    expect(cleanVersion(3)).toBeNull();
  });
});

describe('cleanFix', () => {
  it('cleans both parts, leaves out an empty one, and refuses a bad one', () => {
    expect(cleanFix({ version: '1.4.2', link: 'github.com/me/app/pull/42' })).toEqual({
      version: '1.4.2',
      link: 'https://github.com/me/app/pull/42',
    });
    expect(cleanFix({ version: '', link: '' })).toEqual({});
    expect(cleanFix({ version: '1.4.2' })).toEqual({ version: '1.4.2' });
    expect(cleanFix({ link: 'https://example.com/x' })).toBeNull();
    expect(cleanFix('1.4.2')).toBeNull();
    expect(cleanFix([])).toBeNull();
  });
});
