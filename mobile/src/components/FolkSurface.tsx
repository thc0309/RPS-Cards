import { ImageBackground, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { folkAssets } from '../ui/folk-assets';

type FolkSurfaceProps = {
  readonly children: React.ReactNode;
  readonly background?: 'village' | 'paper';
  readonly style?: StyleProp<ViewStyle>;
  readonly contentStyle?: StyleProp<ViewStyle>;
};

export function FolkSurface({ children, background = 'paper', style, contentStyle }: FolkSurfaceProps) {
  const source: ImageSourcePropType = folkAssets.backgrounds[background];
  return <ImageBackground source={source} resizeMode="cover" style={[styles.surface, style]} imageStyle={styles.image}>
    <ImageBackground source={folkAssets.backgrounds.paper} resizeMode="repeat" style={[styles.content, contentStyle]} imageStyle={styles.paperTexture}>
      {children}
    </ImageBackground>
  </ImageBackground>;
}

const styles = StyleSheet.create({
  surface: { flex: 1, overflow: 'hidden' },
  image: { opacity: 0.98 },
  content: { flex: 1 },
  paperTexture: { opacity: 0.08 },
});
