import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { formatUzs } from '../data/catalog.ts';
import type {
  OrderRecord,
  OrderStatus,
  PhoneBrand,
  PhoneCategory,
  PhoneProduct,
  TelegramConfigSummary,
} from '../types.ts';
import { SmartImage } from './SmartImage.tsx';

interface AdminPanelProps {
  onBackToStore: () => void;
  onProductsChanged: () => void;
}

const IMAGE_PRESETS = [
  {
    label: 'Qora Titan Flagman',
    url: '/src/assets/images/phone_pro_titanium_1795275404531.jpg',
  },
  {
    label: 'Olovrang Maxsus Edition',
    url: '/src/assets/images/phone_orange_edition_1795275404894.jpg',
  },
  {
    label: 'Bukiluvchi Ultra',
    url: '/src/assets/images/phone_foldable_ultra_1795275404646.jpg',
  },
  {
    label: 'Oq Keramika',
    url: '/src/assets/images/phone_compact_white_1795275404679.jpg',
  },
];

const ORDER_STATUSES: OrderStatus[] = [
  'Yangi',
  'Tasdiqlangan',
  'Yolda',
  'Yetkazildi',
  'Bekor qilindi',
];

export function AdminPanel({ onBackToStore, onProductsChanged }: AdminPanelProps) {
  // Auth state held strictly in React memory (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string>('');
  const [requiresSetup, setRequiresSetup] = useState<boolean | null>(null);
  const [envPasscodeConfigured, setEnvPasscodeConfigured] = useState(false);

  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard data
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'telegram'>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [telegramInfo, setTelegramInfo] = useState<TelegramConfigSummary | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [actionBanner, setActionBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Order filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<'Barchasi' | OrderStatus>('Barchasi');

  // New Product form
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState<PhoneBrand>('Apple');
  const [newCategory, setNewCategory] = useState<PhoneCategory>('Flagman');
  const [newPrice, setNewPrice] = useState('12500000');
  const [newImageUrl, setNewImageUrl] = useState(IMAGE_PRESETS[0].url);
  const [newColors, setNewColors] = useState('Qora Titan, Olovrang');
  const [newDisplay, setNewDisplay] = useState('6.7" LTPO OLED 120Hz');
  const [newChipset, setNewChipset] = useState('Flagman 3nm Protsessor');
  const [newCamera, setNewCamera] = useState('50MP OIS Pro Kamera');
  const [newBattery, setNewBattery] = useState('5000 mAh · Tez zaryad');
  const [newDesc, setNewDesc] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Telegram settings form
  const [botTokenInput, setBotTokenInput] = useState('');
  const [channelIdInput, setChannelIdInput] = useState('-1004316865165');
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth-status')
      .then((res) => res.json())
      .then((data: { requiresSetup?: boolean; envPasscodeConfigured?: boolean }) => {
        if (!active) return;
        setRequiresSetup(Boolean(data.requiresSetup));
        setEnvPasscodeConfigured(Boolean(data.envPasscodeConfigured));
      })
      .catch(() => {
        if (active) setRequiresSetup(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchOverview = useCallback(async (token: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setAdminToken('');
        setAuthError('Sessiya muddati tugadi. Qayta kiring.');
        return;
      }
      const data = (await res.json()) as {
        orders: OrderRecord[];
        products: PhoneProduct[];
        telegram: TelegramConfigSummary;
      };
      setOrders(data.orders || []);
      setProducts(data.products || []);
      if (data.telegram) {
        setTelegramInfo(data.telegram);
        setChannelIdInput(data.telegram.channelId || '-1004316865165');
      }
    } catch {
      setActionBanner({ type: 'err', text: "Ma'lumotlarni yuklashda xatolik." });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      void fetchOverview(adminToken);
    }
  }, [adminToken, fetchOverview]);

  const handleSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (passcodeInput.length < 6) {
      setAuthError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (passcodeInput !== confirmInput) {
      setAuthError('Parollar bir-biriga mos kelmadi.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || "Parolni o'rnatib bo'lmadi.");
        return;
      }
      setRequiresSetup(false);
      setAdminToken(data.token);
      setPasscodeInput('');
      setConfirmInput('');
    } catch {
      setAuthError("Server bilan bog'lanishda xatolik.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || "Parol noto'g'ri.");
        return;
      }
      setAdminToken(data.token);
      setPasscodeInput('');
    } catch {
      setAuthError("Server bilan bog'lanishda xatolik.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status, notifyTelegram: true }),
      });
      const data = (await res.json()) as { order?: OrderRecord; error?: string };
      if (!res.ok || !data.order) {
        setActionBanner({ type: 'err', text: data.error || 'Holatni yangilab bo‘lmadi.' });
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order! : o)));
      setActionBanner({ type: 'ok', text: `#${data.order.orderNumber} holati "${status}" ga o'zgartirildi.` });
    } catch {
      setActionBanner({ type: 'err', text: 'Tarmoq xatosi.' });
    }
  };

  const handleResendTelegram = async (orderId: string) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/resend-telegram`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as {
        order?: OrderRecord;
        telegram?: { sent: boolean; error?: string };
        error?: string;
      };
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order! : o)));
      }
      if (data.telegram?.sent) {
        setActionBanner({ type: 'ok', text: 'Buyurtma Telegram kanalga muvaffaqiyatli yuborildi!' });
      } else {
        setActionBanner({
          type: 'err',
          text: data.telegram?.error || data.error || 'Telegramga yuborib bo‘lmadi.',
        });
      }
    } catch {
      setActionBanner({ type: 'err', text: 'Telegram yuborishda xatolik.' });
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setActionBanner(null);
    setSavingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: newName,
          brand: newBrand,
          category: newCategory,
          basePriceUzs: Number(newPrice),
          imageUrl: newImageUrl,
          colors: newColors
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          storages: [
            { label: '256GB', priceDeltaUzs: 0 },
            { label: '512GB', priceDeltaUzs: 1800000 },
          ],
          specs: {
            display: newDisplay,
            chipset: newChipset,
            camera: newCamera,
            battery: newBattery,
          },
          description: newDesc,
          inStock: true,
          featured: true,
        }),
      });

      const data = (await res.json()) as { product?: PhoneProduct; error?: string };
      if (!res.ok || !data.product) {
        setActionBanner({ type: 'err', text: data.error || "Mahsulot qo'shilmadi." });
        return;
      }

      setProducts((prev) => [data.product!, ...prev]);
      onProductsChanged();
      setNewName('');
      setNewDesc('');
      setActionBanner({ type: 'ok', text: `"${data.product.name}" katalogga qo'shildi.` });
    } catch {
      setActionBanner({ type: 'err', text: "Server bilan aloqa xatosi." });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleStock = async (product: PhoneProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      const data = (await res.json()) as { product?: PhoneProduct };
      if (res.ok && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product! : p)));
        onProductsChanged();
      }
    } catch {
      setActionBanner({ type: 'err', text: 'Holatni o‘zgartirishda xatolik.' });
    }
  };

  const handleDeleteProduct = async (product: PhoneProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        onProductsChanged();
        setActionBanner({ type: 'ok', text: `"${product.name}" o'chirildi.` });
      }
    } catch {
      setActionBanner({ type: 'err', text: "O'chirishda xatolik." });
    }
  };

  const handleSaveTelegram = async (e: FormEvent) => {
    e.preventDefault();
    setActionBanner(null);
    setSavingTelegram(true);
    try {
      const res = await fetch('/api/admin/telegram-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          botToken: botTokenInput.trim(),
          channelId: channelIdInput.trim(),
        }),
      });
      const data = (await res.json()) as { telegram?: TelegramConfigSummary; error?: string };
      if (!res.ok || !data.telegram) {
        setActionBanner({ type: 'err', text: data.error || 'Sozlamalar saqlanmadi.' });
        return;
      }
      setTelegramInfo(data.telegram);
      setBotTokenInput('');
      setActionBanner({
        type: 'ok',
        text: 'Telegram bot sozlamalari server xotirasiga xavfsiz saqlandi.',
      });
    } catch {
      setActionBanner({ type: 'err', text: 'Server xatosi.' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setActionBanner(null);
    setTestingTelegram(true);
    try {
      const res = await fetch('/api/admin/telegram-test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionBanner({ type: 'err', text: data.error || 'Test xabar yuborilmadi.' });
        return;
      }
      setActionBanner({
        type: 'ok',
        text: 'Test xabar Telegram kanalga muvaffaqiyatli yuborildi!',
      });
    } catch {
      setActionBanner({ type: 'err', text: "Telegram bilan aloqa o'rnatilmadi." });
    } finally {
      setTestingTelegram(false);
    }
  };

  // Unauthenticated Auth Gate
  if (!adminToken) {
    return (
      <section className="min-h-[75vh] bg-zinc-50 py-14">
        <div className="mx-auto max-w-md px-4">
          <button
            type="button"
            onClick={onBackToStore}
            className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Do&apos;konga qaytish</span>
          </button>

          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-orange-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-extrabold text-zinc-950">
                  {requiresSetup ? "Admin parolini o'rnatish" : 'Admin panelga kirish'}
                </h1>
                <p className="text-xs text-zinc-500">
                  {requiresSetup
                    ? "Birinchi marta kirish: boshqaruv parolini yarating"
                    : envPasscodeConfigured
                      ? "ADMIN_PASSCODE bo'yicha parolni kiriting"
                      : "Boshqaruv parolingizni kiriting"}
                </p>
              </div>
            </div>

            {requiresSetup === null ? (
              <div className="mt-6 h-24 animate-pulse rounded-xl bg-zinc-100" />
            ) : requiresSetup ? (
              <form onSubmit={handleSetupSubmit} className="mt-6 space-y-4">
                {authError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {authError}
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Yangi admin paroli (kamida 6 belgi)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="••••••"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Parolni tasdiqlang
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="••••••"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-11 w-full cursor-pointer rounded-xl bg-orange-600 text-sm font-bold text-white transition-colors hover:bg-orange-500 disabled:bg-zinc-400"
                >
                  {authLoading ? 'Saqlanmoqda...' : 'Parolni saqlash va kirish'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                {authError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {authError}
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Admin paroli
                  </label>
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Parolni kiriting"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-11 w-full cursor-pointer rounded-xl bg-zinc-950 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:bg-zinc-400"
                >
                  {authLoading ? 'Tekshirilmoqda...' : 'Kirish'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'Bekor qilindi')
    .reduce((sum, o) => sum + o.totalUzs, 0);
  const newOrdersCount = orders.filter((o) => o.status === 'Yangi').length;
  const telegramSentCount = orders.filter((o) => o.telegramStatus === 'sent').length;

  const filteredOrders =
    orderStatusFilter === 'Barchasi'
      ? orders
      : orders.filter((o) => o.status === orderStatusFilter);

  return (
    <section className="min-h-[82vh] bg-zinc-50 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Workspace Toolbar */}
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={onBackToStore}
              className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Do&apos;konga qaytish</span>
            </button>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
              Admin boshqaruv paneli
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchOverview(adminToken)}
              disabled={loadingData}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-900 hover:text-zinc-950"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminToken('')}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="text-xs font-medium text-zinc-500">Jami buyurtmalar</span>
            <p className="font-mono mt-1 text-2xl font-extrabold tabular-nums text-zinc-950">
              {orders.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="text-xs font-medium text-zinc-500">Yangi buyurtmalar</span>
            <p className="font-mono mt-1 text-2xl font-extrabold tabular-nums text-orange-600">
              {newOrdersCount}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="text-xs font-medium text-zinc-500">Faol savdo hajmi</span>
            <p className="font-mono mt-1 text-xl font-extrabold tabular-nums text-zinc-950">
              {formatUzs(totalRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <span className="text-xs font-medium text-zinc-500">Telegramga yuborilgan</span>
            <p className="font-mono mt-1 text-2xl font-extrabold tabular-nums text-zinc-950">
              {telegramSentCount} / {orders.length}
            </p>
          </div>
        </div>

        {/* Action Banner */}
        {actionBanner && (
          <div
            className={`mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
              actionBanner.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {actionBanner.type === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            )}
            <span>{actionBanner.text}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 rounded-xl bg-zinc-200/70 p-1.5 sm:inline-flex">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`min-h-[40px] cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'orders'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-700 hover:bg-white'
            }`}
          >
            Buyurtmalar ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`min-h-[40px] cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'products'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-700 hover:bg-white'
            }`}
          >
            Telefonlar ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`min-h-[40px] cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'telegram'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-700 hover:bg-white'
            }`}
          >
            Telegram Bot
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Kelib tushgan buyurtmalar
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {(['Barchasi', ...ORDER_STATUSES] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      orderStatusFilter === status
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
                Hozircha buyurtmalar mavjud emas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
                      <th className="py-3 pr-4">Raqam</th>
                      <th className="py-3 pr-4">Mijoz</th>
                      <th className="py-3 pr-4">Manzil</th>
                      <th className="py-3 pr-4">Mahsulotlar</th>
                      <th className="py-3 pr-4">Summa</th>
                      <th className="py-3 pr-4">Telegram</th>
                      <th className="py-3">Holat / Boshqaruv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="align-top">
                        <td className="py-4 pr-4 font-mono text-xs font-bold text-zinc-950">
                          #{order.orderNumber}
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-zinc-950">{order.customerName}</p>
                          <p className="font-mono text-xs text-zinc-500">{order.customerPhone}</p>
                        </td>
                        <td className="py-4 pr-4 text-xs text-zinc-600">
                          <p className="font-semibold text-zinc-800">{order.region}</p>
                          <p className="max-w-[20ch]">{order.address}</p>
                        </td>
                        <td className="py-4 pr-4 text-xs text-zinc-700">
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              {item.name} ({item.storage}) × {item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="py-4 pr-4 font-mono text-xs font-bold tabular-nums text-zinc-950">
                          {formatUzs(order.totalUzs)}
                        </td>
                        <td className="py-4 pr-4 text-xs">
                          {order.telegramStatus === 'sent' ? (
                            <span className="font-semibold text-emerald-700">Yuborilgan</span>
                          ) : (
                            <div className="space-y-1">
                              <span className="block font-semibold text-orange-700">
                                {order.telegramStatus === 'unconfigured' ? 'Sozlanmagan' : 'Xato'}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleResendTelegram(order.id)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-600"
                              >
                                <Send className="h-3 w-3" />
                                <span>Yuborish</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              void handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            aria-label={`Buyurtma #${order.orderNumber} holati`}
                            className="h-9 cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 focus:border-orange-500 focus:outline-none"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS CRUD */}
        {activeTab === 'products' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Add Phone Form */}
            <form
              onSubmit={handleAddProduct}
              className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-5"
            >
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Yangi telefon qo&apos;shish
              </h2>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Model nomi
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masalan: iPhone 16 Pro"
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">Brend</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value as PhoneBrand)}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Google">Google</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">Toifa</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PhoneCategory)}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                  >
                    <option value="Flagman">Flagman</option>
                    <option value="Bukiluvchi">Bukiluvchi</option>
                    <option value="Ommabop">Ommabop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Narxi (so&apos;m)
                </label>
                <input
                  type="number"
                  required
                  min={100000}
                  step={10000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="font-mono h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Rasm tanlash (yoki HTTPS havola)
                </label>
                <select
                  value={IMAGE_PRESETS.some((p) => p.url === newImageUrl) ? newImageUrl : ''}
                  onChange={(e) => {
                    if (e.target.value) setNewImageUrl(e.target.value);
                  }}
                  className="mb-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="">Boshqa URL kiritish...</option>
                </select>
                <input
                  type="text"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Ranglar (vergul bilan)
                </label>
                <input
                  type="text"
                  value={newColors}
                  onChange={(e) => setNewColors(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newDisplay}
                  onChange={(e) => setNewDisplay(e.target.value)}
                  placeholder="Ekran"
                  className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs"
                />
                <input
                  type="text"
                  value={newChipset}
                  onChange={(e) => setNewChipset(e.target.value)}
                  placeholder="Protsessor"
                  className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs"
                />
                <input
                  type="text"
                  value={newCamera}
                  onChange={(e) => setNewCamera(e.target.value)}
                  placeholder="Kamera"
                  className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs"
                />
                <input
                  type="text"
                  value={newBattery}
                  onChange={(e) => setNewBattery(e.target.value)}
                  placeholder="Batareya"
                  className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs"
                />
              </div>

              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Qisqacha tavsif..."
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={savingProduct}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-bold text-white hover:bg-orange-500"
              >
                <Plus className="h-4 w-4" />
                <span>{savingProduct ? "Qo'shilmoqda..." : "Katalogga qo'shish"}</span>
              </button>
            </form>

            {/* Product List */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Mavjud telefonlar ro&apos;yxati
              </h2>

              <div className="mt-4 divide-y divide-zinc-100">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        <SmartImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-950">{product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {product.brand} · {product.category}
                        </p>
                        <p className="font-mono mt-0.5 text-xs font-bold tabular-nums text-orange-600">
                          {formatUzs(product.basePriceUzs)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleToggleStock(product)}
                        className={`min-h-[36px] cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                          product.inStock
                            ? 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        {product.inStock ? 'Mavjud' : 'Tugagan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(product)}
                        aria-label={`${product.name} o'chirish`}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TELEGRAM BOT INTEGRATION */}
        {activeTab === 'telegram' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Telegram Bot va Kanal ulanishi
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Buyurtmalar real vaqt rejimida Telegram kanalingizga yuborilishi uchun bot tokeni
                va kanal ID sini tasdiqlang. Bot tokeni server xotirasida xavfsiz saqlanadi.
              </p>

              <form onSubmit={handleSaveTelegram} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Telegram Bot Token{' '}
                    {telegramInfo?.hasToken && (
                      <span className="font-mono text-emerald-700">
                        (Faol: {telegramInfo.tokenPreview})
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder={
                      telegramInfo?.hasToken
                        ? "O'zgartirish uchun yangi token kiriting"
                        : '1234567890:ABCdef...'
                    }
                    className="font-mono h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    Telegram Kanal ID
                  </label>
                  <input
                    type="text"
                    required
                    value={channelIdInput}
                    onChange={(e) => setChannelIdInput(e.target.value)}
                    placeholder="-1004316865165"
                    className="font-mono h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingTelegram}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:bg-zinc-400"
                  >
                    {savingTelegram ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
                  </button>

                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={() => void handleTestTelegram()}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-orange-600 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{testingTelegram ? 'Yuborilmoqda...' : 'Test xabar yuborish'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-200 lg:col-span-5">
              <h3 className="font-display text-base font-bold text-white">
                Sozlash bo&apos;yicha eslatma
              </h3>
              <ol className="mt-4 list-decimal space-y-2.5 pl-4 text-xs leading-relaxed text-zinc-300">
                <li>
                  Telegram botingizni (<span className="font-mono text-orange-400">@BotFather</span>)
                  kanalingizga <strong>Administrator</strong> sifatida qo&apos;shing va xabar
                  yuborish huquqini bering.
                </li>
                <li>
                  Doimiy saqlash uchun AI Studio{' '}
                  <strong>Settings → Secrets</strong> bo&apos;limida{' '}
                  <span className="font-mono text-orange-400">TELEGRAM_BOT_TOKEN</span> va{' '}
                  <span className="font-mono text-orange-400">TELEGRAM_CHANNEL_ID</span>{' '}
                  o&apos;zgaruvchilarini kiritib qo&apos;yishingiz mumkin.
                </li>
                <li>
                  Test tugmasi bosilganda{' '}
                  <span className="font-mono text-orange-400">{channelIdInput}</span> kanaliga
                  tekshiruv xabari darhol yuboriladi.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
