import { describe, expect, it } from 'vitest';

import { apiError, mapDataApiError } from '../src/errors.js';

describe('apiError', () => {
  it('builds the SPEC §5 envelope', () => {
    expect(apiError('UNAUTHENTICATED', 'Missing token')).toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Missing token' },
    });
  });
});

describe('mapDataApiError', () => {
  it('maps an invalid upstream JWT to 401', () => {
    expect(mapDataApiError({ code: 'PGRST301', message: 'JWT expired' })).toEqual({
      status: 401,
      body: apiError('UNAUTHENTICATED', 'Invalid or expired session'),
    });
  });

  it('maps an RLS/permission violation to 403', () => {
    expect(mapDataApiError({ code: '42501', message: 'denied' })).toEqual({
      status: 403,
      body: apiError('FORBIDDEN', 'Not allowed'),
    });
  });

  it('maps anything else to 500 without leaking the upstream message', () => {
    expect(mapDataApiError({ code: 'XX000', message: 'relation does not exist' })).toEqual({
      status: 500,
      body: apiError('INTERNAL', 'Something went wrong'),
    });
  });
});
