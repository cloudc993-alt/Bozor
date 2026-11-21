export type PhoneBrand = 'Apple' | 'Samsung' | 'Xiaomi' | 'Google';

export type PhoneCategory = 'Flagman' | 'Bukiluvchi' | 'Ommabop';

export type PaymentMethod = 'naqd' | 'karta' | 'muddatli';

export type OrderStatus =
  | 'Yangi'
  | 'Tasdiqlangan'
  | 'Yolda'
  | 'Yetkazildi'
  | 'Bekor qilindi';

export interface StorageOption {
  label: string;
  priceDeltaUzs: number;
}

export interface ProductSpecs {
  display: string;
  chipset: string;
  camera: string;
  battery: string;
}

export interface PhoneProduct {
  id: string;
  name: string;
  brand: PhoneBrand;
  category: PhoneCategory;
  basePriceUzs: number;
  imageUrl: string;
  colors: string[];
  storages: StorageOption[];
  specs: ProductSpecs;
  description: string;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  brand: PhoneBrand;
  imageUrl: string;
  storage: string;
  color: string;
  unitPriceUzs: number;
  quantity: number;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  brand: string;
  storage: string;
  color: string;
  unitPriceUzs: number;
  quantity: number;
  lineTotalUzs: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  region: string;
  address: string;
  paymentMethod: PaymentMethod;
  note: string;
  items: OrderItemRecord[];
  totalUzs: number;
  status: OrderStatus;
  telegramStatus: 'sent' | 'failed' | 'unconfigured';
  telegramMessageId?: number;
  telegramError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramConfigSummary {
  hasToken: boolean;
  envTokenConfigured: boolean;
  tokenPreview: string;
  channelId: string;
}
