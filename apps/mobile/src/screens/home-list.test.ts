import { describe, expect, it } from 'vitest';

import { homeListMode, showsItemCount } from './home-list';

describe('homeListMode', () => {
  it('keeps loading while a request is in flight', () => {
    expect(homeListMode({ loading: true, error: true, hasLoaded: true, visibleCount: 3 })).toBe('loading');
  });

  it('treats the pre-effect render as loading, not empty', () => {
    expect(homeListMode({ loading: false, error: false, hasLoaded: false, visibleCount: 0 })).toBe('loading');
  });

  it('shows the error state only before any successful load', () => {
    expect(homeListMode({ loading: false, error: true, hasLoaded: false, visibleCount: 0 })).toBe('error');
  });

  it('allows the empty state after a successful zero result', () => {
    expect(homeListMode({ loading: false, error: false, hasLoaded: true, visibleCount: 0 })).toBe('empty');
  });

  it('keeps stale items visible when a refresh fails', () => {
    expect(homeListMode({ loading: false, error: true, hasLoaded: true, visibleCount: 2 })).toBe('items');
  });

  it('shows items when rows are visible', () => {
    expect(homeListMode({ loading: false, error: false, hasLoaded: true, visibleCount: 2 })).toBe('items');
  });
});

describe('showsItemCount', () => {
  it('hides the count before any result is known', () => {
    expect(showsItemCount({ mode: 'loading', hasResult: false })).toBe(false);
  });

  it('shows the count for a known zero result', () => {
    expect(showsItemCount({ mode: 'empty', hasResult: true })).toBe(true);
  });

  it('keeps the count while refreshing a known result', () => {
    expect(showsItemCount({ mode: 'loading', hasResult: true })).toBe(true);
  });

  it('hides the count in a first-load error', () => {
    expect(showsItemCount({ mode: 'error', hasResult: false })).toBe(false);
  });
});
