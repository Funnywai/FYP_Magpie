import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useLang } from '../i18n/LangProvider';
import { useItems } from '../state/ItemsProvider';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { SkeletonCard } from './Skeleton';

type Props = { emptyTitle: string; emptyHint: string; children: ReactNode };

/** Shows the loading / empty / error variants chosen in Settings; otherwise renders the screen. */
// Keeps loading/empty/error handling identical across Map, Itinerary and Detail.
export function ScreenGate({ emptyTitle, emptyHint, children }: Props) {
  const { demo, setDemo } = useItems();
  const { s } = useLang();
  // Order matters: loading wins over empty/error so a refresh never flashes stale state.
  if (demo === 'loading') {
    return (
      <View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }
  if (demo === 'empty') {
    return <EmptyState title={emptyTitle} hint={emptyHint} actionLabel={s.backToNormal} onAction={() => setDemo('ready')} />;
  }
  if (demo === 'error') return <ErrorBanner message={s.serverError} onRetry={() => setDemo('ready')} />;
  return <>{children}</>;
}
