// Telefon: föyü PDF'e çevirir (expo-print) ve paylaşım menüsünü açar (expo-sharing).
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { Product } from '../foy/types';
import { t } from '../i18n';
import { fileNameFor } from './build';

// A4 dikey, 72 dpi nokta cinsinden.
const A4_PT = { width: 595, height: 842 };

export async function exportPdf(product: Product, html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html,
    width: A4_PT.width,
    height: A4_PT.height,
    margins: { left: 0, right: 0, top: 0, bottom: 0 },
  });
  // Dosyaya anlamlı bir ad ver (ör. ova-vazo-foy.pdf).
  let shareUri = uri;
  try {
    const named = new File(Paths.cache, `${fileNameFor(product)}.pdf`);
    if (named.exists) named.delete();
    await new File(uri).copy(named);
    shareUri = named.uri;
  } catch {
    // adlandırılamazsa geçici dosya paylaşılır
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('previewShare') });
  } else {
    await Print.printAsync({ uri: shareUri });
  }
}

export const canDownloadHtml = false;
export function downloadHtml(_product: Product, _html: string) {}
