import type { ItemStatus } from '@magpie/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '../auth/AuthProvider';
import { listItems } from '../lib/api';
import type { Item } from '../mocks/items';
import { toUiItem } from './item-mapper';

/** Which UI state every screen should currently show (reviewable from Settings). */
export type DemoState = 'ready' | 'loading' | 'empty' | 'error';

type ItemsApi = {
  items: Item[];
  loading: boolean;
  error: boolean;
  demo: DemoState;
  setDemo: (next: DemoState) => void;
  reload: () => void;
  setStatus: (id: string, status: ItemStatus, transcriptStatus?: Item['transcriptStatus']) => void;
  react: (id: string, reaction: 'like' | 'dislike') => void;
  toggleSave: (id: string) => void;
  correct: (id: string, fieldId: string, value: string) => void;
  add: (item: Item) => void;
};

const ItemsContext = createContext<ItemsApi | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [demo, setDemo] = useState<DemoState>('ready');
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;

    if (status !== 'signedIn') {
      setItems([]);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const response = await listItems();
      if (requestId.current !== id) return;
      setItems(response.items.map(toUiItem));
    } catch {
      if (requestId.current !== id) return;
      setError(true);
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [status]);

  // Fetch on sign-in and clear on sign-out; `status` is the only trigger.
  useEffect(() => {
    void reload();
  }, [reload]);

  // Single immutable update helper keeps every action a one-liner.
  const patch = useCallback((id: string, fn: (item: Item) => Item) => {
    setItems((all) => all.map((it) => (it.id === id ? fn(it) : it)));
  }, []);

  // Memoised so consumers only re-render when items or the demo state change.
  const api = useMemo<ItemsApi>(
    () => ({
      items,
      loading,
      error,
      demo,
      setDemo,
      reload: () => void reload(),
      setStatus: (id, status, transcriptStatus) =>
        patch(id, (it) => ({
          ...it,
          status,
          ...(transcriptStatus ? { transcriptStatus } : {}),
        })),
      // Pressing the active reaction again clears it.
      react: (id, reaction) => patch(id, (it) => ({ ...it, reaction: it.reaction === reaction ? undefined : reaction })),
      toggleSave: (id) => patch(id, (it) => ({ ...it, saved: !it.saved })),
      // A user edit is ground truth: confidence jumps to 100 and the row is flagged "已修正".
      correct: (id, fieldId, value) =>
        patch(id, (it) => ({
          ...it,
          fields: it.fields.map((f) => (f.id === fieldId ? { ...f, value, confidence: 100, corrected: true } : f)),
        })),
      add: (item) => setItems((all) => [item, ...all]),
    }),
    [items, loading, error, demo, reload, patch],
  );

  return <ItemsContext.Provider value={api}>{children}</ItemsContext.Provider>;
}

export function useItems(): ItemsApi {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useItems must be used inside <ItemsProvider>');
  return ctx;
}
