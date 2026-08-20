import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <p className="font-serif text-2xl font-bold text-white mb-3">Nexora</p>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-5">
              Premium home services at your doorstep. Trusted professionals, transparent pricing, seamless booking.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="w-4 h-4 text-[#C3AB84]" />
              <span>100% KYC-Verified Service Partners</span>
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold text-[#C3AB84] uppercase tracking-wider mb-4">Company</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/locations" className="hover:text-white transition-colors">Locations</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-bold text-[#C3AB84] uppercase tracking-wider mb-4">Services</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Popular Services</Link></li>
              <li><Link href="/deals" className="hover:text-white transition-colors">Best Deals</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Browse Categories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-bold text-[#C3AB84] uppercase tracking-wider mb-4">Support</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link href="/faqs" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Account + Partner */}
          <div>
            <p className="text-xs font-bold text-[#C3AB84] uppercase tracking-wider mb-4">Account</p>
            <ul className="space-y-2.5 text-sm text-white/60 mb-6">
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
            <p className="text-xs font-bold text-[#C3AB84] uppercase tracking-wider mb-4">Service Partner</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link href="/partner/login" className="hover:text-white transition-colors">Login as Service Partner</Link></li>
              <li><Link href="/partner/register" className="hover:text-white transition-colors">Register as Service Partner</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/35">
          <p>© {new Date().getFullYear()} Nexora. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/privacy" className="hover:text-white/65 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/65 transition-colors">Terms & Conditions</Link>
            <Link href="/refund" className="hover:text-white/65 transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="hover:text-white/65 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
