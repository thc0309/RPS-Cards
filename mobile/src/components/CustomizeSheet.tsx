import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/app-store';
import { translate } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { useReducedMotion } from '../ui/motion';

interface CustomizeSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function CustomizeSheet({ visible, onClose }: CustomizeSheetProps) {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const vibrationEnabled = useAppStore((state) => state.vibrationEnabled);
  const setSoundEnabled = useAppStore((state) => state.setSoundEnabled);
  const setVibrationEnabled = useAppStore((state) => state.setVibrationEnabled);
  const feedback = useFeedback();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const label = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <Modal accessibilityViewIsModal animationType={reducedMotion ? 'none' : 'slide'} transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text accessibilityRole="header" style={styles.title}>{label('customizeTitle')}</Text>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Text style={styles.section}>{label('language')}</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: locale === 'vi' }} style={[styles.choice, locale === 'vi' && styles.choiceSelected]} onPress={() => { feedback.play('ui-tap'); setLocale('vi'); }}>
              <Text>{label('vietnamese')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: locale === 'en' }} style={[styles.choice, locale === 'en' && styles.choiceSelected]} onPress={() => { feedback.play('ui-tap'); setLocale('en'); }}>
              <Text>{label('english')}</Text>
            </Pressable>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label('sound')}</Text>
            <Switch accessibilityRole="switch" accessibilityLabel={label('sound')} accessibilityState={{ checked: soundEnabled }} value={soundEnabled} hitSlop={8} style={styles.switch} trackColor={{ false: '#D8B77C', true: '#A63D2F' }} onValueChange={(enabled) => {
              feedback.settingsSoundChanged(enabled);
              setSoundEnabled(enabled);
            }} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label('vibration')}</Text>
            <Switch accessibilityRole="switch" accessibilityLabel={label('vibration')} accessibilityState={{ checked: vibrationEnabled }} value={vibrationEnabled} hitSlop={8} style={styles.switch} trackColor={{ false: '#D8B77C', true: '#A63D2F' }} onValueChange={setVibrationEnabled} />
          </View>
          <Text style={styles.section}>{label('interfaceTheme')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          <Text style={styles.section}>{label('cardSkin')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          <Text style={styles.section}>{label('boardTheme')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          </ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel={label('close')} style={styles.close} onPress={() => { feedback.play('ui-tap'); onClose(); }}>
            <Text style={styles.closeText}>{label('close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(35, 23, 16, 0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF9EC', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 10, maxHeight: '90%' },
  content: { flexGrow: 0, flexShrink: 1 },
  contentInner: { gap: 10 },
  title: { color: '#43291F', fontSize: 24, fontWeight: '800' },
  section: { color: '#755846', fontSize: 14, fontWeight: '700', marginTop: 8 },
  value: { backgroundColor: '#F5E7C5', borderColor: '#D8B77C', borderRadius: 10, borderWidth: 1, color: '#43291F', padding: 12 },
  row: { flexDirection: 'row', gap: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  settingLabel: { color: '#755846', fontSize: 16, fontWeight: '700', flex: 1 },
  switch: { minHeight: 44, minWidth: 52 },
  choice: { alignItems: 'center', borderColor: '#D8B77C', borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center', padding: 8 },
  choiceSelected: { backgroundColor: '#F0CF83', borderColor: '#A63D2F' },
  close: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 12, justifyContent: 'center', marginTop: 12, minHeight: 48 },
  closeText: { color: '#FFF9EC', fontWeight: '800' },
});
