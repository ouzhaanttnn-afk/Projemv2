// Adım 2: ürün bilgileri. Yalnızca kullanıcının yazdıkları föye girer.
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { orderedPhotos } from '../../../foy/data';
import type { Contact, FieldKey, Product } from '../../../foy/types';
import { t } from '../../../i18n';
import { photoStore } from '../../../photos/storage';
import { newId } from '../../../state/id';
import { useProduct } from '../../../state/store';
import { Button, Field, Loading, Screen, Section, StepHeader, TextAction, Thumb, TopBar } from '../../../ui/components';
import { colors, hairline, radius, type } from '../../../ui/theme';

export default function DetailsStep() {
  const { id, focus, from } = useLocalSearchParams<{ id: string; focus?: FieldKey; from?: string }>();
  const { product, update } = useProduct(id);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionY = useRef<Partial<Record<string, number>>>({});
  const inputs = useRef<Partial<Record<string, TextInputInstance | null>>>({});

  // "Şimdi ekle" ile gelindiyse ilgili alana kaydır ve odakla.
  useEffect(() => {
    if (!focus || !product) return;
    if (focus === 'options' && !product.options.length) addOption();
    const h = setTimeout(() => {
      const section = focus === 'optionPhotos' ? 'options' : focus;
      const y = sectionY.current[section];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      const target =
        focus === 'specs'
          ? inputs.current['spec-0-label']
          : focus === 'options'
            ? inputs.current['option-0']
            : focus === 'contact'
              ? inputs.current['contact-name']
              : focus === 'notes'
                ? inputs.current[`note-${firstEmptyNote(product)}`]
                : inputs.current[focus];
      target?.focus();
    }, 380);
    return () => clearTimeout(h);
    // yalnızca ilk açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, !!product]);

  if (!product) return <Loading />;
  const p = product;
  const photos = orderedPhotos(p);

  function setContact(patch: Partial<Contact>) {
    update({ contact: { ...p.contact, ...patch } });
  }
  function addOption() {
    update((cur) => ({ options: [...cur.options, { id: newId(), name: '' }] }));
  }

  const back = from === 'check' || from === 'preview';
  const next = () => (back ? router.back() : router.push(`/product/${p.id}/template`));
  const at = (key: string) => (y: number) => {
    sectionY.current[key] = y;
  };

  return (
    <Screen
      testID="screen-details"
      scrollRef={scrollRef}
      topBar={<TopBar />}
      footer={<Button label={back ? t('done') : t('continue')} onPress={next} testID="next" />}
    >
      <StepHeader step={2} title={t('detailsTitle')} intro={t('detailsIntro')} />

      <View onLayout={(e) => at('name')(e.nativeEvent.layout.y)}>
        <Field
          ref={(r) => {
            inputs.current.name = r;
          }}
          label={t('fieldName')}
          placeholder={t('fieldNamePh')}
          value={p.name}
          onChangeText={(name) => update({ name })}
          maxLength={60}
          returnKeyType="next"
          testID="field-name"
        />
      </View>
      <View onLayout={(e) => at('description')(e.nativeEvent.layout.y)}>
        <Field
          ref={(r) => {
            inputs.current.description = r;
          }}
          label={t('fieldDescription')}
          placeholder={t('fieldDescriptionPh')}
          value={p.description}
          onChangeText={(description) => update({ description })}
          multiline
          maxLength={280}
          counter
          testID="field-description"
        />
      </View>

      <Section title={t('fieldSpecs')} hint={t('fieldSpecsHint')} onLayout={at('specs')}>
        {p.specs.map((s, i) => (
          <View key={s.id} style={styles.specRow}>
            <Field
              ref={(r) => {
                inputs.current[`spec-${i}-label`] = r;
              }}
              containerStyle={{ flex: 0.85, marginBottom: 0 }}
              placeholder={t('fieldSpecLabelPh')}
              value={s.label}
              maxLength={24}
              onChangeText={(label) => update((cur) => ({ specs: cur.specs.map((x) => (x.id === s.id ? { ...x, label } : x)) }))}
              accessibilityLabel={`${t('fieldSpecs')} ${i + 1}`}
              testID={`spec-label-${i}`}
            />
            <Field
              containerStyle={{ flex: 1.15, marginBottom: 0 }}
              placeholder={t('fieldSpecValuePh')}
              value={s.value}
              maxLength={40}
              onChangeText={(value) => update((cur) => ({ specs: cur.specs.map((x) => (x.id === s.id ? { ...x, value } : x)) }))}
              testID={`spec-value-${i}`}
            />
            <TextAction
              label={t('remove')}
              tone="muted"
              onPress={() => update((cur) => ({ specs: cur.specs.filter((x) => x.id !== s.id) }))}
              accessibilityLabel={`${t('remove')} ${s.label}`}
            />
          </View>
        ))}
        <TextAction
          label={`+ ${t('fieldSpecAdd')}`}
          tone="accent"
          onPress={() => update((cur) => ({ specs: [...cur.specs, { id: newId(), label: '', value: '' }] }))}
          disabled={p.specs.length >= 8}
          testID="spec-add"
        />
      </Section>

      <Section title={t('fieldMaterial')} onLayout={at('material')}>
        <Field
          ref={(r) => {
            inputs.current.material = r;
          }}
          placeholder={t('fieldMaterialPh')}
          value={p.material}
          maxLength={80}
          onChangeText={(material) => update({ material })}
          accessibilityLabel={t('fieldMaterial')}
          testID="field-material"
        />
      </Section>

      <Section title={t('fieldOptions')} hint={t('fieldOptionsHint')} onLayout={at('options')}>
        {p.options.map((o, i) => (
          <View key={o.id} style={styles.option} testID={`option-${i}`}>
            <View style={styles.optionTop}>
              <Field
                ref={(r) => {
                  inputs.current[`option-${i}`] = r;
                }}
                containerStyle={{ flex: 1, marginBottom: 0 }}
                placeholder={t('fieldOptionPh')}
                value={o.name}
                maxLength={24}
                onChangeText={(name) => update((cur) => ({ options: cur.options.map((x) => (x.id === o.id ? { ...x, name } : x)) }))}
                accessibilityLabel={`${t('fieldOptions')} ${i + 1}`}
                testID={`option-name-${i}`}
              />
              <TextAction label={t('remove')} tone="muted" onPress={() => update((cur) => ({ options: cur.options.filter((x) => x.id !== o.id) }))} />
            </View>
            {photos.length ? (
              <>
                <Text style={[type.small, { marginTop: 8 }]}>{t('fieldOptionPhoto')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionPhotos}>
                  {photos.map((ph, j) => {
                    const on = o.photoId === ph.id;
                    return (
                      <Pressable
                        key={ph.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${t('fieldOptionPhoto')} ${j + 1}`}
                        onPress={() =>
                          update((cur) => ({ options: cur.options.map((x) => (x.id === o.id ? { ...x, photoId: on ? undefined : ph.id } : x)) }))
                        }
                        style={[styles.optionThumb, on && styles.optionThumbOn]}
                        testID={`option-${i}-photo-${j}`}
                      >
                        <Thumb uri={photoStore.uri(ph.ref)} size={44} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
          </View>
        ))}
        <TextAction label={`+ ${t('fieldOptionAdd')}`} tone="accent" onPress={addOption} disabled={p.options.length >= 8} testID="option-add" />
      </Section>

      <Section title={`${t('fieldPrice')} · ${t('optional')}`} onLayout={at('price')}>
        <Field
          ref={(r) => {
            inputs.current.price = r;
          }}
          placeholder={t('fieldPricePh')}
          value={p.price}
          maxLength={30}
          onChangeText={(price) => update({ price })}
          accessibilityLabel={t('fieldPrice')}
          testID="field-price"
        />
      </Section>

      <Section title={t('fieldContact')} hint={t('fieldContactHint')} onLayout={at('contact')}>
        <Field
          ref={(r) => {
            inputs.current['contact-name'] = r;
          }}
          label={t('fieldContactName')}
          value={p.contact.name}
          maxLength={60}
          onChangeText={(name) => setContact({ name })}
          testID="contact-name"
        />
        <Field label={t('fieldContactPhone')} value={p.contact.phone} maxLength={40} keyboardType="phone-pad" onChangeText={(phone) => setContact({ phone })} testID="contact-phone" />
        <Field
          label={t('fieldContactEmail')}
          value={p.contact.email}
          maxLength={80}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(email) => setContact({ email })}
          testID="contact-email"
        />
        <Field label={t('fieldContactWeb')} value={p.contact.web} maxLength={80} autoCapitalize="none" autoCorrect={false} onChangeText={(web) => setContact({ web })} testID="contact-web" />
      </Section>

      <Section title={t('fieldNotes')} hint={t('fieldNotesHint')} onLayout={at('notes')}>
        {photos.map((ph, i) => (
          <View key={ph.id} style={[styles.noteRow, i === 0 && { borderTopWidth: hairline }]}>
            <Thumb uri={photoStore.uri(ph.ref)} size={56} ratio={1.25} />
            <Field
              ref={(r) => {
                inputs.current[`note-${i}`] = r;
              }}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              placeholder={t('fieldNotePh')}
              value={ph.note}
              maxLength={120}
              multiline
              style={{ minHeight: 70 }}
              onChangeText={(note) => update((cur) => ({ photos: cur.photos.map((x) => (x.id === ph.id ? { ...x, note } : x)) }))}
              accessibilityLabel={`${t('fieldNotes')} ${i + 1}`}
              testID={`note-${i}`}
            />
          </View>
        ))}
      </Section>
    </Screen>
  );
}

function firstEmptyNote(p: Product): number {
  const i = orderedPhotos(p).findIndex((x) => !x.note.trim());
  return Math.max(0, i);
}

const styles = StyleSheet.create({
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  option: { paddingBottom: 12, marginBottom: 12, borderBottomWidth: hairline, borderColor: colors.rule },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionPhotos: { gap: 8, paddingTop: 8 },
  optionThumb: { padding: 2, borderWidth: 1.5, borderColor: 'transparent', borderRadius: radius },
  optionThumbOn: { borderColor: colors.accent },
  noteRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: hairline, borderColor: colors.rule },
});
