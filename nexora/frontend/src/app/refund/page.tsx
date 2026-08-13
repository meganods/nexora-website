export const metadata = { title: 'Refund Policy — Nexora', description: 'Nexora refund and cancellation policy.' };

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-white/70">Last updated: August 2026</p>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 -mt-10 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gold/20 shadow-sm space-y-8">
          {[
            { title: 'Full Refund', content: 'You are eligible for a full refund if you cancel your booking before a professional is assigned, or if the professional does not show up within 30 minutes of the scheduled time.' },
            { title: 'Partial Refund', content: 'A partial refund may be issued if the service is partially completed due to unforeseen circumstances or if you are not satisfied with the quality of service (subject to investigation).' },
            { title: 'No Refund', content: 'No refund will be issued if the service has been fully completed and confirmed by you, if you cancel after the professional has arrived at your location, or if the booking is cancelled less than 2 hours before the scheduled time.' },
            { title: 'How to Request a Refund', content: 'To request a refund, contact our support team within 24 hours of the service. Provide your booking ID and reason for the refund request. We will review and process eligible refunds within 5-7 business days.' },
            { title: 'Refund Processing Time', content: 'Approved refunds are processed within 5-7 business days. The amount will be credited to the original payment method. Bank processing times may vary.' },
          ].map((section, i) => (
            <div key={i} className="pb-6 border-b border-gold/10 last:border-0 last:pb-0">
              <h2 className="font-serif text-lg font-bold text-primary mb-3">{section.title}</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">{section.content}</p>
            </div>
          ))}
          <div className="bg-cream rounded-2xl p-5 border border-gold/15">
            <p className="text-sm font-bold text-primary mb-1">Need to request a refund?</p>
            <p className="text-xs text-foreground/60">Contact us at <a href="mailto:support@nexora.in" className="text-primary underline">support@nexora.in</a> or visit our <a href="/contact" className="text-primary underline">Contact page</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
