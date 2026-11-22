// Ürünler: kayıtlı föylerin listesi. Boşken tek bir çağrı: "İlk föyünü hazırla".
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { orderedPhotos } from '../foy/data';
import type { Product } from '../foy/types';
import { t } from '../i18n';
import { photoStore } from '../photos/storage';
import { useStore } from '../state/store';
import { Button, Chevron, Kicker, Rule, Screen, TextAction, Thumb } from '../ui/components';
import { colors, fonts, hairline, type } from '../ui/theme';

const TEMPLATE_LABEL = { single: 'templateSingle', options: 'templateOptions', story: 'templateStory' } as const;

export default function Products() {
  const store = useStore();

  // Yarım kalmış boş taslakları listeye dönünce temizle.
  useFocusEffect(
    useCallback(() => {
      store.pruneEmptyDrafts();
    }, [store.pruneEmptyDrafts]),
  );

  const products = store.products.filter((p) => p.photos.length > 0 || p.name.trim());

  const startNew = () => {
    const p = store.createProduct();
    router.push(`/product/${p.id}/photos`);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.wordmark} accessibilityRole="header">
        Föy
      </Text>
      <TextAction label={t('settings')} onPress={() => router.push('/settings')} testID="open-settings" />
    </View>
  );

  if (!products.length) {
    return (
      <Screen testID="screen-products-empty" contentStyle={{ flex: 1 }}>
        {header}
        <Rule strong />
        <View style={styles.empty}>
          <Kicker accent>{t('productsEmptyEyebrow')}</Kicker>
          <Text style={[type.display, { marginTop: 14 }]}>{t('productsEmptyTitle')}</Text>
          <Text style={[type.bodyMuted, { marginTop: 14 }]}>{t('productsEmptyBody')}</Text>
          <SheetSketch />
          <Button label={t('productsEmptyCta')} onPress={startNew} testID="cta-first" style={{ marginTop: 28 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      testID="screen-products"
      footer={<Button label={t('productsNew')} onPress={startNew} testID="cta-new" />}
    >
      {header}
      <Rule strong />
      <View style={styles.listHead}>
        <Text style={type.title}>{t('productsTitle')}</Text>
        <Text style={[type.small, styles.count]}>{products.length}</Text>
      </View>
      {products.map((p, i) => (
        <ProductRow key={p.id} product={p} index={i} />
      ))}
    </Screen>
  );
}

function ProductRow({ product, index }: { product: Product; index: number }) {
  const cover = orderedPhotos(product)[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.name || t('productsUntitled')}
      onPress={() => router.push(`/product/${product.id}/preview`)}
      style={({ pressed }) => [styles.row, index === 0 && { borderTopWidth: hairline }, pressed && { backgroundColor: colors.sunken }]}
      testID={`product-row-${index}`}
    >
      <Thumb uri={cover ? photoStore.uri(cover.ref) : ''} size={64} ratio={1.25} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {product.name.trim() || t('productsUntitled')}
        </Text>
        <Text style={[type.small, { marginTop: 4 }]} numberOfLines={1}>
          {t(TEMPLATE_LABEL[product.template])} · {t('productsPhotoCount', { n: product.photos.length })}
        </Text>
      </View>
      <Chevron direction="right" size={8} color={colors.faint} />
    </Pressable>
  );
}

/** Boş ekrandaki küçük föy çizimi: başlık, fotoğraf, tablo satırları. Yalnızca çizgiler. */
function SheetSketch() {
  return (
    <View style={styles.sketch} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.sketchPage}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.sketchLine, { width: 28, backgroundColor: colors.accent }]} />
          <View style={[styles.sketchLine, { width: 18 }]} />
        </View>
        <View style={[styles.sketchRule, { marginTop: 5 }]} />
        <View style={[styles.sketchTitle]} />
        <View style={styles.sketchPhoto} />
        <View style={[styles.sketchRule, { marginTop: 8 }]} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.sketchRow}>
            <View style={[styles.sketchLine, { width: 22 }]} />
            <View style={[styles.sketchLine, { width: 34, backgroundColor: colors.ink, opacity: 0.55 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 12 },
  wordmark: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink, letterSpacing: -0.4 },
  empty: { flex: 1, justifyContent: 'center', paddingVertical: 32 },
  listHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, marginBottom: 14 },
  count: { fontVariant: ['tabular-nums'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: hairline,
    borderColor: colors.rule,
  },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 24, color: colors.ink },
  sketch: { marginTop: 28, alignItems: 'flex-start' },
  sketchPage: {
    width: 132,
    height: 186,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.rule,
    padding: 12,
  },
  sketchLine: { height: 3, backgroundColor: colors.rule },
  sketchRule: { height: hairline, backgroundColor: colors.ink },
  sketchTitle: { height: 9, width: 64, backgroundColor: colors.ink, marginTop: 9 },
  sketchPhoto: { flex: 1, backgroundColor: colors.sunken, marginTop: 9 },
  sketchRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: hairline, borderColor: colors.rule },
});
