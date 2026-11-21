import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  cartCount: number;
  activeView: 'store' | 'admin';
  onNavigateView: (view: 'store' | 'admin', sectionId?: string) => void;
  onOpenCart: () => void;
}

export function Navbar({
  cartCount,
  activeView,
  onNavigateView,
  onOpenCart,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (view: 'store' | 'admin', sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigateView(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('store', 'top')}
          className="font-display cursor-pointer text-xl font-extrabold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          Olov<span className="text-orange-600">Phone</span>
        </button>

        {/* Zone 2: 4 Single-line Nav Links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
          <button
            type="button"
            onClick={() => handleLinkClick('store', 'katalog')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-zinc-950 ${
              activeView === 'store' ? 'text-zinc-950' : ''
            }`}
          >
            Katalog
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('store', 'afzalliklar')}
            className="cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-zinc-950"
          >
            Afzalliklar
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('store', 'kuzatuv')}
            className="cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-zinc-950"
          >
            Buyurtma kuzatuvi
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('admin')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-orange-600 ${
              activeView === 'admin' ? 'font-semibold text-orange-600 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Admin panel
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-orange-600 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            <span>Savat</span>
            <span className="font-mono tabular-nums text-orange-400">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-900 transition-colors hover:bg-zinc-100 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Interactive Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleLinkClick('store', 'katalog')}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              <span>Katalog</span>
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('store', 'afzalliklar')}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              <span>Afzalliklar</span>
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('store', 'kuzatuv')}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              <span>Buyurtma kuzatuvi</span>
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-orange-600 hover:bg-orange-50"
            >
              <span>Admin panel</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
