// Web: tarayıcının yazdırma penceresi açılır; kullanıcı hedef olarak "PDF olarak kaydet"i seçer.
// Ayrıca föy tek dosya HTML olarak indirilebilir.
import type { Product } from '../foy/types';
import { fileNameFor } from './build';

export async function exportPdf(product: Product, html: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  await new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    frame.srcdoc = html;
  });
  const win = frame.contentWindow;
  if (!win) return;
  try {
    await (win.document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    // yazı tipi beklenemezse yine de yazdır
  }
  win.focus();
  win.print();
  setTimeout(() => frame.remove(), 60_000);
}

export const canDownloadHtml = true;

export function downloadHtml(product: Product, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileNameFor(product)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
