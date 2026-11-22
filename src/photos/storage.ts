// Telefon: fotoğraflar uygulamanın belge klasörüne (Documents/photos) kopyalanır.
// Kayıtta yalnızca dosya adı tutulur; iOS'ta uygulama klasörünün yolu güncellemelerde değişebilir.
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { newId } from '../state/id';
import { JPEG_QUALITY, MAX_EDGE, type PhotoStore } from './types';

function photoDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

export const photoStore: PhotoStore = {
  async init() {
    const dir = photoDir();
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  },

  async importImage(image) {
    const ctx = ImageManipulator.manipulate(image.uri);
    if (Math.max(image.width, image.height) > MAX_EDGE) {
      ctx.resize(image.width >= image.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    }
    const rendered = await ctx.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    const id = newId();
    const name = `${id}.jpg`;
    const tmp = new File(result.uri);
    const dest = new File(photoDir(), name);
    await tmp.copy(dest);
    try {
      tmp.delete();
    } catch {
      // geçici dosya zaten silinmiş olabilir
    }
    return { id, ref: name, width: result.width, height: result.height, note: '' };
  },

  uri(ref) {
    return new File(photoDir(), ref).uri;
  },

  async dataUrl(ref) {
    const file = new File(photoDir(), ref);
    if (!file.exists) return undefined;
    return `data:image/jpeg;base64,${await file.base64()}`;
  },

  async remove(ref) {
    const file = new File(photoDir(), ref);
    if (file.exists) file.delete();
  },
};
