import { Image, ImageBackground, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { folkAssets } from '../ui/folk-assets';

type FolkButtonProps = {
  readonly children: React.ReactNode;
  readonly variant?: 'red' | 'blue';
  readonly icon?: ImageSourcePropType;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function FolkButton({ children, variant = 'red', icon, onPress, disabled = false, accessibilityLabel, style }: FolkButtonProps) {
  const source = variant === 'red' ? folkAssets.controls.redButton : folkAssets.controls.blueButton;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.pressable, style, disabled && styles.disabled]}>
    <ImageBackground source={source} resizeMode="stretch" style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.content}>
        {icon ? <Image source={icon} resizeMode="contain" style={styles.icon} /> : null}
        <Text style={styles.label}>{children}</Text>
      </View>
    </ImageBackground>
  </Pressable>;
}

const styles = StyleSheet.create({
  pressable: { minHeight: 72, width: '100%' },
  background: { flex: 1, justifyContent: 'center' },
  backgroundImage: { resizeMode: 'stretch' },
  content: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 22 },
  icon: { height: 38, width: 38 },
  label: { color: '#FFF0C6', fontSize: 20, fontWeight: '900', letterSpacing: 0.4, textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 2 },
  disabled: { opacity: 0.55 },
});
