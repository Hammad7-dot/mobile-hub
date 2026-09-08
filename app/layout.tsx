import type { Metadata } from "next";
import "./globals.css";
import "./gold.css";
import { CartProvider } from "@/components/CartProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "MobileHub — Phones, prices & deals in Pakistan",
  description: "Compare and shop the latest PTA-approved mobiles in Pakistan."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getStoreSettings();
  return (
    <html lang="en">
      <body><CartProvider><Navbar settings={settings}/>{children}<Footer settings={settings}/></CartProvider></body>
    </html>
  );
}
