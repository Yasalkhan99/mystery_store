'use client';

import { useState } from 'react';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save subscription to Firestore and send email via Resend (API route handles both)
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Thank you for subscribing! Your email has been saved successfully.');
        setEmail('');
      } else {
        alert(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting newsletter:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white pt-4 sm:pt-6 md:pt-8 lg:pt-12 pb-3 sm:pb-4 md:pb-6 lg:pb-8 relative animate-fade-in-up">
      <div
        className="relative w-full bg-gradient-to-r from-[#0B453C] to-[#0f5c4e]"
        style={{
          minHeight: '140px',
          height: 'auto',
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Golden circles - hidden on mobile, visible on larger screens */}
          <div className="hidden sm:block absolute top-3 left-4 sm:left-8 w-2 sm:w-3 h-2 sm:h-3 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="hidden sm:block absolute top-6 left-12 sm:left-20 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full opacity-50"></div>
          <div className="hidden md:block absolute top-4 right-16 sm:right-32 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-yellow-400 rounded-full opacity-60"></div>

          {/* Decorative arcs and dots pattern - hidden on mobile */}
          <div className="hidden md:block absolute top-0 right-0 w-32 md:w-48 h-full opacity-20">
            <div className="w-full h-full relative">
              {/* Concentric arcs */}
              <svg className="absolute top-3 right-4 md:right-8" width="40" height="40" viewBox="0 0 50 50">
                <path d="M7,25 Q25,7 43,25" stroke="#ff6b35" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M9,25 Q25,9 41,25" stroke="#ff6b35" strokeWidth="1.5" fill="none" opacity="0.4" />
              </svg>
              {/* Grid of dots */}
              <div className="absolute top-8 md:top-10 right-6 md:right-10 grid grid-cols-3 md:grid-cols-4 gap-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-0.5 md:w-1 h-0.5 md:h-1 bg-orange-300 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full min-h-[140px] px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 relative z-10 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Text Content - Mobile: centered, Desktop: left aligned */}
          <div className="flex flex-col justify-center text-center md:text-left animate-slide-in-left w-full md:w-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-white">Subscribe Our Newsletter To Get The Best</span>
            </h2>
            <p className="text-lg md:text-xl text-white/90">
              Deals Right In Your Email
            </p>
          </div>

          {/* Email Form - Mobile: stacked, Desktop: side by side */}
          <div className="flex-shrink-0 w-full md:w-auto animate-slide-in-right">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto max-w-md md:max-w-none mx-auto md:mx-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email..."
                className="w-full sm:w-56 md:w-64 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-2.5 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 md:py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto shadow-sm hover:shadow-md active:scale-95"
              >
                <span>Send</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Left Side Illustration - Golden Bell (Half above, half inside) - Behind text */}
        <div
          className="hidden lg:block absolute left-8 pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: '120px',
            height: '140px',
            zIndex: 1,
          }}
        >
          <img
            src="/Image.svg"
            alt="Bell illustration"
            className="w-full h-full object-contain opacity-80"
          />
        </div>

        {/* Right Side Illustration - Documents and Envelope (Half above, half inside) */}
        <div
          className="hidden lg:block absolute right-8 pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: '120px',
            height: '140px',
            zIndex: 1,
          }}
        >
          <img
            src="/Image (1).svg"
            alt="Newsletter illustration"
            className="w-full h-full object-contain opacity-80"
          />
        </div>
      </div>
    </div>
  );
}

