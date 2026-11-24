import { describe, expect, it } from 'vitest';
import { identiconCode } from '@pleasenobugs/core';
import { identiconSvg, identiconsLibrary } from './identicon.js';

/**
 * The picture on the board has to be the one in the wallet, or it is just a
 * picture. Both halves are checked against Nimiq's own library: the code core
 * makes from an address, and the drawing the server makes from the code.
 */

const ADDRESSES = [
  'NQ07 0000 0000 0000 0000 0000 0000 0000 0000',
  'NQ10 0J6U LEA8 8AEL U6J0 G2NC 4XSQ QSX4 CN2G',
  'NQ52 SC0N E842 248E N0CS AUG6 XQLJ JLQX 6GUA',
];

/** Each drawing names its clip path with a random number; that is not the picture. */
const same = (svg: string) => svg.replace(/hexagon-clip-\d+/g, 'clip');

describe('identicons', () => {
  it('draw from the code exactly what the library draws from the address', async () => {
    for (const address of ADDRESSES) {
      const code = identiconCode(address.replace(/ /g, '').toLowerCase());
      expect(code).toMatch(/^\d{12}$/);
      const ours = await identiconSvg(code);
      const theirs = await identiconsLibrary.svg(address);
      expect(same(ours!)).toBe(same(theirs));
    }
  });

  it('draw nothing for something that is not a code', async () => {
    for (const bad of ['', '123', '12345678901a', '1234567890123', '../etc']) expect(await identiconSvg(bad)).toBeNull();
  });
});
