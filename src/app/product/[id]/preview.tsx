// Adım 5: önizleme ve paylaş. Önizleme, PDF ile aynı HTML'i kullanır.
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FoyFrame } from '../../../foy-view/FoyFrame';
import { htmlFor, loadPhotoSources } from '../../../foy-view/build';
import { canDownloadHtml, downloadHtml, exportPdf } from '../../../foy-view/exportPdf';
import { t } from '../../../i18n';
import { useProduct } from '../../../state/store';
import { Button, Kicker, Loading, Rule, Screen, StepHeader, TextAction, TopBar } from '../../../ui/components';
import { confirm, notify } from '../../../ui/confirm';
import { colors, gutter, maxContentWidth, type } from '../../../ui/theme';

export default function PreviewStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, store } = useProduct(id);
  const { width: winW } = useWindowDimensions();
  const [sources, setSources] = useState<Map<string, string> | null>(null);
  const [busy, setBusy] = useState(false);

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

  const html = useMemo(() => (product && sources ? htmlFor(product, sources) : null), [product, sources]);

  if (!product) return <Loading />;
  const frameW = Math.min(winW, maxContentWidth + gutter * 2) - gutter * 2;

  async function share() {
    if (!html || !product) return;
    setBusy(true);
    try {
      await exportPdf(product, html);
    } catch (e) {
      console.warn(e);
      notify(t('previewShareError'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product) return;
    if (!(await confirm(t('previewDeleteConfirm')))) return;
    await store.deleteProduct(product.id);
    router.dismissTo('/');
  }

  const edit = (step: 'photos' | 'details' | 'template') => router.push(`/product/${product.id}/${step}?from=preview`);
  const isWeb = Platform.OS === 'web';

  return (
    <Screen
      testID="screen-preview"
      topBar={<TopBar right={<TextAction label={t('previewBackToList')} onPress={() => router.dismissTo('/')} testID="to-list" />} />}
      footer={
        <>
          <Button label={isWeb ? t('previewPrintWeb') : t('previewShare')} onPress={share} busy={busy} disabled={!html} testID="share" />
          {isWeb && canDownloadHtml ? (
            <Button label={t('previewDownloadHtml')} variant="quiet" small onPress={() => html && downloadHtml(product, html)} disabled={!html} testID="download-html" />
          ) : null}
        </>
      }
    >
      <StepHeader step={5} title={t('previewTitle')} />
      {html ? <FoyFrame html={html} width={frameW} testID="foy-preview" /> : <View style={{ height: frameW * 1.414 }}><Loading label={t('previewLoading')} /></View>}
      {isWeb ? <Text style={[type.small, { marginTop: 10 }]}>{t('previewWebHint')}</Text> : null}

      <View style={{ marginTop: 24 }}>
        <Kicker>{t('previewEdit')}</Kicker>
        <Rule strong style={{ marginTop: 8 }} />
        <View style={styles.editRow}>
          <TextAction label={t('stepPhotos')} onPress={() => edit('photos')} testID="edit-photos" />
          <Text style={styles.sep}>·</Text>
          <TextAction label={t('stepDetails')} onPress={() => edit('details')} testID="edit-details" />
          <Text style={styles.sep}>·</Text>
          <TextAction label={t('stepTemplate')} onPress={() => edit('template')} testID="edit-template" />
        </View>
        <Rule />
        <View style={{ marginTop: 12, alignItems: 'flex-start' }}>
          <TextAction label={t('previewDelete')} tone="accent" onPress={remove} testID="delete" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  sep: { color: colors.faint },
});
