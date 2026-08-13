export const metadata = { title: 'Privacy Policy — Nexora', description: 'Nexora privacy policy — how we collect, use, and protect your information.' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/70">Last updated: August 2026</p>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 -mt-10 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 shadow-sm space-y-8">
          {[
            { title: '1. Information We Collect', content: 'We collect information you provide during registration (name, email, phone), booking details (address, service type, date), payment information (processed securely by Cashfree, we do not store card details), and usage data (pages visited, features used).' },
            { title: '2. How We Use Your Information', content: 'We use your information to process bookings and assign professionals, communicate service updates and confirmations, improve our platform and services, comply with legal obligations, and send promotional communications (with your consent).' },
            { title: '3. Information Sharing', content: 'We share your name, address, and contact details with the assigned service professional only after booking confirmation. We do not sell your personal information to third parties. We may share data with payment processors, cloud services, and analytics providers who are bound by confidentiality agreements.' },
            { title: '4. Data Security', content: 'We implement industry-standard security measures including SSL encryption, secure database storage, access controls, and regular security audits to protect your personal information.' },
            { title: '5. Your Rights', content: 'You have the right to access your personal data, correct inaccurate information, request deletion of your account, opt out of marketing communications, and file a complaint with relevant authorities.' },
            { title: '6. Cookies', content: 'We use cookies to maintain your session, remember preferences, and analyze site usage. You can control cookie settings through your browser.' },
            { title: '7. Contact Us', content: 'For privacy-related queries, contact us at privacy@nexora.in or visit our Contact page.' },
          ].map((section, i) => (
            <div key={i}>
              <h2 className="font-serif text-lg font-bold text-primary mb-3">{section.title}</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
