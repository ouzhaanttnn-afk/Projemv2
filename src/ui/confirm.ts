import { Alert, Platform } from 'react-native';
import { t } from '../i18n';

/** Onay sorusu. Web'de tarayıcının onay kutusu, telefonda sistem uyarısı. */
export function confirm(message: string, okLabel: string = t('delete')): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
  }
  return new Promise((resolve) => {
    Alert.alert('', message, [
      { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  Alert.alert('', message);
}
