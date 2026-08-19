import { Image, ImageBackground, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { folkAssets } from '../ui/folk-assets';

export function FolkTitle({ children, color = 'red', style }: { readonly children: React.ReactNode; readonly color?: 'red' | 'blue'; readonly style?: StyleProp<ViewStyle> }) {
  return (
    <ImageBackground source={color === 'red' ? folkAssets.controls.redPlaque : folkAssets.controls.bluePlaque} resizeMode="stretch" style={[styles.title, style]}>
      <Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.titleText}>{children}</Text>
    </ImageBackground>
  );
}

export function FolkBackButton({ label, onPress, style }: { readonly label: string; readonly onPress: () => void; readonly style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.back, style]}>
      <Image source={folkAssets.icons.back} resizeMode="contain" style={styles.backIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { alignItems: 'center', height: 86, justifyContent: 'center', maxWidth: '100%', width: 300 },
  titleText: { color: '#FFF0C6', flexShrink: 1, fontSize: 24, fontWeight: '900', paddingHorizontal: 28, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 2, width: 1 }, textShadowRadius: 2, width: '100%' },
  back: { alignItems: 'center', height: 52, justifyContent: 'center', width: 52 },
  backIcon: { height: 52, width: 52 },
});
