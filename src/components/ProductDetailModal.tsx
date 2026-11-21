import { Battery, Camera, Cpu, Monitor, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatUzs } from '../data/catalog.ts';
import type { PhoneProduct } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface ProductDetailModalProps {
  product: PhoneProduct | null;
  onClose: () => void;
  onAddToCart: (product: PhoneProduct, storage: string, color: string, openCheckout: boolean) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedStorage(product.storages[0]?.label || '256GB');
      setSelectedColor(product.colors[0] || 'Qora Titan');
    }
  }, [product]);

  if (!product) return null;

  const storageObj =
    product.storages.find((s) => s.label === selectedStorage) || product.storages[0];
  const currentPrice = product.basePriceUzs + (storageObj ? storageObj.priceDeltaUzs : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Product Image */}
          <div className="bg-zinc-100 p-6 md:col-span-5 md:flex md:flex-col md:justify-center">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
              <SmartImage
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Hardware Spec Grid */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-zinc-200 pt-4 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Monitor className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{product.specs.display}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Cpu className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{product.specs.chipset}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Camera className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{product.specs.camera}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Battery className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{product.specs.battery}</span>
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <span className="uppercase tracking-wider text-orange-600 font-semibold">
                  {product.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.inStock ? 'Sotuvda mavjud' : 'Tugagan'}</span>
              </div>

              <h2
                id="pdp-title"
                className="font-display mt-2 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl"
              >
                {product.name}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {product.description}
              </p>

              {/* Storage Selector */}
              <div className="mt-6">
                <span className="block text-xs font-semibold text-zinc-700">
                  Xotira hajmini tanlang
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.storages.map((opt) => {
                    const active = opt.label === selectedStorage;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedStorage(opt.label)}
                        className={`min-h-[40px] cursor-pointer rounded-lg border px-4 py-2 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'border-orange-600 bg-orange-600 text-white'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div className="mt-5">
                <span className="block text-xs font-semibold text-zinc-700">
                  Korpus rangi
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const active = color === selectedColor;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`min-h-[40px] cursor-pointer rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-200 pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-zinc-500">Tanlangan konfiguratsiya narxi</span>
                <span className="font-mono text-2xl font-bold tabular-nums text-zinc-950">
                  {formatUzs(currentPrice)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => {
                    onAddToCart(product, selectedStorage, selectedColor, false);
                    onClose();
                  }}
                  className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-950 bg-white px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Savatga qo&apos;shish</span>
                </button>

                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => {
                    onAddToCart(product, selectedStorage, selectedColor, true);
                    onClose();
                  }}
                  className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  Tezkor buyurtma berish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
