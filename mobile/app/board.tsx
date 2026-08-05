import { BoardScreen } from '../src/screens/BoardScreen';
import { OnlineBoardScreen } from '../src/screens/OnlineBoardScreen';
import { useLocalSearchParams } from 'expo-router';

export default function BoardRoute() {
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  return params.roomCode && params.sessionId ? <OnlineBoardScreen /> : <BoardScreen />;
}
