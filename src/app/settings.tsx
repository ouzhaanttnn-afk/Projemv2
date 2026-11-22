// Ayarlar: varsayılan iletişim bilgisi, veri notu, dil, ve ödeme için tek yer tutucu ("Yakında").
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Contact } from '../foy/types';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { Button, Field, Kicker, Screen, Section, TopBar } from '../ui/components';
import { colors, fonts, hairline, radius, type } from '../ui/theme';

export default function Settings() {
  const store = useStore();
  const [draft, setDraft] = useState<Contact>(store.defaultContact);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(store.defaultContact), [store.defaultContact]);
  const set = (patch: Partial<Contact>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };

  return (
    <Screen testID="screen-settings" topBar={<TopBar />}>
      <Text style={type.title} accessibilityRole="header">
        {t('settingsTitle')}
      </Text>

      <Section title={t('settingsContact')} hint={t('settingsContactHint')}>
        <Field label={t('fieldContactName')} value={draft.name} onChangeText={(name) => set({ name })} maxLength={60} />
        <Field label={t('fieldContactPhone')} value={draft.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" maxLength={40} />
        <Field label={t('fieldContactEmail')} value={draft.email} onChangeText={(email) => set({ email })} keyboardType="email-address" autoCapitalize="none" maxLength={80} />
        <Field label={t('fieldContactWeb')} value={draft.web} onChangeText={(web) => set({ web })} autoCapitalize="none" maxLength={80} />
        <Button
          label={saved ? t('settingsSaved') : t('settingsSave')}
          variant="secondary"
          onPress={() => {
            store.setDefaultContact(draft);
            setSaved(true);
          }}
          testID="settings-save"
        />
      </Section>

      <Section title={t('settingsProSection')}>
        <View style={styles.pro} testID="pro-placeholder">
          <View style={{ flex: 1 }}>
            <Text style={styles.proTitle}>{t('settingsPro')}</Text>
            <Text style={[type.small, { marginTop: 4 }]}>{t('settingsProBody')}</Text>
          </View>
          <View style={styles.soon}>
            <Kicker>{t('settingsSoon')}</Kicker>
          </View>
        </View>
      </Section>

      <Section title={t('settingsData')}>
        <Text style={type.bodyMuted}>{t('settingsDataBody')}</Text>
      </Section>

      <Section title={t('settingsLanguage')}>
        <Text style={type.bodyMuted}>{t('settingsLanguageBody')}</Text>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: hairline,
    borderColor: colors.rule,
    borderRadius: radius,
    backgroundColor: colors.surface,
  },
  proTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  soon: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: hairline, borderColor: colors.rule, borderRadius: radius },
});
