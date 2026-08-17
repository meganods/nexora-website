import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LocationProvider } from "@/lib/location";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora - Premium Home Services",
  description: "Your premium home service platform. From beauty and spa to plumbing and electricals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GoogleOAuthProvider clientId="43818320492-c1h38v893a0b12c8n2b23a9d.apps.googleusercontent.com">
          <AuthProvider>
            <LocationProvider>
              <LayoutWrapper>
                <Toaster position="top-right" />
                {children}
              </LayoutWrapper>
            </LocationProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

