import { describe, expect, it } from 'vitest';

import { extractBearer } from '../src/auth/extract-bearer.js';

const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2ln';

describe('extractBearer', () => {
  it.each([
    ['Bearer ' + TOKEN, TOKEN],
    ['bearer ' + TOKEN, TOKEN],
    ['BEARER   ' + TOKEN, TOKEN],
    ['  Bearer ' + TOKEN + '  ', TOKEN],
  ])('accepts valid header %j', (header, expected) => {
    expect(extractBearer(header)).toBe(expected);
  });

  it.each([
    [undefined],
    [''],
    ['Basic dXNlcjpwYXNz'],
    ['Bearer'],
    ['Bearer '],
    ['Bearer ' + TOKEN + ' extra'],
    ['Bearer ' + TOKEN + ', Bearer ' + TOKEN],
    ['Bearer not-a-jwt'],
  ])('rejects malformed header %j', (header) => {
    expect(extractBearer(header)).toBeNull();
  });
});
