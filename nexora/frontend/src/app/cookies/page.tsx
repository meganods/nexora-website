export const metadata = { title: 'Cookie Policy — Nexora', description: 'Nexora cookie policy — how we use cookies on our platform.' };

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-white/70">Last updated: August 2026</p>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 -mt-10 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 shadow-sm space-y-8">
          {[
            { title: 'What are Cookies?', content: 'Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your experience.' },
            { title: 'Cookies We Use', content: 'Session cookies (required for login and booking state), preference cookies (remember your city/location selection), analytics cookies (understand how users interact with our platform, using anonymised data), and security cookies (protect against fraud and CSRF attacks).' },
            { title: 'Third-Party Cookies', content: 'We use trusted third-party services including Google Analytics for usage insights, Cashfree for payment processing, and Cloudinary for image delivery. These services may set their own cookies.' },
            { title: 'Managing Cookies', content: 'You can control cookies through your browser settings. Note that disabling essential cookies may affect website functionality such as staying logged in.' },
            { title: 'Contact', content: 'For cookie-related questions, contact us at privacy@nexora.in.' },
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
