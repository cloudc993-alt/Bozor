import { CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel.tsx';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer.tsx';
import { CatalogSection } from './components/CatalogSection.tsx';
import { Footer } from './components/Footer.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrderTrackerSection } from './components/OrderTrackerSection.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { INITIAL_PRODUCTS } from './data/catalog.ts';
import type { CartItem, PhoneProduct } from './types.ts';

const CART_STORAGE_KEY = 'olovphone_cart_v1';

export default function App() {
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useState<PhoneProduct[]>(INITIAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PhoneProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastText, setToastText] = useState('');

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore invalid localStorage
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore quota errors
    }
  }, [cartItems]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = (await res.json()) as { products?: PhoneProduct[] };
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch {
      // Keep fallback INITIAL_PRODUCTS
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => setToastText(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  const handleNavigateView = (view: 'store' | 'admin', sectionId?: string) => {
    setActiveView(view);
    if (view === 'store' && sectionId) {
      window.setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 40);
    } else if (view === 'admin') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (
    product: PhoneProduct,
    storage: string,
    color: string,
    openCheckout: boolean
  ) => {
    const storageOpt = product.storages.find((s) => s.label === storage) || product.storages[0];
    const unitPriceUzs = product.basePriceUzs + (storageOpt ? storageOpt.priceDeltaUzs : 0);
    const chosenStorage = storageOpt ? storageOpt.label : '256GB';
    const chosenColor = color || product.colors[0] || 'Qora Titan';

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.storage === chosenStorage &&
          item.color === chosenColor
      );
      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: Math.min(10, item.quantity + 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          imageUrl: product.imageUrl,
          storage: chosenStorage,
          color: chosenColor,
          unitPriceUzs,
          quantity: 1,
        },
      ];
    });

    if (openCheckout) {
      setCartOpen(true);
    } else {
      setToastText(`${product.name} (${chosenStorage}) savatga qo'shildi`);
    }
  };

  const handleQuickAdd = (product: PhoneProduct) => {
    const firstStorage = product.storages[0]?.label || '256GB';
    const firstColor = product.colors[0] || 'Qora Titan';
    handleAddToCart(product, firstStorage, firstColor, false);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item, idx) => {
          if (idx !== index) return item;
          const nextQty = item.quantity + delta;
          return nextQty <= 0 ? null : { ...item, quantity: Math.min(10, nextQty) };
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <Navbar
        cartCount={totalCartCount}
        activeView={activeView}
        onNavigateView={handleNavigateView}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'admin' ? (
          <AdminPanel
            onBackToStore={() => handleNavigateView('store', 'top')}
            onProductsChanged={() => void loadProducts()}
          />
        ) : (
          <>
            <HeroSection
              onBrowseCatalog={() => handleNavigateView('store', 'katalog')}
              onOpenTracker={() => handleNavigateView('store', 'kuzatuv')}
            />

            <CatalogSection
              products={products}
              loading={loadingProducts}
              onSelectProduct={(product) => setSelectedProduct(product)}
              onQuickAddToCart={handleQuickAdd}
            />

            <OrderTrackerSection />
          </>
        )}
      </main>

      <Footer onNavigateView={handleNavigateView} />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartCheckoutDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
      />

      {/* Non-intrusive Cart Toast Feedback */}
      {toastText && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />
          <span>{toastText}</span>
          <button
            type="button"
            onClick={() => {
              setToastText('');
              setCartOpen(true);
            }}
            className="ml-2 cursor-pointer text-xs font-bold text-orange-400 underline underline-offset-4 hover:text-orange-300"
          >
            Savatni ochish
          </button>
        </div>
      )}
    </div>
  );
}
