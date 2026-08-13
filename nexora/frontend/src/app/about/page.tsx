import Link from 'next/link';
import { ShieldCheck, Star, Users, Award } from 'lucide-react';

export const metadata = { title: 'About Nexora — Premium Home Services', description: 'Learn about Nexora, our mission, and the team behind India\'s trusted home service platform.' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">About Nexora</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">Connecting trusted professionals with homes that need them.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-10 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 shadow-sm mb-8">
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Our Mission</h2>
          <p className="text-foreground/75 leading-relaxed text-lg mb-6">
            Nexora was built to solve a real problem — finding trustworthy, affordable home services. We connect verified professionals with customers across India, making quality home services accessible to everyone.
          </p>
          <p className="text-foreground/75 leading-relaxed">
            Every professional on Nexora goes through a rigorous KYC verification process including Aadhaar verification, PAN verification, and business document review — before they can accept a single booking.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, value: '10,000+', label: 'Customers Served' },
            { icon: ShieldCheck, value: '500+', label: 'Verified Professionals' },
            { icon: Star, value: '4.8/5', label: 'Average Rating' },
            { icon: Award, value: '50+', label: 'Services Offered' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gold/20 shadow-sm text-center">
              <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-serif text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-foreground/55 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gold/20 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-primary mb-4">Why Trust Nexora?</h2>
          <div className="space-y-4 text-foreground/75 leading-relaxed">
            <p>Every booking on Nexora is protected by our OTP verification system — the service starts only when you share a secure code with the professional. This prevents any unauthorized service starts.</p>
            <p>We believe in complete transparency. You see the price before you book. No hidden charges, no surprise fees.</p>
            <p>Our professionals upload before and after service photos, creating a complete record of every job done.</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all shadow-md">
            Explore Our Services
          </Link>
        </div>
      </div>
    </div>
  );
}
