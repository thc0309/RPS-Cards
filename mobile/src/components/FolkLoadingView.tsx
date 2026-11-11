import { StyleSheet } from 'react-native';
import { FolkTitle } from './FolkChrome';
import { FolkSurface } from './FolkSurface';

export function FolkLoadingView({ label }: { readonly label: string }) {
  return <FolkSurface background="woven" contentStyle={styles.content}><FolkTitle>{label}</FolkTitle></FolkSurface>;
}

const styles = StyleSheet.create({ content: { alignItems: 'center', flex: 1, justifyContent: 'center' } });
