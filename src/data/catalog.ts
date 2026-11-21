import type { PhoneProduct } from '../types.ts';

export const INITIAL_PRODUCTS: PhoneProduct[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'Flagman',
    basePriceUzs: 16890000,
    imageUrl: '/src/assets/images/phone_pro_titanium_1795275404531.jpg',
    colors: ['Qora Titan', 'Olovrang Bronza', 'Oq Titan'],
    storages: [
      { label: '256GB', priceDeltaUzs: 0 },
      { label: '512GB', priceDeltaUzs: 2450000 },
      { label: '1TB', priceDeltaUzs: 4900000 },
    ],
    specs: {
      display: '6.9" Super Retina XDR 120Hz',
      chipset: 'Apple A18 Pro (3nm)',
      camera: '48MP ProRAW + 5x Telefoto',
      battery: '4685 mAh · 45W tez zaryad',
    },
    description:
      'Grade 5 titan korpus, kamera boshqaruv tugmasi va 4K 120fps Dolby Vision video suratga olish imkoniyatiga ega flagman smartfon.',
    inStock: true,
    featured: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'aura-pro-orange-edition',
    name: 'iPhone 16 Pro Olovrang Edition',
    brand: 'Apple',
    category: 'Flagman',
    basePriceUzs: 15250000,
    imageUrl: '/src/assets/images/phone_orange_edition_1795275404894.jpg',
    colors: ['Olovrang Anodlangan', 'Qora Grafit'],
    storages: [
      { label: '128GB', priceDeltaUzs: 0 },
      { label: '256GB', priceDeltaUzs: 1350000 },
      { label: '512GB', priceDeltaUzs: 3600000 },
    ],
    specs: {
      display: '6.3" LTPO OLED 120Hz',
      chipset: 'Apple A18 Pro',
      camera: '48MP Fusion + Ultra Wide',
      battery: '3582 mAh · MagSafe 25W',
    },
    description:
      'Maxsus olovrang alyuminiy va qora shisha uyg‘unligidagi cheklangan seriya. Kuchli protsessor va ixcham flagman ergonomikasi.',
    inStock: true,
    featured: true,
    createdAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'samsung-galaxy-z-fold6',
    name: 'Samsung Galaxy Z Fold 6',
    brand: 'Samsung',
    category: 'Bukiluvchi',
    basePriceUzs: 18400000,
    imageUrl: '/src/assets/images/phone_foldable_ultra_1795275404646.jpg',
    colors: ['Qora Obsidian', 'Kumush Titan'],
    storages: [
      { label: '256GB', priceDeltaUzs: 0 },
      { label: '512GB', priceDeltaUzs: 1850000 },
    ],
    specs: {
      display: '7.6" Dynamic AMOLED 2X + 6.3" tashqi',
      chipset: 'Snapdragon 8 Gen 3 for Galaxy',
      camera: '50MP OIS + 3x Optik Zoom',
      battery: '4400 mAh · Dual sharnir',
    },
    description:
      'Ish va ijod uchun planshet darajasidagi katta ichki ekran, mustahkamlangan alyuminiy sharnir va Galaxy AI funksiyalari.',
    inStock: true,
    featured: true,
    createdAt: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 'google-pixel-9-pro-white',
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    category: 'Ommabop',
    basePriceUzs: 11850000,
    imageUrl: '/src/assets/images/phone_compact_white_1795275404679.jpg',
    colors: ['Oq Keramika', 'Qora Obsidian'],
    storages: [
      { label: '128GB', priceDeltaUzs: 0 },
      { label: '256GB', priceDeltaUzs: 1100000 },
      { label: '512GB', priceDeltaUzs: 2500000 },
    ],
    specs: {
      display: '6.3" Super Actua LTPO 3000 nit',
      chipset: 'Google Tensor G4 · 16GB RAM',
      camera: '50MP Octa PD + 48MP 5x Periskop',
      battery: '4700 mAh · 7 yil Android yangilanish',
    },
    description:
      'Tabiiy rang uzatishga ega professional kamera tizimi, keramik oq korpus va sof Android tezkorligi.',
    inStock: true,
    featured: false,
    createdAt: '2026-11-04T11:00:00.000Z',
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'Flagman',
    basePriceUzs: 13600000,
    imageUrl: '/src/assets/images/phone_pro_titanium_1795275404531.jpg',
    colors: ['Qora Titan', 'Oq Kumush', 'Olovrang Maxsus'],
    storages: [
      { label: '256GB', priceDeltaUzs: 0 },
      { label: '512GB', priceDeltaUzs: 1650000 },
      { label: '1TB', priceDeltaUzs: 3400000 },
    ],
    specs: {
      display: '6.8" QHD+ AMOLED Anti-Reflective',
      chipset: 'Snapdragon 8 Gen 3 · S-Pen',
      camera: '200MP Asosiy + 100x Space Zoom',
      battery: '5000 mAh · 45W Super Fast',
    },
    description:
      'O‘rnatilgan S-Pen stilus, yaltiramaydigan Gorilla Armor oynasi va 200 megapikselli ultra-aniq kamera.',
    inStock: true,
    featured: false,
    createdAt: '2026-11-05T12:00:00.000Z',
  },
  {
    id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra Leica',
    brand: 'Xiaomi',
    category: 'Ommabop',
    basePriceUzs: 12100000,
    imageUrl: '/src/assets/images/phone_orange_edition_1795275404894.jpg',
    colors: ['Qora Eko-charm', 'Olovrang Sport', 'Oq'],
    storages: [
      { label: '256GB', priceDeltaUzs: 0 },
      { label: '512GB', priceDeltaUzs: 1400000 },
    ],
    specs: {
      display: '6.73" WQHD+ AMOLED 120Hz',
      chipset: 'Snapdragon 8 Gen 3 · 16GB RAM',
      camera: 'Leica Summilux 1" 50MP Quad',
      battery: '5000 mAh · 90W HyperCharge',
    },
    description:
      'Leica optikasi bilan yaratilgan 1 dyuymli sensor, 90W o‘ta tezkor quvvatlash va mustahkam metall rom.',
    inStock: true,
    featured: false,
    createdAt: '2026-11-06T13:00:00.000Z',
  },
];

export const UZ_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Buxoro',
  'Andijon',
  "Farg'ona",
  'Namangan',
  'Xorazm',
  'Qashqadaryo',
  'Surxondaryo',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  "Qoraqalpog'iston",
];

export function formatUzs(amount: number): string {
  return `${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}
