"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/public/contact', formData);
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/70 text-lg">We're here to help. Reach out to our support team.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-10 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {[
            { icon: Mail, title: 'Email Support', value: 'support@nexora.in', href: 'mailto:support@nexora.in', desc: 'We respond within 24 hours' },
            { icon: Phone, title: 'Phone Support', value: '+91 98765 43210', href: 'tel:+919876543210', desc: 'Mon–Sat, 9 AM to 7 PM' },
            { icon: MessageSquare, title: 'Live Chat', value: 'Chat with us', href: '#', desc: 'Available during business hours' },
            { icon: MapPin, title: 'Office', value: 'Mumbai, India', href: '#', desc: 'Head office location' },
          ].map((item, i) => (
            <a key={i} href={item.href} className="bg-white rounded-3xl p-7 border border-gold/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block group">
              <div className="w-12 h-12 bg-primary/8 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-serif font-bold text-primary mb-1">{item.title}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
              <p className="text-xs text-foreground/50 mt-1">{item.desc}</p>
            </a>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gold/20 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-primary mb-6">Send a Message</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-cream border border-gold/25 rounded-2xl text-sm focus:outline-none focus:border-primary transition-colors" />
              <input type="email" placeholder="Your Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-cream border border-gold/25 rounded-2xl text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
            <input type="text" placeholder="Subject" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 bg-cream border border-gold/25 rounded-2xl text-sm focus:outline-none focus:border-primary transition-colors" />
            <textarea rows={5} placeholder="Your message..." required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 bg-cream border border-gold/25 rounded-2xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
            <button type="submit" disabled={loading} className="px-8 py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
