export type Product = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  ram: string;
  storage: string;
  display: string;
  processor: string;
  camera: string;
  battery: string;
  os: string;
  color: string;
  images?: string[];
  description?: string;
  stock?: number;
  ptaApproved?: boolean;
  warranty?: string;
  sku?: string;
  featured?: boolean;
  isNew?: boolean;
};

export const products: Product[] = [
  { slug: "samsung-galaxy-a56", name: "Samsung Galaxy A56", brand: "Samsung", price: 114999, oldPrice: 124999, ram: "8 GB", storage: "256 GB", display: '6.7” Super AMOLED', processor: "Exynos 1580", camera: "50 MP triple", battery: "5000 mAh", os: "Android 15", color: "#d9e0eb", featured: true, isNew: true },
  { slug: "apple-iphone-16", name: "Apple iPhone 16", brand: "Apple", price: 319999, ram: "8 GB", storage: "128 GB", display: '6.1” Super Retina XDR', processor: "Apple A18", camera: "48 MP dual", battery: "3561 mAh", os: "iOS 18", color: "#cadbe7", featured: true },
  { slug: "xiaomi-redmi-note-14-pro", name: "Redmi Note 14 Pro", brand: "Xiaomi", price: 84999, oldPrice: 89999, ram: "12 GB", storage: "256 GB", display: '6.67” AMOLED', processor: "Helio G100 Ultra", camera: "200 MP triple", battery: "5500 mAh", os: "Android 14", color: "#c5c1d2", featured: true, isNew: true },
  { slug: "infinix-note-50-pro", name: "Infinix Note 50 Pro", brand: "Infinix", price: 79999, ram: "12 GB", storage: "256 GB", display: '6.78” AMOLED', processor: "Helio G100 Ultimate", camera: "50 MP dual", battery: "5200 mAh", os: "Android 15", color: "#cfd7cc", featured: true },
  { slug: "oppo-reno-13", name: "OPPO Reno 13", brand: "OPPO", price: 149999, ram: "12 GB", storage: "256 GB", display: '6.59” AMOLED', processor: "Dimensity 8350", camera: "50 MP triple", battery: "5600 mAh", os: "Android 15", color: "#d7cfe0", isNew: true },
  { slug: "vivo-v50", name: "vivo V50", brand: "vivo", price: 139999, ram: "12 GB", storage: "256 GB", display: '6.77” AMOLED', processor: "Snapdragon 7 Gen 3", camera: "50 MP dual", battery: "6000 mAh", os: "Android 15", color: "#d9e3e9" },
  { slug: "tecno-camon-40-pro", name: "Tecno Camon 40 Pro", brand: "Tecno", price: 74999, ram: "8 GB", storage: "256 GB", display: '6.78” AMOLED', processor: "Helio G100 Ultimate", camera: "50 MP dual", battery: "5200 mAh", os: "Android 15", color: "#dce3d3" },
  { slug: "google-pixel-9a", name: "Google Pixel 9a", brand: "Google", price: 174999, ram: "8 GB", storage: "128 GB", display: '6.3” pOLED', processor: "Google Tensor G4", camera: "48 MP dual", battery: "5100 mAh", os: "Android 15", color: "#dfd8cd", isNew: true },
  { slug: "infinix-hot-50", name: "Infinix Hot 50", brand: "Infinix", price: 39999, oldPrice: 42999, ram: "8 GB", storage: "128 GB", display: '6.78” IPS LCD', processor: "Helio G100", camera: "50 MP dual", battery: "5000 mAh", os: "Android 14", color: "#d6bd82", featured: true },
  { slug: "tecno-spark-30", name: "Tecno Spark 30", brand: "Tecno", price: 41999, ram: "8 GB", storage: "128 GB", display: '6.78” IPS LCD', processor: "Helio G91", camera: "64 MP", battery: "5000 mAh", os: "Android 14", color: "#c9b071", isNew: true },
  { slug: "xiaomi-redmi-14c", name: "Redmi 14C", brand: "Xiaomi", price: 32999, oldPrice: 35999, ram: "6 GB", storage: "128 GB", display: '6.88” IPS LCD', processor: "Helio G81 Ultra", camera: "50 MP dual", battery: "5160 mAh", os: "Android 14", color: "#e1c786" },
  { slug: "samsung-galaxy-a06", name: "Samsung Galaxy A06", brand: "Samsung", price: 28999, ram: "4 GB", storage: "128 GB", display: '6.7” PLS LCD', processor: "Helio G85", camera: "50 MP dual", battery: "5000 mAh", os: "Android 14", color: "#cbb476" }
];

export const brands = ["Samsung", "Apple", "Xiaomi", "Infinix", "OPPO", "vivo", "Tecno", "Google"];

export const formatPrice = (price: number) => `Rs. ${price.toLocaleString("en-PK")}`;
