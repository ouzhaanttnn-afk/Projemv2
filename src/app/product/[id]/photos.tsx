// Adım 1: fotoğraf seç. Galeriden çoklu seçim ya da kamera. Sıra değiştirilebilir, biri kapak.
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { Photo } from '../../../foy/types';
import { t } from '../../../i18n';
import { photoStore } from '../../../photos/storage';
import { useProduct } from '../../../state/store';
import { Button, Chevron, IconButton, Kicker, Loading, Screen, StepHeader, TextAction, Thumb, TopBar } from '../../../ui/components';
import { notify } from '../../../ui/confirm';
import { colors, fonts, hairline, radius, type } from '../../../ui/theme';

const MAX_PHOTOS = 12;

export default function PhotosStep() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { product, update } = useProduct(id);
  const [busy, setBusy] = useState(false);

  if (!product) return <Loading />;
  const photos = product.photos;
  const coverId = product.coverId ?? photos[0]?.id;
  const room = MAX_PHOTOS - photos.length;

  async function addAssets(assets: ImagePicker.ImagePickerAsset[]) {
    if (!assets.length) return;
    setBusy(true);
    try {
      const added: Photo[] = [];
      for (const a of assets.slice(0, room)) {
        added.push(await photoStore.importImage({ uri: a.uri, width: a.width, height: a.height }));
      }
      update((p) => ({ photos: [...p.photos, ...added], coverId: p.coverId ?? added[0]?.id }));
    } catch (e) {
      console.warn(e);
    } finally {
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: room,
      orderedSelection: true,
      quality: 1,
    });
    if (!res.canceled) await addAssets(res.assets);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify(t('photosCameraPermission'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!res.canceled) await addAssets(res.assets);
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[index], next[j]] = [next[j], next[index]];
    update({ photos: next });
  }

  async function remove(photo: Photo) {
    update((p) => {
      const rest = p.photos.filter((x) => x.id !== photo.id);
      return {
        photos: rest,
        coverId: p.coverId === photo.id ? rest[0]?.id : p.coverId,
        options: p.options.map((o) => (o.photoId === photo.id ? { ...o, photoId: undefined } : o)),
      };
    });
    photoStore.remove(photo.ref).catch(() => {});
  }

  const next = () => {
    if (from === 'preview') router.back();
    else router.push(`/product/${product.id}/details`);
  };

  return (
    <Screen
      testID="screen-photos"
      topBar={<TopBar />}
      footer={
        <>
          {!photos.length ? <Text style={[type.small, { textAlign: 'center' }]}>{t('photosNeedOne')}</Text> : null}
          <Button label={from === 'preview' ? t('done') : t('continue')} onPress={next} disabled={!photos.length || busy} testID="next" />
        </>
      }
    >
      <StepHeader step={1} title={t('photosTitle')} intro={t('photosIntro')} />

      <View style={styles.pickRow}>
        <Button
          label={photos.length ? t('photosAddMore') : t('photosFromLibrary')}
          variant="secondary"
          onPress={pickFromLibrary}
          disabled={busy || room <= 0}
          style={{ flex: 1 }}
          testID="pick-library"
        />
        {Platform.OS !== 'web' ? (
          <Button label={t('photosFromCamera')} variant="secondary" onPress={takePhoto} disabled={busy || room <= 0} style={{ flex: 1 }} testID="pick-camera" />
        ) : null}
      </View>

      {busy ? (
        <View style={styles.busy}>
          <Loading label={t('photosWorking')} />
        </View>
      ) : null}

      <View style={{ marginTop: 18 }}>
        {photos.map((photo, i) => {
          const isCover = photo.id === coverId;
          return (
            <View key={photo.id} style={[styles.row, i === 0 && { borderTopWidth: hairline }]} testID={`photo-row-${i}`}>
              <Text style={styles.index}>{String(i + 1).padStart(2, '0')}</Text>
              <Thumb uri={photoStore.uri(photo.ref)} size={72} ratio={1.25} />
              <View style={styles.rowMid}>
                {isCover ? (
                  <View style={styles.coverBadge}>
                    <Kicker style={{ color: colors.onAccent }}>{t('photosCover')}</Kicker>
                  </View>
                ) : (
                  <TextAction label={t('photosMakeCover')} tone="accent" onPress={() => update({ coverId: photo.id })} testID={`make-cover-${i}`} />
                )}
                <TextAction label={t('photosRemove')} tone="muted" onPress={() => remove(photo)} testID={`remove-${i}`} />
              </View>
              <View style={styles.arrows}>
                <IconButton label={t('photosMoveUp')} onPress={() => move(i, -1)} disabled={i === 0} testID={`up-${i}`}>
                  <Chevron direction="up" />
                </IconButton>
                <IconButton label={t('photosMoveDown')} onPress={() => move(i, 1)} disabled={i === photos.length - 1} testID={`down-${i}`}>
                  <Chevron direction="down" />
                </IconButton>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pickRow: { flexDirection: 'row', gap: 10 },
  busy: { marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: hairline,
    borderColor: colors.rule,
  },
  index: { width: 22, fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'] },
  rowMid: { flex: 1, alignItems: 'flex-start', gap: 2 },
  coverBadge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius, marginVertical: 4 },
  arrows: { gap: 6 },
});
