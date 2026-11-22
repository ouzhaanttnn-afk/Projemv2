// Cihaz diline göre Türkçe ya da İngilizce. Türkçe dışındaki diller İngilizce açılır.
import { getLocales } from 'expo-localization';
import { translate, type StringKey } from './strings';
import type { Lang } from '../foy/types';

function detectLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

export const lang: Lang = detectLang();

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  return translate(lang, key, vars);
}

/** Dile uygun büyük harf (Türkçede i → İ). */
export function upper(s: string): string {
  return s.toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US');
}

export type { StringKey };
