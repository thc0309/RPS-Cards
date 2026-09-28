export type ResultOutcome = 'WIN' | 'LOSS' | 'DRAW' | 'FORFEIT_WIN';

export function resultOutcome(playerScore: number, opponentScore: number, playerWon: boolean, completedRounds: number): ResultOutcome {
  if (playerScore === opponentScore) return 'DRAW';
  if (playerWon && completedRounds < 4) return 'FORFEIT_WIN';
  return playerWon ? 'WIN' : 'LOSS';
}
