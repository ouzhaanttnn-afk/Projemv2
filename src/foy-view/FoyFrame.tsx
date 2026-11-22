// Telefon: föy HTML'ini WebView içinde A4 oranında gösterir.
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../ui/theme';

export const A4_PX = { width: 794, height: 1123 };

export function FoyFrame({ html, width, testID }: { html: string; width: number; testID?: string }) {
  const height = Math.round((width * A4_PX.height) / A4_PX.width);
  return (
    <View style={[styles.frame, { width, height }]} testID={testID}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width, height, backgroundColor: colors.surface }}
        scrollEnabled={false}
        scalesPageToFit
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setBuiltInZoomControls={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule },
});
