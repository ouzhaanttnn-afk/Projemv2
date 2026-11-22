// Adım 3: kalıp seç. Üç kalıp, gerçek föy çıktısının küçük önizlemesiyle.
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TEMPLATE_IDS, type TemplateId } from '../../../foy/types';
import { FoyFrame } from '../../../foy-view/FoyFrame';
import { htmlFor, loadPhotoSources } from '../../../foy-view/build';
import { t, type StringKey } from '../../../i18n';
import { useProduct } from '../../../state/store';
import { Button, Loading, Screen, StepHeader, TopBar } from '../../../ui/components';
import { colors, fonts, hairline, radius, type } from '../../../ui/theme';

const META: Record<TemplateId, { title: StringKey; desc: StringKey }> = {
  single: { title: 'templateSingle', desc: 'templateSingleDesc' },
  options: { title: 'templateOptions', desc: 'templateOptionsDesc' },
  story: { title: 'templateStory', desc: 'templateStoryDesc' },
};

export default function TemplateStep() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { product, update } = useProduct(id);
  const [sources, setSources] = useState<Map<string, string> | null>(null);

  const photoKey = product?.photos.map((p) => p.ref).join('|');
  useEffect(() => {
    if (!product) return;
    let alive = true;
    loadPhotoSources(product).then((s) => alive && setSources(s));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey]);

  // Kalıp seçimi değişince önizlemeler yeniden üretilmesin: yalnızca içerik değişince.
  const contentKey = product ? JSON.stringify({ ...product, template: null, updatedAt: 0 }) : '';
  const htmls = useMemo(() => {
    if (!product || !sources) return null;
    return Object.fromEntries(TEMPLATE_IDS.map((tpl) => [tpl, htmlFor(product, sources, tpl)])) as Record<TemplateId, string>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, sources]);

  if (!product) return <Loading />;
  const back = from === 'preview';

  return (
    <Screen
      testID="screen-template"
      topBar={<TopBar />}
      footer={
        <Button
          label={back ? t('done') : t('continue')}
          onPress={() => (back ? router.back() : router.push(`/product/${product.id}/check`))}
          testID="next"
        />
      }
    >
      <StepHeader step={3} title={t('templateTitle')} intro={t('templateIntro')} />
      {TEMPLATE_IDS.map((tpl, i) => {
        const on = product.template === tpl;
        return (
          <Pressable
            key={tpl}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={t(META[tpl].title)}
            onPress={() => update({ template: tpl })}
            style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && !on && { backgroundColor: colors.sunken }]}
            testID={`template-${tpl}`}
          >
            <View style={styles.thumbWrap}>
              {htmls ? <FoyFrame html={htmls[tpl]} width={104} /> : <View style={styles.thumbPlaceholder} />}
            </View>
            <View style={styles.cardText}>
              <Text style={styles.num}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.cardTitle}>{t(META[tpl].title)}</Text>
              <Text style={[type.small, { marginTop: 4 }]}>{t(META[tpl].desc)}</Text>
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: hairline,
    borderColor: colors.rule,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
  cardOn: { borderColor: colors.accent, borderWidth: 1.5, padding: 11.5 },
  thumbWrap: { width: 104 },
  thumbPlaceholder: { width: 104, height: 147, backgroundColor: colors.sunken },
  cardText: { flex: 1, paddingTop: 2 },
  num: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.accent, fontVariant: ['tabular-nums'] },
  cardTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, color: colors.ink, marginTop: 2 },
  radio: {
    marginTop: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
