import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedItem } from '@magpie/shared';

const { from, select, order, limit, returns } = vi.hoisted(() => {
  const returns = vi.fn();
  const limit = vi.fn(() => ({ returns }));
  const order = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { from, select, order, limit, returns };
});

vi.mock('../src/db/client.js', () => ({ createUserClient: vi.fn(() => ({ from })) }));

const { listItemsForUser } = await import('../src/db/items.js');

interface Row {
  id: string;
  user_id: string;
  source_url: string;
  source_platform: string;
  content_type: string;
  title: string | null;
  caption: string | null;
  highlights: unknown;
  labels: string[];
  status: string;
  transcript_status: string;
  created_at: string;
  updated_at: string;
  status_reason: string | null;
  capture_state: unknown;
}

function row(index: number): Row {
  return {
    id: `item-${index}`,
    user_id: 'user-1',
    source_url: `https://example.com/${index}`,
    source_platform: 'instagram',
    content_type: 'reel',
    title: null,
    caption: null,
    highlights: [],
    labels: [],
    status: 'done',
    transcript_status: 'done',
    created_at: `2026-11-22T10:00:${String(index).padStart(2, '0')}.000Z`,
    updated_at: `2026-11-22T10:00:${String(index).padStart(2, '0')}.000Z`,
    status_reason: null,
    capture_state: null,
  };
}

function servedRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => row(index));
}

function expectNewestFirst(items: SavedItem[]) {
  expect(items.map((item) => item.id)).toEqual(items.map((_, index) => `item-${index}`));
}

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue({ select });
  select.mockReturnValue({ order });
  order.mockReturnValue({ limit });
  limit.mockReturnValue({ returns });
});

describe('listItemsForUser', () => {
  it('returns the 20 newest items and hasMore false when the page is not full', async () => {
    returns.mockResolvedValue({ data: servedRows(20), error: null });

    const page = await listItemsForUser('token-1');

    expect(page.items).toHaveLength(20);
    expect(page.hasMore).toBe(false);
    expectNewestFirst(page.items);
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('probes 21 rows and reports hasMore true while returning only 20', async () => {
    returns.mockResolvedValue({ data: servedRows(21), error: null });

    const page = await listItemsForUser('token-1');

    expect(limit).toHaveBeenCalledWith(21);
    expect(page.items).toHaveLength(20);
    expect(page.items.at(-1)?.id).toBe('item-19');
    expect(page.hasMore).toBe(true);
  });

  it('returns an empty page when the query returns no rows', async () => {
    returns.mockResolvedValue({ data: null, error: null });

    const page = await listItemsForUser('token-1');

    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
  });

  it('propagates the upstream error code', async () => {
    returns.mockResolvedValue({
      data: null,
      error: { code: 'PGRST301', message: 'JWT expired' },
    });

    await expect(listItemsForUser('token-1')).rejects.toMatchObject({
      code: 'PGRST301',
      message: 'JWT expired',
    });
  });
});
