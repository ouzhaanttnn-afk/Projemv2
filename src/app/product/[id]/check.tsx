// Adım 4: eksik kontrolü. Her boş alan için: "Şimdi ekle" ya da "Föyde gösterme".
// Uygulama hiçbir bilgiyi kendisi doldurmaz; boş alan föyde hiç görünmez.
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { findMissing, findSkipped, type MissingItem } from '../../../foy/data';
import type { FieldKey } from '../../../foy/types';
import { t, type StringKey } from '../../../i18n';
import { useProduct } from '../../../state/store';
import { Button, Kicker, Loading, Rule, Screen, StepHeader, TextAction, TopBar } from '../../../ui/components';
import { colors, fonts, hairline, type } from '../../../ui/theme';

const COPY: Record<FieldKey, { title: StringKey; body: StringKey }> = {
  name: { title: 'missName', body: 'missNameBody' },
  description: { title: 'missDescription', body: 'missDescriptionBody' },
  specs: { title: 'missSpecs', body: 'missSpecsBody' },
  material: { title: 'missMaterial', body: 'missMaterialBody' },
  options: { title: 'missOptions', body: 'missOptionsBody' },
  optionPhotos: { title: 'missOptionPhotos', body: 'missOptionPhotosBody' },
  price: { title: 'missPrice', body: 'missPriceBody' },
  contact: { title: 'missContact', body: 'missContactBody' },
  notes: { title: 'missNotes', body: 'missNotesBody' },
};

export default function CheckStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, update } = useProduct(id);
  if (!product) return <Loading />;

  const missing = findMissing(product);
  const skipped = findSkipped(product);
  const pending = missing.length;

  const addNow = (key: FieldKey) => router.push(`/product/${product.id}/details?focus=${key}&from=check`);
  const skip = (key: FieldKey) => update((p) => ({ skipped: [...new Set([...p.skipped, key])] }));
  const unskip = (key: FieldKey) => update((p) => ({ skipped: p.skipped.filter((k) => k !== key) }));

  return (
    <Screen
      testID="screen-check"
      topBar={<TopBar />}
      footer={
        <>
          {pending ? <Text style={[type.small, { textAlign: 'center' }]}>{t('checkPending', { n: pending })}</Text> : null}
          <Button label={t('continue')} onPress={() => router.push(`/product/${product.id}/preview`)} disabled={pending > 0} testID="next" />
        </>
      }
    >
      <StepHeader step={4} title={t('checkTitle')} intro={t('checkIntro')} />

      {pending === 0 ? (
        <View style={styles.allGood} testID="check-all-good">
          <View style={styles.tick} />
          <View style={{ flex: 1 }}>
            <Text style={styles.allGoodTitle}>{t('checkAllGood')}</Text>
            <Text style={[type.small, { marginTop: 2 }]}>{t('checkAllGoodBody')}</Text>
          </View>
        </View>
      ) : (
        <View style={{ borderTopWidth: hairline, borderColor: colors.ink }}>
          {missing.map((m) => (
            <MissingRow key={m.key} item={m} onAdd={() => addNow(m.key)} onSkip={() => skip(m.key)} />
          ))}
        </View>
      )}

      {skipped.length ? (
        <View style={{ marginTop: 28 }}>
          <Kicker>{t('checkSkippedTitle')}</Kicker>
          <Rule style={{ marginTop: 8 }} />
          {skipped.map((m) => (
            <View key={m.key} style={styles.skippedRow} testID={`skipped-${m.key}`}>
              <Text style={[type.bodyMuted, styles.strike]}>{t(COPY[m.key].title)}</Text>
              <TextAction label={t('checkUndo')} tone="ink" onPress={() => unskip(m.key)} testID={`undo-${m.key}`} />
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function MissingRow({ item, onAdd, onSkip }: { item: MissingItem; onAdd: () => void; onSkip: () => void }) {
  const copy = COPY[item.key];
  return (
    <View style={styles.row} testID={`missing-${item.key}`}>
      <View style={styles.rowHead}>
        <Text style={styles.rowTitle}>{t(copy.title)}</Text>
        {item.required ? <Kicker accent>{t('checkRequired')}</Kicker> : null}
      </View>
      <Text style={[type.small, { marginTop: 3 }]}>{t(copy.body, { n: item.count ?? 0 })}</Text>
      <View style={styles.actions}>
        <Button label={t('checkAddNow')} variant="secondary" small onPress={onAdd} testID={`add-${item.key}`} />
        {!item.required ? <Button label={t('checkSkip')} variant="quiet" small onPress={onSkip} testID={`skip-${item.key}`} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: hairline, borderColor: colors.rule },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 22, color: colors.ink, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  skippedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: hairline, borderColor: colors.rule },
  strike: { textDecorationLine: 'line-through', textDecorationColor: colors.faint },
  allGood: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 16, borderTopWidth: hairline, borderBottomWidth: hairline, borderColor: colors.ink },
  tick: {
    width: 14,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.accent,
    transform: [{ rotate: '-45deg' }],
    marginHorizontal: 4,
    marginBottom: 4,
  },
  allGoodTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, color: colors.ink },
});
