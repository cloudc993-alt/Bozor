import { ArrowRight, CheckCircle2, Send, ShieldCheck, Truck } from 'lucide-react';
import { SmartImage } from './SmartImage.tsx';

interface HeroSectionProps {
  onBrowseCatalog: () => void;
  onOpenTracker: () => void;
}

export function HeroSection({ onBrowseCatalog, onOpenTracker }: HeroSectionProps) {
  return (
    <section id="top" className="bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Copy Column */}
          <div className="flex flex-col justify-between gap-8 py-2 lg:col-span-6">
            <div className="space-y-6">
              <p className="text-xs font-semibold tracking-wider text-orange-400 uppercase">
                Toshkent va O&apos;zbekiston bo&apos;ylab rasmiy telefon bozori
              </p>

              <h1
                className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                Original flagman smartfonlar tezkor yetkazish bilan
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                Apple, Samsung, Xiaomi va Google Pixel smartfonlarini rasmiy 1 yillik kafolat,
                qulay narx va real vaqtda Telegram tasdiqlash tizimi bilan onlayn buyurtma qiling.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="inline-flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-orange-500 active:scale-[0.99] whitespace-nowrap shrink-0"
              >
                <span>Katalogni ko&apos;rish</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </button>

              <button
                type="button"
                onClick={onOpenTracker}
                className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors duration-150 hover:border-zinc-500 hover:text-white whitespace-nowrap shrink-0"
              >
                <span>Buyurtmani tekshirish</span>
              </button>
            </div>
          </div>

          {/* Right Hero Image Column */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 lg:col-span-6">
            <SmartImage
              src="/src/assets/images/hero_flagship_phones_1795275404631.jpg"
              alt="OlovPhone flagman titanium va olovrang aksentli smartfonlar to'plami"
              darkSurface
              className="h-64 w-full object-cover sm:h-80 lg:h-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 border-t border-white/15 pt-3 text-xs text-zinc-200">
              <span>2026 Flagman Seriya</span>
              <span className="font-mono tabular-nums text-orange-400">IMEI ro&apos;yxatdan o&apos;tgan</span>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Retail Trust Strip Below Hero Split */}
        <div
          id="afzalliklar"
          className="mt-10 grid grid-cols-1 gap-4 border-t border-zinc-800 pt-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="flex items-start gap-3.5 rounded-xl bg-zinc-900/90 p-4 border border-zinc-800/90">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-semibold text-white">100% Original Kafolat</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Barcha qurilmalar yangi, muhrlangan va IMEI tizimidan rasman o&apos;tgan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl bg-zinc-900/90 p-4 border border-zinc-800/90">
            <Send className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-semibold text-white">Real Vaqtda Telegram</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Har bir buyurtma shu zahoti operatorlar kanaliga uzatiladi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl bg-zinc-900/90 p-4 border border-zinc-800/90">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-semibold text-white">Tezkor Yetkazib Berish</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Toshkent ichida 2 soatda, viloyatlarga 24 soat ichida yetkazamiz.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl bg-zinc-900/90 p-4 border border-zinc-800/90">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-semibold text-white">Qulay To&apos;lov Turlari</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Naqd, Uzcard/Humo karta yoki 12 oygacha muddatli to&apos;lov.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
