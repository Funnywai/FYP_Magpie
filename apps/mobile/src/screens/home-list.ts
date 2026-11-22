export type HomeListMode = 'loading' | 'error' | 'empty' | 'items';

export type HomeListInput = {
  readonly loading: boolean;
  readonly error: boolean;
  readonly hasLoaded: boolean;
  readonly visibleCount: number;
};

export type ItemCountInput = {
  readonly mode: HomeListMode;
  readonly hasResult: boolean;
};

/**
 * Error only owns the list before any successful load; afterwards stale rows
 * stay on screen behind the refresh banner. A render before the first result
 * is still loading, and an empty state is allowed only once a result is known.
 */
export function homeListMode({ loading, error, hasLoaded, visibleCount }: HomeListInput): HomeListMode {
  if (loading) return 'loading';
  if (error && !hasLoaded) return 'error';
  if (!hasLoaded) return 'loading';
  if (visibleCount === 0) return 'empty';
  return 'items';
}

export function showsItemCount({ mode, hasResult }: ItemCountInput): boolean {
  return hasResult && mode !== 'error';
}

export type MoreNoticeInput = {
  readonly hasMore: boolean;
  readonly hasResult: boolean;
  readonly filteredZero: boolean;
  readonly demoPreview: boolean;
};

/**
 * The paging note belongs to any known result, so it survives a real refresh
 * that temporarily puts the list back into loading. A filtered-zero result
 * already carries the same scope in its empty-state hint, and demo previews
 * keep their forced state without paging copy.
 */
export function showsMoreNotice({ hasMore, hasResult, filteredZero, demoPreview }: MoreNoticeInput): boolean {
  return hasMore && hasResult && !filteredZero && !demoPreview;
}
