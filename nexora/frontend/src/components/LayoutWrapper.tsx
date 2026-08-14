"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicProfile = /^\/partner\/[a-f\d]{24}$/i.test(pathname || '');
  // Exclude Navbar and Footer for admin routes, partner routes (except public profiles), and customer login/signup pages
  const isExcluded = (pathname?.startsWith("/admin") || (pathname?.startsWith("/partner") && !isPublicProfile) || pathname === "/login" || pathname === "/signup");
  const isFooterExcluded = isExcluded || pathname?.startsWith("/profile") || pathname?.startsWith("/bookings");

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#0F3D30",
            color: "#FAF6F0",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "13px",
            border: "1px solid rgba(195, 171, 132, 0.3)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: {
              primary: "#C3AB84",
              secondary: "#0F3D30",
            },
          },
        }}
      />
      {!isExcluded && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!isFooterExcluded && <Footer />}
    </>
  );
}
