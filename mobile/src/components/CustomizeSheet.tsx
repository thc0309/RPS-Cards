import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/app-store';
import { translate } from '../i18n';

interface CustomizeSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function CustomizeSheet({ visible, onClose }: CustomizeSheetProps) {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const label = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <Modal accessibilityViewIsModal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>{label('customizeTitle')}</Text>
          <Text style={styles.section}>{label('language')}</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: locale === 'vi' }} style={[styles.choice, locale === 'vi' && styles.choiceSelected]} onPress={() => setLocale('vi')}>
              <Text>{label('vietnamese')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: locale === 'en' }} style={[styles.choice, locale === 'en' && styles.choiceSelected]} onPress={() => setLocale('en')}>
              <Text>{label('english')}</Text>
            </Pressable>
          </View>
          <Text style={styles.section}>{label('interfaceTheme')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          <Text style={styles.section}>{label('cardSkin')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          <Text style={styles.section}>{label('boardTheme')}</Text>
          <Text style={styles.value}>{label('defaultTheme')}</Text>
          <Pressable accessibilityRole="button" style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>{label('close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(35, 23, 16, 0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF9EC', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 10 },
  title: { color: '#43291F', fontSize: 24, fontWeight: '800' },
  section: { color: '#755846', fontSize: 14, fontWeight: '700', marginTop: 8 },
  value: { backgroundColor: '#F5E7C5', borderColor: '#D8B77C', borderRadius: 10, borderWidth: 1, color: '#43291F', padding: 12 },
  row: { flexDirection: 'row', gap: 10 },
  choice: { alignItems: 'center', borderColor: '#D8B77C', borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center' },
  choiceSelected: { backgroundColor: '#F0CF83', borderColor: '#A63D2F' },
  close: { alignItems: 'center', backgroundColor: '#A63D2F', borderRadius: 12, justifyContent: 'center', marginTop: 12, minHeight: 48 },
  closeText: { color: '#FFF9EC', fontWeight: '800' },
});
