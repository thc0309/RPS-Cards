import { useRouter } from 'expo-router';
import type { CardKind } from '@rps-cards/game-core';
import { FolkResultLoadingView, FolkResultView } from '../components/FolkGameViews';
import { disposeLocalSession, getLocalMatchAdapter } from '../game/local-session';
import { translate } from '../i18n';
import { botHintKey, botNameKey } from '../game/bot-labels';
import { useAppStore } from '../store/app-store';
import { pairRoundHistory } from '../ui/round-history';
import { resultOutcome } from '../ui/result-outcome';
import { useFeedback, useTerminalFeedback } from '../ui/feedback';

function cardLabel(kind: CardKind, locale: Parameters<typeof translate>[0]): string {
  return translate(locale, kind === 'ROCK' ? 'cardRock' : kind === 'PAPER' ? 'cardPaper' : 'cardScissors');
}

export function ResultScreen() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const adapter = getLocalMatchAdapter();
  const text = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const match = adapter?.getState().match;
  const feedback = useFeedback();
  const terminalCue = useTerminalFeedback(adapter?.getState().matchId);
  if (!adapter || !match?.result) return <FolkResultLoadingView label={text('loading')} />;
  const playerCards = match.discards.filter((card) => card.playerId === 'PLAYER_A').map((card) => card.kind);
  const opponentCards = match.discards.filter((card) => card.playerId === 'PLAYER_B').map((card) => card.kind);
  const history = pairRoundHistory(playerCards, opponentCards);
  const persona = adapter.getState().botPersona;
  const botName = persona ? text(botNameKey[persona]) : 'BOT';
  const outcome = resultOutcome(match.result.scores.PLAYER_A, match.result.scores.PLAYER_B, match.result.winner === 'PLAYER_A', history.length);

  return <FolkResultView celebrateWin={terminalCue === 'match-win'} title={text('result')} outcome={outcome === 'DRAW' ? text('draw') : outcome === 'WIN' || outcome === 'FORFEIT_WIN' ? text('youWin') : text('youLose')} columnLabels={{ player: text('you'), opponent: botName }} roundMarks={{ win: text('roundBannerWin'), loss: text('roundBannerLoss'), draw: text('roundBannerDraw') }} hint={persona ? text(botHintKey[persona]) : undefined} scoreLabel={text('score')} playerScore={match.result.scores.PLAYER_A} opponentScore={match.result.scores.PLAYER_B} roundLabel={text('round')} history={history} cardLabel={(kind) => cardLabel(kind, locale)} primaryLabel={text('rematch')} secondaryLabel={text('home')} onPrimary={() => { feedback.leaveResult(adapter.getState().matchId); feedback.setMatch(null); disposeLocalSession(); feedback.play('paper-slide'); router.replace('/draft'); }} onSecondary={() => { feedback.leaveResult(adapter.getState().matchId); feedback.setMatch(null); disposeLocalSession(); feedback.play('paper-slide'); router.replace('/'); }} />;
}
