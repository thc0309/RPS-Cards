import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { LocalMatchAdapter } from '../game/local-match-adapter';
import { setLocalDraftResult, setLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { useAppStore } from '../store/app-store';
import { useCountdownSeconds } from '../ui/countdown';
import { FolkDraftView } from '../components/FolkGameViews';
import { FolkSurface } from '../components/FolkSurface';

export function DraftScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const [adapter, setAdapter] = useState<LocalBotDraftAdapter | null>(null);
  const [snapshot, setSnapshot] = useState<ReturnType<LocalBotDraftAdapter['getState']> | null>(null);
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const remaining = useCountdownSeconds(snapshot?.deadline?.deadlineAt);

  useEffect(() => {
    const created = new LocalBotDraftAdapter((max) => Math.floor(Math.random() * max));
    setAdapter(created);
    setSnapshot(created.getState());
    const unsubscribe = created.subscribe(() => setSnapshot(created.getState()));
    return () => { unsubscribe(); created.dispose(); };
  }, []);
  useEffect(() => {
    if (snapshot?.result) {
      setLocalDraftResult(snapshot.result);
      setLocalMatchAdapter(new LocalMatchAdapter(snapshot.result.hands, (max) => Math.floor(Math.random() * max)));
      router.replace('/board');
    }
  }, [router, snapshot?.result]);

  if (!adapter || !snapshot) return <FolkSurface background="woven">{null}</FolkSurface>;
  return <FolkDraftView title={text('draftTitle')} status={snapshot.status === 'WAITING' ? text('opponentHasPicked') : snapshot.status === 'COMPLETE' ? text('waiting') : text('available')} instruction={text('draftInstruction')} timer={remaining} cardBackLabel={text('cardBack')} unavailableLabel={text('unavailable')} positions={snapshot.view.availablePositions.map((item) => item.position)} selectedPosition={snapshot.selectedPosition} disabled={snapshot.status !== 'AVAILABLE'} onPick={(position) => adapter.selectPlayerPosition(position)} />;
}
