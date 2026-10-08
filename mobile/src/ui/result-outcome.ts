export type ResultOutcome = 'WIN' | 'LOSS' | 'DRAW' | 'FORFEIT_WIN' | 'FORFEIT_LOSS';

export function resultOutcome(playerScore: number, opponentScore: number, playerWon: boolean, completedRounds: number): ResultOutcome {
  if (completedRounds < 4) return playerWon ? 'FORFEIT_WIN' : 'FORFEIT_LOSS';
  if (playerScore === opponentScore) return 'DRAW';
  return playerWon ? 'WIN' : 'LOSS';
}
