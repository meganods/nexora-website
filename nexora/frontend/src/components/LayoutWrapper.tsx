"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exclude Navbar and Footer for admin routes, partner routes, and customer login/signup pages
  const isExcluded = pathname?.startsWith("/admin") || pathname?.startsWith("/partner") || pathname === "/login" || pathname === "/signup";
  const isFooterExcluded = isExcluded || pathname?.startsWith("/profile") || pathname?.startsWith("/bookings");

  return (
    <>
      {!isExcluded && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!isFooterExcluded && <Footer />}
    </>
  );
}
