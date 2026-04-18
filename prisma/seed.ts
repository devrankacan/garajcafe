/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" } as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const settingsData = [
    { key: "businessName", value: "Garaj Cafe" },
    { key: "about", value: "2018'den beri sıcak bir atmosferde kahve ve lezzetler sunuyoruz." },
    { key: "wifi", value: "GarajCafe2024" },
    { key: "instagram", value: "@garajcafe" },
    { key: "mapUrl", value: "https://maps.google.com" },
    { key: "baseUrl", value: "http://localhost:3000" },
  ];
  for (const s of settingsData) {
    await prisma.settings.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  const tablesData = [
    { number: 1, name: "Masa 1" },
    { number: 2, name: "Masa 2" },
    { number: 3, name: "Masa 3" },
    { number: 4, name: "Masa 4" },
    { number: 5, name: "Bahçe 1" },
    { number: 6, name: "Bahçe 2" },
  ];
  for (const t of tablesData) {
    await prisma.table.upsert({ where: { number: t.number }, update: {}, create: t });
  }

  const menuData = [
    {
      name: "Sıcak İçecekler",
      sortOrder: 1,
      products: [
        { name: "Espresso", price: 35, description: "Sade, güçlü" },
        { name: "Americano", price: 40, description: "Espresso + sıcak su" },
        { name: "Cappuccino", price: 55, description: "Espresso + buharlı süt köpüğü" },
        { name: "Latte", price: 60, description: "Espresso + bol sütlü" },
        { name: "Türk Kahvesi", price: 45, description: "Geleneksel" },
        { name: "Sıcak Çikolata", price: 65, description: "Bitter veya sütlü" },
      ],
    },
    {
      name: "Soğuk İçecekler",
      sortOrder: 2,
      products: [
        { name: "Cold Brew", price: 65, description: "12 saat demleme" },
        { name: "Iced Latte", price: 70, description: "Buzlu sütlü kahve" },
        { name: "Limonata", price: 45, description: "Taze sıkılmış" },
        { name: "Mango Smoothie", price: 75, description: "Taze mango" },
        { name: "Ayran", price: 25, description: "Ev yapımı" },
      ],
    },
    {
      name: "Atıştırmalıklar",
      sortOrder: 3,
      products: [
        { name: "Kruvasan", price: 45, description: "Tereyağlı, çıtır" },
        { name: "Tost", price: 65, description: "Kaşar + domates" },
        { name: "Brownie", price: 55, description: "Bitter çikolatalı" },
        { name: "Cheesecake", price: 75, description: "Günlük taze" },
        { name: "Muffin", price: 45, description: "Yabanmersini" },
      ],
    },
    {
      name: "Ana Yemekler",
      sortOrder: 4,
      products: [
        { name: "Club Sandviç", price: 120, description: "Tavuk + marul + domates" },
        { name: "Waffle", price: 95, description: "Meyve sosuyla" },
        { name: "Granola Bowl", price: 85, description: "Yoğurt + meyve" },
        { name: "Avokado Toast", price: 110, description: "Tam tahıllı ekmek" },
      ],
    },
  ];

  for (const cat of menuData) {
    const { products, ...catData } = cat;
    const category = await prisma.category.create({ data: catData });
    for (let i = 0; i < products.length; i++) {
      await prisma.product.create({
        data: { ...products[i], categoryId: category.id, sortOrder: i, isAvailable: true },
      });
    }
  }

  console.log("Seed tamamlandı!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
