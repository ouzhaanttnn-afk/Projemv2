import type { Photo } from '../foy/types';

/** Seçiciden gelen görsel (expo-image-picker varlığının ihtiyaç duyulan kısmı). */
export type PickedImage = { uri: string; width: number; height: number };

export type PhotoStore = {
  init(): Promise<void>;
  /** Görseli küçültür, JPEG'e çevirir ve uygulama deposuna kopyalar. */
  importImage(image: PickedImage): Promise<Photo>;
  /** Ekranda göstermek için adres. */
  uri(ref: string): string;
  /** Föye gömmek için data: URL. */
  dataUrl(ref: string): Promise<string | undefined>;
  remove(ref: string): Promise<void>;
};

/** Föy için yeterli çözünürlük: A4 genişliğinde ~250 dpi. */
export const MAX_EDGE = 2000;
export const JPEG_QUALITY = 0.84;
