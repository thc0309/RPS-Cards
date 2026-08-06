import { ImageBackground, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { folkAssets } from '../ui/folk-assets';

export function FolkPanel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={[styles.panel, style]} imageStyle={styles.image}>
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', padding: 18 },
  image: { opacity: 0.98 },
  content: { minHeight: 160 },
});
