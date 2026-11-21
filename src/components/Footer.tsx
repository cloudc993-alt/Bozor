interface FooterProps {
  onNavigateView: (view: 'store' | 'admin', sectionId?: string) => void;
}

export function Footer({ onNavigateView }: FooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              Olov<span className="text-orange-500">Phone</span>
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
              Original smartfonlar onlayn bozori. Tezkor buyurtma, halol narxlar va real vaqtda
              operator nazorati.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-white">Bo&apos;limlar</h3>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateView('store', 'katalog')}
                  className="cursor-pointer hover:text-orange-400"
                >
                  Telefonlar katalogi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateView('store', 'kuzatuv')}
                  className="cursor-pointer hover:text-orange-400"
                >
                  Buyurtma holatini tekshirish
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateView('admin')}
                  className="cursor-pointer hover:text-orange-400"
                >
                  Admin boshqaruv paneli
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-white">Ish vaqti va aloqa</h3>
            <p className="text-zinc-400">Har kuni: 09:00 — 22:00</p>
            <p className="text-zinc-400">Toshkent sh., Malika savdo majmuasi</p>
            <p className="font-mono text-orange-400">+998 (71) 200-00-00</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} OlovPhone. Barcha huquqlar himoyalangan.</p>
          <p>Original kafolatli smartfonlar do&apos;koni</p>
        </div>
      </div>
    </footer>
  );
}
