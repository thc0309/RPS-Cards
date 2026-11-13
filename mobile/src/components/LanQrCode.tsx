import { useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

export function LanQrCode({ value, label }: { readonly value: string; readonly label: string }) {
  const matrix = useMemo(() => {
    const qr = qrcode(0, 'M'); qr.addData(value); qr.make();
    return Array.from({ length: qr.getModuleCount() }, (_, y) => Array.from({ length: qr.getModuleCount() }, (_, x) => qr.isDark(y, x)));
  }, [value]);
  const cell = Math.floor(220 / (matrix.length + 8));
  return <View testID="lan-qr" accessible accessibilityRole="image" accessibilityLabel={label} style={{ backgroundColor: '#fff', padding: cell * 4, alignSelf: 'center' }}>
    {matrix.map((row, y) => <View key={y} style={{ flexDirection: 'row' }}>{row.map((dark, x) => <View key={x} style={{ width: cell, height: cell, backgroundColor: dark ? '#111' : '#fff' }} />)}</View>)}
  </View>;
}
