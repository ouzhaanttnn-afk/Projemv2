// Web: fotoğraflar tarayıcının IndexedDB deposunda (data: URL olarak) tutulur.
// Ürün kayıtları localStorage'da kaldığı için büyük görseller oraya yazılmaz.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { newId } from '../state/id';
import { JPEG_QUALITY, MAX_EDGE, type PhotoStore } from './types';

const DB = 'foy';
const STORE = 'photos';
const cache = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function toDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export const photoStore: PhotoStore = {
  async init() {
    if (typeof indexedDB === 'undefined') return;
    const keys = (await tx('readonly', (s) => s.getAllKeys())) as string[];
    const values = (await tx('readonly', (s) => s.getAll())) as string[];
    keys.forEach((k, i) => cache.set(String(k), values[i]));
  },

  async importImage(image) {
    const ctx = ImageManipulator.manipulate(image.uri);
    if (Math.max(image.width, image.height) > MAX_EDGE) {
      ctx.resize(image.width >= image.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    }
    const rendered = await ctx.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
    const dataUrl = result.base64 ? `data:image/jpeg;base64,${result.base64}` : await toDataUrl(result.uri);
    const id = newId();
    await tx('readwrite', (s) => s.put(dataUrl, id));
    cache.set(id, dataUrl);
    return { id, ref: id, width: result.width, height: result.height, note: '' };
  },

  uri(ref) {
    return cache.get(ref) ?? '';
  },

  async dataUrl(ref) {
    return cache.get(ref);
  },

  async remove(ref) {
    cache.delete(ref);
    await tx('readwrite', (s) => s.delete(ref));
  },
};
