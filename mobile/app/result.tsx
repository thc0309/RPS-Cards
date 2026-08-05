import { ResultScreen } from '../src/screens/ResultScreen';
import { OnlineResultScreen } from '../src/screens/OnlineResultScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ResultRoute() {
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  return params.roomCode && params.sessionId ? <OnlineResultScreen /> : <ResultScreen />;
}
