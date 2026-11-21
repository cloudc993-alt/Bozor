import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatUzs } from '../data/catalog.ts';
import type { PhoneBrand, PhoneCategory, PhoneProduct } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface CatalogSectionProps {
  products: PhoneProduct[];
  loading: boolean;
  onSelectProduct: (product: PhoneProduct) => void;
  onQuickAddToCart: (product: PhoneProduct) => void;
}

const BRAND_FILTERS: Array<'Barchasi' | PhoneBrand> = ['Barchasi', 'Apple', 'Samsung', 'Xiaomi', 'Google'];
const CATEGORY_FILTERS: Array<'Barchasi' | PhoneCategory> = ['Barchasi', 'Flagman', 'Bukiluvchi', 'Ommabop'];

export function CatalogSection({
  products,
  loading,
  onSelectProduct,
  onQuickAddToCart,
}: CatalogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<'Barchasi' | PhoneBrand>('Barchasi');
  const [selectedCategory, setSelectedCategory] = useState<'Barchasi' | PhoneCategory>('Barchasi');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedBrand !== 'Barchasi' && p.brand !== selectedBrand) return false;
      if (selectedCategory !== 'Barchasi' && p.category !== selectedCategory) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.specs.chipset}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.basePriceUzs - b.basePriceUzs);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.basePriceUzs - a.basePriceUzs);
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, searchQuery, selectedBrand, selectedCategory, sortBy]);

  return (
    <section id="katalog" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase">
              Smartfonlar katalogi
            </p>
            <h2 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Ommabop va flagman modellar
            </h2>
          </div>
          <p className="text-sm text-zinc-500">
            Jami <span className="font-mono font-semibold tabular-nums text-zinc-950">{filteredProducts.length}</span> ta model topildi
          </p>
        </div>

        {/* Interactive Filter & Search Toolbar */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Brand Segmented Controls */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-zinc-100 p-1.5">
              {BRAND_FILTERS.map((brand) => {
                const active = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`min-h-[38px] cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-white/70 hover:text-zinc-950'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Model yoki brend qidirish..."
                  aria-label="Telefon qidirish"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pr-4 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                aria-label="Saralash"
                className="h-11 cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="featured">Tavsiya etilgan</option>
                <option value="price-asc">Arzonidan qimmatiga</option>
                <option value="price-desc">Qimmatidan arzoniga</option>
              </select>
            </div>
          </div>

          {/* Category Sub-Menu Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-zinc-500">Toifa:</span>
            {CATEGORY_FILTERS.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[36px] cursor-pointer rounded-lg border px-3 py-1 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[420px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-14 text-center">
            <p className="font-display text-lg font-bold text-zinc-900">
              Mos smartfon topilmadi
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Qidiruv so&apos;zini o&apos;zgartiring yoki filtrlarni tozalang.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBrand('Barchasi');
                setSelectedCategory('Barchasi');
              }}
              className="mt-4 inline-flex min-h-[40px] cursor-pointer items-center rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const firstStorage = product.storages[0]?.label || '256GB';
              return (
                <article
                  key={product.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:border-zinc-300"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="block w-full cursor-pointer overflow-hidden bg-zinc-100 text-left focus-visible:outline-2 focus-visible:outline-orange-500"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                        <SmartImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      </div>
                    </button>

                    <div className="p-5">
                      {/* Unboxed clean metadata with typographic separators */}
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <span className="uppercase tracking-wide text-zinc-700">{product.brand}</span>
                        <span aria-hidden="true">·</span>
                        <span>{firstStorage}</span>
                        <span aria-hidden="true">·</span>
                        <span className={product.inStock ? 'text-zinc-700' : 'text-red-600 font-semibold'}>
                          {product.inStock ? 'Mavjud' : 'Sotuvda yo‘q'}
                        </span>
                      </div>

                      <h3 className="font-display mt-2 text-lg font-bold tracking-tight text-zinc-950">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="cursor-pointer text-left hover:text-orange-600"
                        >
                          {product.name}
                        </button>
                      </h3>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                        {product.specs.display} · {product.specs.chipset}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4">
                    <div>
                      <span className="block text-[11px] font-medium text-zinc-400">
                        Boshlang&apos;ich narx
                      </span>
                      <span className="font-mono text-base font-bold tabular-nums text-zinc-950">
                        {formatUzs(product.basePriceUzs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="inline-flex min-h-[40px] cursor-pointer items-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-950 whitespace-nowrap shrink-0"
                      >
                        Batafsil
                      </button>

                      <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={() => onQuickAddToCart(product)}
                        className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                        <span>Savatga</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
