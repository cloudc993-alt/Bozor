import { PackageSearch } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatUzs } from '../data/catalog.ts';
import type { OrderItemRecord, OrderStatus } from '../types.ts';

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  items: OrderItemRecord[];
  totalUzs: number;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export function OrderTrackerSection() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setTracked(null);

    const cleanedOrder = orderNumber.trim().replace(/^#/, '');
    const cleanedLast4 = phoneLast4.replace(/\D/g, '').slice(-4);

    if (!cleanedOrder || cleanedLast4.length !== 4) {
      setError('Buyurtma raqami (masalan OP-1001) va telefon oxirgi 4 raqamini kiriting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(cleanedOrder)}?phoneLast4=${encodeURIComponent(cleanedLast4)}`
      );
      const data = (await res.json()) as { error?: string; order?: TrackedOrder };
      if (!res.ok || !data.order) {
        setError(data.error || 'Buyurtma topilmadi.');
        return;
      }
      setTracked(data.order);
    } catch {
      setError("Server bilan bog'lanishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kuzatuv" className="border-t border-zinc-200 bg-zinc-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase">
              Buyurtma kuzatuvi
            </p>
            <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
              Buyurtmangiz holatini tekshiring
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Buyurtma rasmiylashtirilgandan so&apos;ng berilgan maxsus raqam va telefon
              raqamingizning oxirgi 4 ta raqami orqali jarayonni kuzating.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 lg:col-span-7">
            <form onSubmit={handleTrack} className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Buyurtma raqami
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="OP-1001"
                  className="font-mono h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Telefon oxirgi 4 raqami
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="4567"
                  className="font-mono h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end sm:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:bg-zinc-400"
                >
                  <PackageSearch className="h-4 w-4" />
                  <span>{loading ? '...' : 'Tekshirish'}</span>
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            {tracked && (
              <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                  <div>
                    <span className="text-xs text-zinc-500">Buyurtma</span>
                    <p className="font-mono text-lg font-bold text-zinc-950">
                      #{tracked.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500">Joriy holat</span>
                    <p className="text-sm font-bold text-orange-600">{tracked.status}</p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
                  {tracked.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-4">
                      <span>
                        {item.name} ({item.storage} · {item.color}) × {item.quantity}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-zinc-950">
                        {formatUzs(item.lineTotalUzs)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 text-sm font-bold">
                  <span className="text-zinc-700">Jami summa ({tracked.region})</span>
                  <span className="font-mono tabular-nums text-zinc-950">
                    {formatUzs(tracked.totalUzs)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
