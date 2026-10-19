import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { mockItems, type Item } from '../mocks/items';
import type { ItemStatus } from '@magpie/shared';

/** Which UI state every screen should currently show (reviewable from Settings). */
export type DemoState = 'ready' | 'loading' | 'empty' | 'error';

type ItemsApi = {
  items: Item[];
  demo: DemoState;
  setDemo: (next: DemoState) => void;
  setStatus: (id: string, status: ItemStatus) => void;
  react: (id: string, reaction: 'like' | 'dislike') => void;
  toggleSave: (id: string) => void;
  correct: (id: string, fieldId: string, value: string) => void;
  add: (item: Item) => void;
};

const ItemsContext = createContext<ItemsApi | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [demo, setDemo] = useState<DemoState>('ready');

  // Single immutable update helper keeps every action a one-liner.
  const patch = useCallback((id: string, fn: (item: Item) => Item) => {
    setItems((all) => all.map((it) => (it.id === id ? fn(it) : it)));
  }, []);

  // Memoised so consumers only re-render when items or the demo state change.
  const api = useMemo<ItemsApi>(
    () => ({
      items,
      demo,
      setDemo,
      setStatus: (id, status) => patch(id, (it) => ({ ...it, status })),
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
    [items, demo, patch],
  );

  return <ItemsContext.Provider value={api}>{children}</ItemsContext.Provider>;
}

export function useItems(): ItemsApi {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useItems must be used inside <ItemsProvider>');
  return ctx;
}
