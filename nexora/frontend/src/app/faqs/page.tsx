export const metadata = { title: 'FAQs — Nexora Help Center', description: 'Find answers to frequently asked questions about Nexora home services.' };

const FAQS = [
  { category: 'Booking', items: [
    { q: 'How do I book a service?', a: 'Browse services on the home page, select a service you need, choose your address and preferred time, then complete payment. Our system will assign a verified professional.' },
    { q: 'Can I schedule a booking in advance?', a: 'Yes, you can schedule services up to 7 days in advance. Select your preferred date and time slot during checkout.' },
    { q: 'How do I cancel or reschedule?', a: 'You can cancel or reschedule via your Bookings page before the professional is assigned. After assignment, contact support.' },
    { q: 'What happens after I book?', a: 'Our system auto-assigns the best available verified professional. You\'ll receive a confirmation with the professional\'s details.' },
  ]},
  { category: 'Service & Safety', items: [
    { q: 'How are professionals verified?', a: 'All professionals complete full KYC including Aadhaar verification, PAN verification, and business document review before joining Nexora.' },
    { q: 'What is OTP verification?', a: 'When the professional arrives, you share a 4-digit OTP to start the service. This ensures only authorized service starts.' },
    { q: 'Are services guaranteed?', a: 'Yes. We offer a satisfaction guarantee. If you\'re unsatisfied, contact support within 24 hours of service completion.' },
  ]},
  { category: 'Payments', items: [
    { q: 'What payment methods are accepted?', a: 'We accept UPI, credit cards, debit cards, net banking, and wallets through our secure Cashfree payment gateway.' },
    { q: 'Is my payment information safe?', a: 'Yes. All payments are processed through Cashfree\'s PCI-DSS compliant platform. We never store your card details.' },
    { q: 'When am I charged?', a: 'Payment is collected at checkout when you confirm your booking. You\'ll see a complete summary before paying.' },
  ]},
  { category: 'For Service Partners', items: [
    { q: 'How do I join as a service partner?', a: 'Click "Register as Partner" in the footer or visit /partner/signup. Complete the registration and KYC process. After admin approval, you can start accepting bookings.' },
    { q: 'How are payouts processed?', a: 'Earnings are transferred to your registered bank account after service completion and customer confirmation.' },
  ]},
];

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-white/70 text-lg">Frequently asked questions about Nexora.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 -mt-10 pb-20 space-y-6">
        {FAQS.map((section, si) => (
          <div key={si} className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-primary mb-5">{section.category}</h2>
            <div className="space-y-4">
              {section.items.map((item, ii) => (
                <div key={ii} className="pb-4 border-b border-gold/10 last:border-0 last:pb-0">
                  <p className="font-semibold text-primary text-sm mb-2">{item.q}</p>
                  <p className="text-sm text-foreground/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-primary rounded-3xl p-8 text-center text-white">
          <h3 className="font-serif text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-white/70 text-sm mb-5">Our support team is ready to help you.</p>
          <a href="/contact" className="inline-block px-7 py-3 bg-white text-primary font-bold rounded-full text-sm hover:bg-white/90 transition-all">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
