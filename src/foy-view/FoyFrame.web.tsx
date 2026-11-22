// Web: föy HTML'ini iframe içinde gösterir. Sayfa A4 boyutunda (794 × 1123 px) çizilir ve
// CSS zoom ile ekrana sığdırılır (iframe'e transform uygulamak Chromium'da eksik boyamaya yol açıyor).
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../ui/theme';

export const A4_PX = { width: 794, height: 1123 };

export function FoyFrame({ html, width, testID }: { html: string; width: number; testID?: string }) {
  const inner = width - 2; // kenarlık
  const scale = inner / A4_PX.width;
  const height = Math.round(A4_PX.height * scale) + 2;
  const doc = useMemo(
    () => html.replace('</head>', `<style>html{zoom:${scale.toFixed(4)};overflow:hidden}</style></head>`),
    [html, scale],
  );
  return (
    <View style={[styles.frame, { width, height }]} testID={testID}>
      <iframe
        title="foy"
        srcDoc={doc}
        data-testid={testID ? `${testID}-iframe` : undefined}
        data-html-length={html.length}
        style={{ width: inner, height: height - 2, border: 0, display: 'block', pointerEvents: 'none', background: colors.surface }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule },
});
