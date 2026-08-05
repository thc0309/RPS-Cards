import { DraftScreen } from '../src/screens/DraftScreen';
import { OnlineDraftScreen } from '../src/screens/OnlineDraftScreen';
import { useLocalSearchParams } from 'expo-router';

export default function DraftRoute() {
  const params = useLocalSearchParams<{ roomCode?: string; sessionId?: string }>();
  return params.roomCode && params.sessionId ? <OnlineDraftScreen /> : <DraftScreen />;
}
