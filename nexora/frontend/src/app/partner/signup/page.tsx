"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PartnerSignupRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/partner/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-foreground/75 font-medium">Redirecting to new onboarding wizard...</p>
    </div>
  );
}
