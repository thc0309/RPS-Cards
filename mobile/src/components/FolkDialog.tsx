import { ImageBackground, Modal, StyleSheet, Text, View } from 'react-native';
import { folkAssets } from '../ui/folk-assets';
import { useReducedMotion } from '../ui/motion';
import { FolkButton } from './FolkButton';

/** Two-choice confirmation. The safe choice is primary so an accidental tap keeps the player in place. */
export function FolkDialog({ visible, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return <Modal accessibilityViewIsModal animationType={reducedMotion ? 'none' : 'fade'} transparent statusBarTranslucent visible={visible} onRequestClose={onCancel}>
    <View style={styles.backdrop}>
      <ImageBackground testID="folk-dialog" source={folkAssets.controls.paperPanel} resizeMode="stretch" imageStyle={styles.panelImage} style={styles.panel}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <FolkButton accessibilityLabel={cancelLabel} onPress={onCancel} style={styles.button}>{cancelLabel}</FolkButton>
          <FolkButton variant="blue" cue="paper-slide" accessibilityLabel={confirmLabel} onPress={onConfirm} style={styles.button}>{confirmLabel}</FolkButton>
        </View>
      </ImageBackground>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(24,14,10,0.72)', flex: 1, justifyContent: 'center', padding: 20 },
  panel: { maxWidth: 340, width: '100%' },
  panelImage: { height: '100%', width: '100%' },
  content: { alignItems: 'center', gap: 8, paddingHorizontal: '13%', paddingVertical: 40 },
  title: { color: '#8A241A', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  body: { color: '#5A3521', fontSize: 15, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  button: { minHeight: 56 },
});
