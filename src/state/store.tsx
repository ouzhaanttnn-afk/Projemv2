// Uygulama durumu: ürünler ve varsayılan iletişim bilgisi. Yalnızca cihazda saklanır (AsyncStorage).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { photoStore } from '../photos/storage';
import { EMPTY_CONTACT, type Contact, type Product } from '../foy/types';
import { newId } from './id';

const KEY_PRODUCTS = 'foy.products.v1';
const KEY_CONTACT = 'foy.contact.v1';

type Store = {
  ready: boolean;
  products: Product[];
  defaultContact: Contact;
  getProduct(id: string): Product | undefined;
  createProduct(): Product;
  updateProduct(id: string, patch: Partial<Product> | ((p: Product) => Partial<Product>)): void;
  deleteProduct(id: string): Promise<void>;
  setDefaultContact(c: Contact): void;
  /** Hiç fotoğrafı ve adı olmayan yarım kalmış taslakları siler. */
  pruneEmptyDrafts(exceptId?: string): void;
};

const Ctx = createContext<Store | null>(null);

function blankProduct(contact: Contact): Product {
  const now = Date.now();
  return {
    id: newId(),
    name: '',
    description: '',
    specs: [{ id: newId(), label: '', value: '' }],
    material: '',
    options: [],
    price: '',
    contact: { ...contact },
    photos: [],
    template: 'single',
    skipped: [],
    createdAt: now,
    updatedAt: now,
  };
}

function isEmptyDraft(p: Product) {
  return p.photos.length === 0 && !p.name.trim();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [defaultContact, setDefaultContactState] = useState<Contact>(EMPTY_CONTACT);
  const productsRef = useRef(products);
  productsRef.current = products;
  const defaultContactRef = useRef(defaultContact);
  defaultContactRef.current = defaultContact;

  useEffect(() => {
    (async () => {
      try {
        await photoStore.init();
        const [rawProducts, rawContact] = await Promise.all([
          AsyncStorage.getItem(KEY_PRODUCTS),
          AsyncStorage.getItem(KEY_CONTACT),
        ]);
        if (rawProducts) setProducts(JSON.parse(rawProducts));
        if (rawContact) setDefaultContactState({ ...EMPTY_CONTACT, ...JSON.parse(rawContact) });
      } catch (e) {
        console.warn('Föy: kayıtlı veriler okunamadı', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Değişiklikleri kısa bir gecikmeyle kaydet.
  useEffect(() => {
    if (!ready) return;
    const h = setTimeout(() => {
      AsyncStorage.setItem(KEY_PRODUCTS, JSON.stringify(products)).catch((e) => console.warn('Föy: kayıt hatası', e));
    }, 250);
    return () => clearTimeout(h);
  }, [products, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY_CONTACT, JSON.stringify(defaultContact)).catch(() => {});
  }, [defaultContact, ready]);

  const getProduct = useCallback((id: string) => productsRef.current.find((p) => p.id === id), []);

  const createProduct = useCallback(() => {
    const p = blankProduct(defaultContactRef.current);
    setProducts((list) => [p, ...list]);
    productsRef.current = [p, ...productsRef.current];
    return p;
  }, []);

  const updateProduct = useCallback<Store['updateProduct']>((id, patch) => {
    setProducts((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const changes = typeof patch === 'function' ? patch(p) : patch;
        const next = { ...p, ...changes, updatedAt: Date.now() };
        return next;
      }),
    );
    // İletişim bilgisi bir kez girilir; sonraki ürünler için hatırlanır.
    if (typeof patch === 'object' && patch.contact) {
      setDefaultContactState(patch.contact);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const p = productsRef.current.find((x) => x.id === id);
    setProducts((list) => list.filter((x) => x.id !== id));
    if (p) await Promise.all(p.photos.map((ph) => photoStore.remove(ph.ref).catch(() => {})));
  }, []);

  const pruneEmptyDrafts = useCallback((exceptId?: string) => {
    if (!productsRef.current.some((p) => p.id !== exceptId && isEmptyDraft(p))) return;
    setProducts((list) => list.filter((p) => p.id === exceptId || !isEmptyDraft(p)));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      products,
      defaultContact,
      getProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      setDefaultContact: setDefaultContactState,
      pruneEmptyDrafts,
    }),
    [ready, products, defaultContact, getProduct, createProduct, updateProduct, deleteProduct, pruneEmptyDrafts],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider eksik');
  return s;
}

/** Ekranlar için: id ile ürünü ve güncelleyiciyi verir. */
export function useProduct(id: string | undefined) {
  const store = useStore();
  const product = store.products.find((p) => p.id === id);
  const update = useCallback(
    (patch: Partial<Product> | ((p: Product) => Partial<Product>)) => {
      if (id) store.updateProduct(id, patch);
    },
    [id, store.updateProduct],
  );
  return { product, update, store };
}
