export const metadata = { title: 'Terms & Conditions — Nexora', description: 'Nexora terms and conditions of use.' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-white/70">Last updated: August 2026</p>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 -mt-10 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 shadow-sm space-y-8">
          {[
            { title: '1. Acceptance of Terms', content: 'By using Nexora, you agree to these Terms & Conditions. If you disagree with any part, you may not access the service.' },
            { title: '2. Services Provided', content: 'Nexora is a marketplace platform connecting customers with independent service professionals. We do not directly provide the services; we facilitate the connection between customers and professionals.' },
            { title: '3. User Responsibilities', content: 'You must provide accurate information during registration and booking. You must be present at the service location during the scheduled time. You are responsible for maintaining the security of your account credentials.' },
            { title: '4. Booking & Payment', content: 'All bookings must be confirmed with payment. Cancellations made after professional assignment may be subject to cancellation fees as per our cancellation policy.' },
            { title: '5. OTP Verification', content: 'The service OTP is a security feature. You must not share it before the professional arrives at your location. Sharing OTP before arrival constitutes consent to service start.' },
            { title: '6. Limitation of Liability', content: 'Nexora\'s liability is limited to the amount paid for the specific service. We are not liable for indirect, incidental, or consequential damages.' },
            { title: '7. Dispute Resolution', content: 'Any disputes should be reported to our support team within 24 hours of service completion. We will investigate and respond within 48 business hours.' },
            { title: '8. Changes to Terms', content: 'We reserve the right to modify these terms. Continued use of the platform after changes constitutes acceptance of new terms.' },
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
