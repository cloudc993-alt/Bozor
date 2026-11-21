import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, formatUzs } from './src/data/catalog.ts';
import type {
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PhoneBrand,
  PhoneCategory,
  PhoneProduct,
  StorageOption,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const ADMIN_AUTH_PATH = path.resolve(DATA_DIR, 'admin-auth.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const DEFAULT_CHANNEL_ID = '-1004316865165';

interface StoreState {
  products: PhoneProduct[];
  orders: OrderRecord[];
  channelId: string;
  orderCounter: number;
}

interface AdminAuthRecord {
  salt: string;
  hash: string;
  claimedAt: string;
}

// Runtime Telegram token kept strictly in server memory when set via Admin UI;
// process.env.TELEGRAM_BOT_TOKEN takes precedence when configured.
let runtimeTelegramToken = '';

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore(): StoreState {
  ensureDataDir();
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return {
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        channelId: typeof parsed.channelId === 'string' && parsed.channelId.trim() ? parsed.channelId.trim() : DEFAULT_CHANNEL_ID,
        orderCounter: typeof parsed.orderCounter === 'number' && parsed.orderCounter >= 1000 ? parsed.orderCounter : 1000,
      };
    } catch {
      // Fall back to fresh store if corrupted
    }
  }
  const initial: StoreState = {
    products: INITIAL_PRODUCTS,
    orders: [],
    channelId: DEFAULT_CHANNEL_ID,
    orderCounter: 1000,
  };
  saveStore(initial);
  return initial;
}

