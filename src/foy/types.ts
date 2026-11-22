// Föy kalıplarının ve ürün kaydının veri tipleri.
// Bu dosya React Native'e bağlı değildir; testlerde ve Node'da da kullanılır.

export type Lang = 'tr' | 'en';

export type TemplateId = 'single' | 'options' | 'story';

export const TEMPLATE_IDS: TemplateId[] = ['single', 'options', 'story'];

/** Kayıtlı bir fotoğraf. `ref` depolama başvurusudur (cihaz dosyası ya da web deposu). */
export type Photo = {
  id: string;
  ref: string;
  width: number;
  height: number;
  /** "Bunu neden seçtin?" notu; isteğe bağlı. */
  note: string;
};

export type Spec = { id: string; label: string; value: string };

export type ProductOption = { id: string; name: string; photoId?: string };

export type Contact = {
  name: string;
  phone: string;
  email: string;
  web: string;
};

export const EMPTY_CONTACT: Contact = { name: '', phone: '', email: '', web: '' };

/** Eksik kontrolünde sorulan alanlar. */
export type FieldKey =
  | 'name'
  | 'description'
  | 'specs'
  | 'material'
  | 'options'
  | 'optionPhotos'
  | 'price'
  | 'contact'
  | 'notes';

export type Product = {
  id: string;
  name: string;
  description: string;
  specs: Spec[];
  material: string;
  options: ProductOption[];
  price: string;
  contact: Contact;
  photos: Photo[];
  coverId?: string;
  template: TemplateId;
  /** Kullanıcının "föyde gösterme" dediği boş alanlar. */
  skipped: FieldKey[];
  createdAt: number;
  updatedAt: number;
};

// ---- Kalıp girdisi ----

export type FoyPhoto = { src: string; note: string; width?: number; height?: number };

export type FoyOption = { name: string; src?: string };

/**
 * Kalıp fonksiyonlarının girdisi. Fotoğraflar `src` içinde gömülü (data: URL) gelir.
 * Boş metinler föyde hiç görünmez; kalıplar hiçbir değeri kendisi uydurmaz.
 */
export type FoyData = {
  lang: Lang;
  name: string;
  description: string;
  specs: { label: string; value: string }[];
  material: string;
  options: FoyOption[];
  price: string;
  contact: Contact;
  /** İlk eleman kapak fotoğrafıdır. */
  photos: FoyPhoto[];
  /** Notlar föyde gösterilsin mi (Hikâye kalıbı). */
  showNotes: boolean;
  /** Seçenek fotoğrafları ızgarada gösterilsin mi (Seçenekler kalıbı). */
  showOptionPhotos: boolean;
};

export type RenderOptions = {
  /** "Föy ile hazırlandı" imzası. Varsayılan: açık. */
  signature?: boolean;
};
