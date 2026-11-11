import { ImageBackground, StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { folkAssets } from '../ui/folk-assets';

type FolkSurfaceProps = {
  readonly children: React.ReactNode;
  readonly background?: 'village' | 'paper' | 'woven';
  readonly style?: StyleProp<ViewStyle>;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly backgroundImageStyle?: StyleProp<ImageStyle>;
  readonly onLayout?: ViewProps['onLayout'];
};

export function FolkSurface({ children, background = 'paper', style, contentStyle, backgroundImageStyle, onLayout }: FolkSurfaceProps) {
  const source: ImageSourcePropType = folkAssets.backgrounds[background];
  return <View onLayout={onLayout} style={[styles.surface, style]}>
    <ImageBackground source={source} resizeMode="cover" style={styles.surface} imageStyle={[styles.image, backgroundImageStyle]}>
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.content}>
      <ImageBackground source={folkAssets.backgrounds.paper} resizeMode="repeat" style={[styles.content, contentStyle]} imageStyle={styles.paperTexture}>
        {children}
      </ImageBackground>
    </SafeAreaView>
    </ImageBackground>
  </View>;
}

const styles = StyleSheet.create({
  surface: { flex: 1, overflow: 'hidden' },
  image: { opacity: 0.98 },
  content: { flex: 1 },
  paperTexture: { opacity: 0.08 },
});