function saveStore(state: StoreState): void {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function loadAdminAuth(): AdminAuthRecord | null {
  ensureDataDir();
  if (!fs.existsSync(ADMIN_AUTH_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(ADMIN_AUTH_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AdminAuthRecord>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return {
        salt: parsed.salt,
        hash: parsed.hash,
        claimedAt: typeof parsed.claimedAt === 'string' ? parsed.claimedAt : new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function saveAdminAuth(record: AdminAuthRecord): void {
  ensureDataDir();
  fs.writeFileSync(ADMIN_AUTH_PATH, JSON.stringify(record, null, 2), 'utf8');
}

function getEnvPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function hashScryptPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyConstantTimeString(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function verifyScryptPassword(password: string, record: AdminAuthRecord): boolean {
  const { hash } = hashScryptPassword(password, record.salt);
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(record.hash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: expiresAt })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    if (decoded.role !== 'admin' || typeof decoded.exp !== 'number') return false;
    return Date.now() < decoded.exp;
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin avtorizatsiyasi talab qilinadi.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Sessiya muddati tugagan yoki token yaroqsiz.' });
    return;
  }
  next();
}

function escapeTelegramHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getEffectiveTelegramToken(): string {
  const envToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  return envToken || runtimeTelegramToken;
}

function getEffectiveChannelId(store: StoreState): string {
  const envChannel = (process.env.TELEGRAM_CHANNEL_ID || '').trim();
  return envChannel || store.channelId || DEFAULT_CHANNEL_ID;
}

function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 10) return '••••••';
  return `${token.slice(0, 6)}••••••${token.slice(-4)}`;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  naqd: 'Naqd pul (yetkazib berganda)',
  karta: 'Karta orqali (Uzcard / Humo)',
  muddatli: "Muddatli to'lov (bo'lib to'lash)",
};

async function dispatchTelegramMessage(
  token: string,
  channelId: string,
  htmlText: string
): Promise<{ sent: boolean; messageId?: number; error?: string }> {
  if (!token) {
    return {
      sent: false,
      error: "Telegram bot token sozlanmagan. Admin panel -> Telegram Bot bo'limida tokenni kiriting.",
    };
  }
  if (!channelId) {
    return {
      sent: false,
      error: 'Telegram kanal ID ko‘rsatilmagan.',
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        sent: false,
        error: data.description || `Telegram API xatosi (${response.status})`,
      };
    }

    return {
      sent: true,
      messageId: data.result?.message_id,
    };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Telegram serveriga ulanib bo'lmadi",
    };
  }
}

function buildOrderTelegramHtml(order: OrderRecord, heading = 'YANGI BUYURTMA'): string {
  const lines = order.items.map(
    (item, idx) =>
      `${idx + 1}. <b>${escapeTelegramHtml(item.name)}</b>\n` +
      `   • Xotira: ${escapeTelegramHtml(item.storage)} | Rang: ${escapeTelegramHtml(item.color)}\n` +
      `   • Soni: ${item.quantity} dona × ${escapeTelegramHtml(formatUzs(item.unitPriceUzs))} = <b>${escapeTelegramHtml(formatUzs(item.lineTotalUzs))}</b>`
  );

  const noteBlock = order.note ? `\n📝 <b>Izoh:</b> ${escapeTelegramHtml(order.note)}` : '';

  return (
    `🔥 <b>${escapeTelegramHtml(heading)} — #${escapeTelegramHtml(order.orderNumber)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Mijoz:</b> ${escapeTelegramHtml(order.customerName)}\n` +
    `📞 <b>Telefon:</b> ${escapeTelegramHtml(order.customerPhone)}\n` +
    `📍 <b>Manzil:</b> ${escapeTelegramHtml(order.region)}, ${escapeTelegramHtml(order.address)}\n` +
    `💳 <b>To'lov:</b> ${escapeTelegramHtml(PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod)}\n` +
    `📌 <b>Holat:</b> ${escapeTelegramHtml(order.status)}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 <b>Buyurtma tarkibi:</b>\n` +
    `${lines.join('\n')}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>Jami summa:</b> <b>${escapeTelegramHtml(formatUzs(order.totalUzs))}</b>` +
    `${noteBlock}\n` +
    `🕒 <i>${escapeTelegramHtml(new Date(order.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }))}</i>`
  );
}

function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const VALID_BRANDS: PhoneBrand[] = ['Apple', 'Samsung', 'Xiaomi', 'Google'];
const VALID_CATEGORIES: PhoneCategory[] = ['Flagman', 'Bukiluvchi', 'Ommabop'];
const VALID_STATUSES: OrderStatus[] = ['Yangi', 'Tasdiqlangan', 'Yolda', 'Yetkazildi', 'Bekor qilindi'];

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const store = loadStore();

  // Public catalog read
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json({ products: store.products });
  });

  // Public order creation + real-time Telegram channel dispatch
  app.post('/api/orders', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;

    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const region = typeof body.region === 'string' ? body.region.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2 || customerName.length > 100) {
      res.status(400).json({ error: "Iltimos, to'liq ismingizni kiriting (2–100 belgi)." });
      return;
    }

    const digitsOnly = customerPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      res.status(400).json({ error: "Telefon raqam noto'g'ri formatda. Masalan: +998 90 123 45 67" });
      return;
    }

    if (region.length < 2 || region.length > 80) {
      res.status(400).json({ error: 'Hudud / viloyatni tanlang.' });
      return;
    }

    if (address.length < 3 || address.length > 250) {
      res.status(400).json({ error: "Yetkazib berish manzilini to'liq kiriting." });
      return;
    }

    if (!['naqd', 'karta', 'muddatli'].includes(paymentMethod)) {
      res.status(400).json({ error: "To'lov usulini tanlang." });
      return;
    }

    if (rawItems.length === 0 || rawItems.length > 20) {
      res.status(400).json({ error: "Buyurtma uchun kamida bitta telefon tanlang." });
      return;
    }

    const verifiedItems: OrderItemRecord[] = [];
    let totalUzs = 0;

    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') {
        res.status(400).json({ error: "Mahsulot ma'lumoti noto'g'ri." });
        return;
      }
      const itemObj = rawItem as Record<string, unknown>;
      const productId = typeof itemObj.productId === 'string' ? itemObj.productId : '';
      const storageLabel = typeof itemObj.storage === 'string' ? itemObj.storage : '';
      const color = typeof itemObj.color === 'string' ? itemObj.color.trim().slice(0, 60) : '';
      const quantity = Number(itemObj.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        res.status(400).json({ error: 'Mahsulot soni 1 dan 10 gacha bo‘lishi kerak.' });
        return;
      }

      const product = store.products.find((p) => p.id === productId);
      if (!product) {
        res.status(400).json({ error: 'Tanlangan telefon katalogda topilmadi.' });
        return;
      }
      if (!product.inStock) {
        res.status(400).json({ error: `${product.name} hozirda sotuvda mavjud emas.` });
        return;
      }

      const storageOption =
        product.storages.find((s) => s.label === storageLabel) || product.storages[0];
      const chosenStorage = storageOption ? storageOption.label : '256GB';
      const delta = storageOption ? storageOption.priceDeltaUzs : 0;
      const unitPriceUzs = product.basePriceUzs + delta;
      const lineTotalUzs = unitPriceUzs * quantity;

      const validColor = product.colors.includes(color) ? color : product.colors[0] || 'Qora';

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        storage: chosenStorage,
        color: validColor,
        unitPriceUzs,
        quantity,
        lineTotalUzs,
      });

      totalUzs += lineTotalUzs;
    }

    store.orderCounter += 1;
    const orderNumber = `OP-${store.orderCounter}`;
    const now = new Date().toISOString();

    const newOrder: OrderRecord = {
      id: crypto.randomUUID(),
      orderNumber,
      customerName,
      customerPhone,
      region,
      address,
      paymentMethod,
      note,
      items: verifiedItems,
      totalUzs,
      status: 'Yangi',
      telegramStatus: 'unconfigured',
      createdAt: now,
      updatedAt: now,
    };

    const token = getEffectiveTelegramToken();
    const channelId = getEffectiveChannelId(store);
    const tgResult = await dispatchTelegramMessage(
      token,
      channelId,
      buildOrderTelegramHtml(newOrder, 'YANGI BUYURTMA')
    );

    if (!token) {
      newOrder.telegramStatus = 'unconfigured';
      newOrder.telegramError = tgResult.error;
    } else if (tgResult.sent) {
      newOrder.telegramStatus = 'sent';
      newOrder.telegramMessageId = tgResult.messageId;
    } else {
      newOrder.telegramStatus = 'failed';
      newOrder.telegramError = tgResult.error;
    }

    store.orders.unshift(newOrder);
    saveStore(store);

    res.status(201).json({
      order: {
        orderNumber: newOrder.orderNumber,
        totalUzs: newOrder.totalUzs,
        status: newOrder.status,
        items: newOrder.items,
        createdAt: newOrder.createdAt,
        telegramStatus: newOrder.telegramStatus,
        telegramError: newOrder.telegramError,
      },
    });
  });

  // Public order status check (requires orderNumber + last 4 digits of phone)
  app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
    const rawNum = String(req.params.orderNumber || '').trim().toUpperCase();
    const last4 = String(req.query.phoneLast4 || '').replace(/\D/g, '').slice(-4);

    if (!rawNum || last4.length !== 4) {
      res.status(400).json({ error: 'Buyurtma raqami va telefonning oxirgi 4 raqamini kiriting.' });
      return;
    }

    const found = store.orders.find((o) => {
      const phoneDigits = o.customerPhone.replace(/\D/g, '');
      return o.orderNumber.toUpperCase() === rawNum && phoneDigits.endsWith(last4);
    });

    if (!found) {
      res.status(404).json({ error: 'Buyurtma topilmadi. Raqam va telefon oxirgi 4 raqamini tekshiring.' });
      return;
    }

    res.json({
      order: {
        orderNumber: found.orderNumber,
        status: found.status,
        items: found.items,
        totalUzs: found.totalUzs,
        region: found.region,
        paymentMethod: found.paymentMethod,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      },
    });
  });

  // Admin auth status
  app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
    const envConfigured = getEnvPasscode().length > 0;
    const savedAuth = loadAdminAuth();
    res.json({
      requiresSetup: !envConfigured && !savedAuth,
      envPasscodeConfigured: envConfigured,
    });
  });

  // First-run one-time admin password setup (locked once claimed or env configured)
  app.post('/api/admin/setup', (req: Request, res: Response) => {
    if (getEnvPasscode().length > 0) {
      res.status(403).json({ error: 'Admin paroli muhit sozlamalarida (ADMIN_PASSCODE) allaqachon belgilangan.' });
      return;
    }
    if (loadAdminAuth() !== null) {
      res.status(403).json({ error: 'Admin paroli allaqachon o‘rnatilgan. Tizimga kirishdan foydalaning.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const password = typeof body.passcode === 'string' ? body.passcode.trim() : '';
    if (password.length < 6 || password.length > 100) {
      res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.' });
      return;
    }

    const { salt, hash } = hashScryptPassword(password);
    saveAdminAuth({ salt, hash, claimedAt: new Date().toISOString() });

    const { token, expiresAt } = signAdminToken();
    res.status(201).json({ token, expiresAt });
  });

  // Admin login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Parolni kiriting.' });
      return;
    }

    const envPasscode = getEnvPasscode();
    if (envPasscode.length > 0) {
      if (!verifyConstantTimeString(passcode, envPasscode)) {
        res.status(401).json({ error: 'Admin paroli noto‘g‘ri.' });
        return;
      }
    } else {
      const saved = loadAdminAuth();
      if (!saved) {
        res.status(409).json({ error: 'Avval admin parolini o‘rnating.' });
        return;
      }
      if (!verifyScryptPassword(passcode, saved)) {
        res.status(401).json({ error: 'Admin paroli noto‘g‘ri.' });
        return;
      }
    }

    const { token, expiresAt } = signAdminToken();
    res.json({ token, expiresAt });
  });

  // Protected Admin overview
  app.get('/api/admin/overview', requireAdmin, (_req: Request, res: Response) => {
    const token = getEffectiveTelegramToken();
    const envTokenConfigured = (process.env.TELEGRAM_BOT_TOKEN || '').trim().length > 0;
    const channelId = getEffectiveChannelId(store);

    res.json({
      products: store.products,
      orders: store.orders,
      telegram: {
        hasToken: token.length > 0,
        envTokenConfigured,
        tokenPreview: maskToken(token),
        channelId,
      },
    });
  });

  // Admin: Add product
  app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const brand = body.brand as PhoneBrand;
    const category = body.category as PhoneCategory;
    const basePriceUzs = Number(body.basePriceUzs);
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const inStock = typeof body.inStock === 'boolean' ? body.inStock : true;
    const featured = typeof body.featured === 'boolean' ? body.featured : false;

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Telefon nomi 2–100 belgi bo‘lishi kerak.' });
      return;
    }
    if (!VALID_BRANDS.includes(brand)) {
      res.status(400).json({ error: 'Brend noto‘g‘ri tanlangan.' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Kategoriya noto‘g‘ri tanlangan.' });
      return;
    }
    if (!Number.isFinite(basePriceUzs) || basePriceUzs < 100000) {
      res.status(400).json({ error: 'Narx kamida 100 000 so‘m bo‘lishi kerak.' });
      return;
    }
    if (!isSafeImageUrl(imageUrl)) {
      res.status(400).json({ error: 'Rasm manzili xavfsiz URL bo‘lishi kerak.' });
      return;
    }

    const colors = Array.isArray(body.colors)
      ? body.colors.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).map((c) => c.trim())
      : ['Qora Titan'];

    const rawStorages = Array.isArray(body.storages) ? body.storages : [];
    const storages: StorageOption[] = rawStorages
      .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
      .map((s) => ({
        label: typeof s.label === 'string' ? s.label.trim() : '256GB',
        priceDeltaUzs: Number.isFinite(Number(s.priceDeltaUzs)) ? Math.max(0, Number(s.priceDeltaUzs)) : 0,
      }));

    const specsObj = (body.specs && typeof body.specs === 'object' ? body.specs : {}) as Record<string, unknown>;

    const product: PhoneProduct = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomBytes(2).toString('hex')}`,
      name,
      brand,
      category,
      basePriceUzs: Math.round(basePriceUzs),
      imageUrl,
      colors: colors.length > 0 ? colors : ['Qora Titan'],
      storages: storages.length > 0 ? storages : [{ label: '256GB', priceDeltaUzs: 0 }],
      specs: {
        display: typeof specsObj.display === 'string' && specsObj.display.trim() ? specsObj.display.trim() : '6.7" OLED 120Hz',
        chipset: typeof specsObj.chipset === 'string' && specsObj.chipset.trim() ? specsObj.chipset.trim() : 'Flagman Chip',
        camera: typeof specsObj.camera === 'string' && specsObj.camera.trim() ? specsObj.camera.trim() : '50MP Pro Kamera',
        battery: typeof specsObj.battery === 'string' && specsObj.battery.trim() ? specsObj.battery.trim() : '5000 mAh',
      },
      description: description || `${brand} ${name} rasmiy kafolatli smartfoni.`,
      inStock,
      featured,
      createdAt: new Date().toISOString(),
    };

    store.products.unshift(product);
    saveStore(store);

    res.status(201).json({ product });
  });

  // Admin: Update product
  app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const index = store.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Telefon topilmadi.' });
      return;
    }

    const existing = store.products[index];
    const body = req.body as Record<string, unknown>;

    const name = typeof body.name === 'string' && body.name.trim().length >= 2 ? body.name.trim() : existing.name;
    const brand = VALID_BRANDS.includes(body.brand as PhoneBrand) ? (body.brand as PhoneBrand) : existing.brand;
    const category = VALID_CATEGORIES.includes(body.category as PhoneCategory)
      ? (body.category as PhoneCategory)
      : existing.category;
    const basePriceUzs =
      Number.isFinite(Number(body.basePriceUzs)) && Number(body.basePriceUzs) >= 100000
        ? Math.round(Number(body.basePriceUzs))
        : existing.basePriceUzs;

    let imageUrl = existing.imageUrl;
    if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      if (!isSafeImageUrl(body.imageUrl)) {
        res.status(400).json({ error: 'Rasm manzili xavfsiz URL bo‘lishi kerak.' });
        return;
      }
      imageUrl = body.imageUrl.trim();
    }

    const updated: PhoneProduct = {
      ...existing,
      name,
      brand,
      category,
      basePriceUzs,
      imageUrl,
      description: typeof body.description === 'string' ? body.description.trim() : existing.description,
      inStock: typeof body.inStock === 'boolean' ? body.inStock : existing.inStock,
      featured: typeof body.featured === 'boolean' ? body.featured : existing.featured,
    };

    store.products[index] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  // Admin: Delete product
  app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const nextProducts = store.products.filter((p) => p.id !== id);
    if (nextProducts.length === store.products.length) {
      res.status(404).json({ error: 'Telefon topilmadi.' });
      return;
    }
    store.products = nextProducts;
    saveStore(store);
    res.json({ ok: true });
  });

  // Admin: Update order status + optional Telegram notification
  app.patch('/api/admin/orders/:id', requireAdmin, async (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const order = store.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const status = body.status as OrderStatus;
    const notifyTelegram = Boolean(body.notifyTelegram);

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Buyurtma holati noto‘g‘ri.' });
      return;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    let tgResult: { sent: boolean; messageId?: number; error?: string } | null = null;
    if (notifyTelegram) {
      const token = getEffectiveTelegramToken();
      const channelId = getEffectiveChannelId(store);
      tgResult = await dispatchTelegramMessage(
        token,
        channelId,
        buildOrderTelegramHtml(order, `BUYURTMA HOLATI: ${status.toUpperCase()}`)
      );
      if (tgResult.sent) {
        order.telegramStatus = 'sent';
        order.telegramMessageId = tgResult.messageId;
        order.telegramError = undefined;
      }
    }

    saveStore(store);
    res.json({ order, telegram: tgResult });
  });

  // Admin: Resend existing order to Telegram channel
  app.post('/api/admin/orders/:id/resend-telegram', requireAdmin, async (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const order = store.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi.' });
      return;
    }

    const token = getEffectiveTelegramToken();
    const channelId = getEffectiveChannelId(store);
    const tgResult = await dispatchTelegramMessage(
      token,
      channelId,
      buildOrderTelegramHtml(order, 'BUYURTMA (QAYTA YUBORILDI)')
    );

    if (!token) {
      order.telegramStatus = 'unconfigured';
      order.telegramError = tgResult.error;
    } else if (tgResult.sent) {
      order.telegramStatus = 'sent';
      order.telegramMessageId = tgResult.messageId;
      order.telegramError = undefined;
    } else {
      order.telegramStatus = 'failed';
      order.telegramError = tgResult.error;
    }
    order.updatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ order, telegram: tgResult });
  });

  // Admin: Update Telegram config (bot token stored strictly in server memory, channel ID in store)
  app.post('/api/admin/telegram-config', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const botToken = typeof body.botToken === 'string' ? body.botToken.trim() : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : '';

    if (botToken) {
      if (!/^\d{6,15}:[A-Za-z0-9_-]{20,}$/.test(botToken)) {
        res.status(400).json({ error: 'Telegram bot token formati noto‘g‘ri.' });
        return;
      }
      runtimeTelegramToken = botToken;
    }

    if (channelId) {
      if (!/^-?\d{5,20}$|^@[A-Za-z0-9_]{4,}$/.test(channelId)) {
        res.status(400).json({ error: 'Kanal ID noto‘g‘ri formatda (masalan: -1004316865165).' });
        return;
      }
      store.channelId = channelId;
      saveStore(store);
    }

    const effectiveToken = getEffectiveTelegramToken();
    res.json({
      telegram: {
        hasToken: effectiveToken.length > 0,
        envTokenConfigured: (process.env.TELEGRAM_BOT_TOKEN || '').trim().length > 0,
        tokenPreview: maskToken(effectiveToken),
        channelId: getEffectiveChannelId(store),
      },
    });
  });

  // Admin: Send live test message to Telegram channel
  app.post('/api/admin/telegram-test', requireAdmin, async (_req: Request, res: Response) => {
    const token = getEffectiveTelegramToken();
    const channelId = getEffectiveChannelId(store);
    const html =
      `✅ <b>OlovPhone — Telegram ulanishi faol!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Sayt orqali tushgan barcha yangi buyurtmalar real vaqt rejimida ushbu kanalga yuboriladi.\n` +
      `🕒 <i>${escapeTelegramHtml(new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }))}</i>`;

    const result = await dispatchTelegramMessage(token, channelId, html);
    if (!result.sent) {
      res.status(400).json({ error: result.error || 'Test xabar yuborilmadi.' });
      return;
    }
    res.json({ ok: true, messageId: result.messageId });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OlovPhone server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
