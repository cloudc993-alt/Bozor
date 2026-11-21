import { CheckCircle2, Minus, Plus, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { UZ_REGIONS, formatUzs } from '../data/catalog.ts';
import type { CartItem, PaymentMethod } from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface OrderReceipt {
  orderNumber: string;
  totalUzs: number;
  status: string;
  telegramStatus: 'sent' | 'failed' | 'unconfigured';
  telegramError?: string;
}

interface CartCheckoutDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export function CartCheckoutDrawer({
  open,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartCheckoutDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998 ');
  const [region, setRegion] = useState(UZ_REGIONS[0]);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('naqd');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPriceUzs * item.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg("Savat bo'sh. Avval telefon tanlang.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          region,
          address,
          paymentMethod,
          note,
          items: items.map((item) => ({
            productId: item.productId,
            storage: item.storage,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: OrderReceipt;
      };

      if (!response.ok || !data.order) {
        setErrorMsg(data.error || "Buyurtmani yuborishda xatolik yuz berdi.");
        return;
      }

      setReceipt(data.order);
      onClearCart();
      setCustomerName('');
      setCustomerPhone('+998 ');
      setAddress('');
      setNote('');
    } catch {
      setErrorMsg("Server bilan aloqa o'rnatilmadi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Savat va onlayn buyurtma"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-orange-600" />
            <h2 className="font-display text-lg font-extrabold text-zinc-950">
              {receipt ? 'Buyurtma rasmiylashtirildi' : 'Savat va Buyurtma'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setErrorMsg('');
              onClose();
            }}
            aria-label="Savatni yopish"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {receipt ? (
            <div className="space-y-5 py-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase">
                      Buyurtma qabul qilindi
                    </p>
                    <p className="font-mono text-2xl font-bold text-zinc-950">
                      #{receipt.orderNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Jami summa</span>
                    <span className="font-mono font-bold tabular-nums text-zinc-950">
                      {formatUzs(receipt.totalUzs)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Holati</span>
                    <span className="font-semibold text-zinc-900">{receipt.status}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500">Telegram kanal</span>
                    <span className="text-right text-xs font-semibold">
                      {receipt.telegramStatus === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Send className="h-3.5 w-3.5" />
                          Real vaqtda kanalga yuborildi
                        </span>
                      ) : (
                        <span className="text-orange-700">
                          Saqlandi ({receipt.telegramError || 'Bot sozlanmagan'})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-600">
                Buyurtma raqamingizni saqlab qo&apos;ying. Saytning &laquo;Buyurtma kuzatuvi&raquo;
                bo&apos;limi orqali holatini istalgan vaqtda tekshirishingiz mumkin.
              </p>

              <button
                type="button"
                onClick={() => {
                  setReceipt(null);
                  onClose();
                }}
                className="w-full cursor-pointer rounded-xl bg-zinc-950 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                Xaridni davom ettirish
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-300" strokeWidth={1.4} />
              <p className="font-display mt-4 text-lg font-bold text-zinc-900">
                Savatingiz hozircha bo&apos;sh
              </p>
              <p className="mt-1 max-w-xs text-sm text-zinc-500">
                Katalogdan o&apos;zingizga yoqqan smartfonni tanlab, savatga qo&apos;shing.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 cursor-pointer rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500"
              >
                Katalogga o&apos;tish
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <ul className="divide-y divide-zinc-200 border-b border-zinc-200 pb-4">
                {items.map((item, idx) => (
                  <li
                    key={`${item.productId}-${item.storage}-${item.color}`}
                    className="flex items-start gap-3.5 py-3.5"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      <SmartImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-zinc-950">{item.name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {item.storage} · {item.color}
                      </p>
                      <p className="font-mono mt-1 text-sm font-bold tabular-nums text-orange-600">
                        {formatUzs(item.unitPriceUzs * item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        aria-label="O'chirish"
                        className="cursor-pointer text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, -1)}
                          aria-label="Kamaytirish"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center text-zinc-700 hover:text-zinc-950"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono w-7 text-center text-xs font-semibold tabular-nums text-zinc-950">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, 1)}
                          aria-label="Ko'paytirish"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center text-zinc-700 hover:text-zinc-950"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-base font-bold text-zinc-950">
                  Yetkazib berish ma&apos;lumotlari
                </h3>

                {errorMsg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Ism va familiyangiz
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masalan: Azizbek Karimov"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Telefon raqamingiz
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="font-mono h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-700">
                      Hudud / Viloyat
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="h-11 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                    >
                      {UZ_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-700">
                      To&apos;lov turi
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="h-11 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="naqd">Naqd pul</option>
                      <option value="karta">Karta (Uzcard / Humo)</option>
                      <option value="muddatli">Muddatli to&apos;lov</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Aniq manzil
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={250}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tuman, ko'cha, uy yoki mo'ljal"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Qo&apos;shimcha izoh (ixtiyoriy)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Yetkazish vaqti yoki qo'shimcha istaklar..."
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {!receipt && items.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-600">Jami to&apos;lov:</span>
              <span className="font-mono text-xl font-extrabold tabular-nums text-zinc-950">
                {formatUzs(subtotal)}
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="mt-3 inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-500 disabled:cursor-wait disabled:bg-zinc-400"
            >
              <Send className="h-4 w-4" />
              <span>
                {submitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
