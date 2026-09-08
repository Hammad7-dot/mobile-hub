import type { Metadata } from "next";
import "./globals.css";
import "./gold.css";
import { CartProvider } from "@/components/CartProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MobileHub — Phones, prices & deals in Pakistan",
  description: "Compare and shop the latest PTA-approved mobiles in Pakistan."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><CartProvider><Navbar />{children}<Footer /></CartProvider></body>
    </html>
  );
}
