import { Image, Modal, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useContext } from 'react';
import { translate, type TranslationKey } from '../i18n';
import { useAppStore } from '../store/app-store';
import { folkAssets } from '../ui/folk-assets';
import { useReducedMotion } from '../ui/motion';
import { FolkButton } from './FolkButton';

const steps: readonly { readonly key: TranslationKey; readonly art: readonly ImageSourcePropType[] }[] = [
  { key: 'howStep1', art: [folkAssets.cards.rock, folkAssets.cards.paper, folkAssets.cards.scissors] },
  { key: 'howStep2', art: [folkAssets.cards.back] },
  { key: 'howStep3', art: [folkAssets.board.vs] },
  { key: 'howStep4', art: [folkAssets.board.scoreRed] },
];

export function HowToPlaySheet({ visible, onClose }: { readonly visible: boolean; readonly onClose: () => void }) {
  const locale = useAppStore((state) => state.locale);
  const reducedMotion = useReducedMotion();
  // Tolerates rendering outside a SafeAreaProvider (previews, unit tests).
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const text = (key: TranslationKey) => translate(locale, key);
  return <Modal accessibilityViewIsModal animationType={reducedMotion ? 'none' : 'slide'} transparent statusBarTranslucent visible={visible} onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View testID="how-to-play" style={[styles.sheet, { paddingBottom: Math.max(bottomInset, 16) }]}>
        <Text accessibilityRole="header" style={styles.title}>{text('howToPlay')}</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.steps} showsVerticalScrollIndicator={false}>
          {steps.map((step, index) => <View key={step.key} style={styles.step}>
            <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
            <View style={styles.art}>{step.art.map((source, artIndex) => <Image key={artIndex} source={source} resizeMode="contain" style={step.art.length > 1 ? styles.artSmall : styles.artSingle} />)}</View>
            <Text style={styles.stepText}>{text(step.key)}</Text>
          </View>)}
          <Text style={styles.tip}>{text('howTip')}</Text>
        </ScrollView>
        <FolkButton accessibilityLabel={text('gotIt')} onPress={onClose} style={styles.button}>{text('gotIt')}</FolkButton>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(24,14,10,0.6)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F7E6B0', borderColor: '#8C5A2C', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 3, maxHeight: '88%', paddingHorizontal: 16, paddingTop: 16 },
  title: { color: '#8A241A', fontSize: 24, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  steps: { gap: 10, paddingBottom: 10 },
  step: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.45)', borderColor: 'rgba(140,90,44,0.4)', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 72, padding: 10 },
  number: { alignItems: 'center', backgroundColor: '#8A241A', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  numberText: { color: '#FFF0C6', fontSize: 15, fontWeight: '900' },
  art: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 74 },
  artSmall: { height: 30, width: 24 },
  artSingle: { height: 48, width: 48 },
  stepText: { color: '#43291F', flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  tip: { color: '#3F6B35', fontSize: 14, fontWeight: '800', paddingHorizontal: 6, textAlign: 'center' },
  button: { marginTop: 8, minHeight: 58 },
});
