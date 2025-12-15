'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoreById, getStoreBySlug, Store } from '@/lib/services/storeService';
import { getCouponsByStoreId, Coupon } from '@/lib/services/couponService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';
import CouponPopup from '@/app/components/CouponPopup';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  // console.log("store: ", store);
  // console.log("idOrSlug: ", idOrSlug);

  useEffect(() => {
    // Set page title and meta tags for SEO
    if (store) {
      // Use SEO title if available, otherwise use default
      const pageTitle = store.seoTitle || `${store.name} - AvailCoupon`;
      document.title = pageTitle;
      
      // Update or create meta tags for SEO
      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', store.seoDescription || store.description || `Get exclusive coupons and deals from ${store.name}. Save money with verified promo codes!`);
      
      // Open Graph title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', pageTitle);
      
      // Open Graph description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', store.seoDescription || store.description || `Get exclusive coupons and deals from ${store.name}. Save money with verified promo codes!`);
    }
  }, [store]);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        // Try to fetch by slug first, then by ID
        let storeData = await getStoreBySlug(idOrSlug);
        
        if (!storeData) {
          // Try by ID if slug didn't work
          storeData = await getStoreById(idOrSlug);
        }

        // If not found in Firebase, try Supabase (via list API, match by slug or id)
        if (!storeData) {
          try {
            const res = await fetch('/api/stores/supabase');
            if (res.ok) {
              const data = await res.json();
              const supabaseList: Store[] = Array.isArray(data?.stores)
                ? (data.stores as Store[])
                : [];

              const matched = supabaseList.find(
                (s) => s.slug === idOrSlug || s.id === idOrSlug
              );

              if (matched) {
                storeData = matched;
              }              
            }
          } catch (supabaseError) {
            console.error('Error fetching store from Supabase list:', supabaseError);
          }
        }

        if (storeData) {
          setStore(storeData);

          // Fetch coupons for this store from both Firebase and Supabase
          if (storeData.id) {
            try {
              const [firebaseCoupons, supabaseResponse] = await Promise.all([
                getCouponsByStoreId(storeData.id),
                fetch('/api/coupons/supabase')
                  .then((res) => res.json())
                  .catch((err) => {
                    console.error('Error fetching Supabase coupons for store page:', err);
                    return { success: false, coupons: [] };
                  }),
              ]);

              const firebaseActive = (firebaseCoupons || []).filter(
                (coupon) => coupon.isActive
              );

              const supabaseList: Coupon[] = Array.isArray(supabaseResponse?.coupons)
                ? (supabaseResponse.coupons as Coupon[])
                : [];

              // Match Supabase coupons by store_id (mapped into storeIds as strings)
              const supabaseForStore = supabaseList.filter(
                (c) =>
                  Array.isArray(c.storeIds) &&
                  c.storeIds.includes(storeData!.id as string)
              );

              setCoupons([...firebaseActive, ...supabaseForStore]);
            } catch (couponErr) {
              console.error('Error fetching coupons for store:', couponErr);
              setCoupons([]);
            }
          }
        } else {
          // Store not found - set store to null to show "Store Not Found" page
          setStore(null);
          console.warn('Store not found for:', idOrSlug, '- This will show the "Store Not Found" page');
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        setStore(null); // Set to null to show error state
      } finally {
        setLoading(false);
      }
    };

    if (idOrSlug) {
      fetchStoreData();
    }
  }, [idOrSlug]);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        // Code copied successfully
        console.log('Code copied to clipboard:', text);
      }).catch((err) => {
        console.error('Clipboard API failed:', err);
        copyToClipboardFallback(text);
      });
    } else {
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Code copied to clipboard (fallback):', text);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  };

  const handleCouponClick = (coupon: Coupon) => {
    // Copy code to clipboard FIRST (before showing popup) - only for code type
    if (coupon.couponType === 'code' && coupon.code) {
      const codeToCopy = coupon.code.trim();
      copyToClipboard(codeToCopy);
    }
    
    // Show popup
    setSelectedCoupon(coupon);
    setShowPopup(true);
    
    // Automatically open URL in new tab after a short delay (to ensure popup is visible first)
    if (coupon.url && coupon.url.trim()) {
      setTimeout(() => {
        window.open(coupon.url, '_blank', 'noopener,noreferrer');
      }, 500);
    }
  };

  const handleContinue = () => {
    if (selectedCoupon?.url) {
      window.open(selectedCoupon.url, '_blank', 'noopener,noreferrer');
    }
    setShowPopup(false);
    setSelectedCoupon(null);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discount}% OFF`;
    } else {
      return `$${coupon.discount} OFF`;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  // Get last 2 digits for hover display
  const getLastTwoDigits = (coupon: Coupon): string | null => {
    if ((coupon.couponType || 'deal') === 'code' && coupon.code) {
      const code = coupon.code.trim();
      if (code.length >= 2) {
        return code.slice(-2);
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Loading store...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
            <p className="text-gray-600 mb-6">The store you're looking for doesn't exist.</p>
            <Link
              href="/stores"
              className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Browse All Stores
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Store Header Section */}
      <div className="w-full bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8">
            {/* Store Logo */}
            {store.logoUrl && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 flex items-center justify-center border border-gray-100">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Store Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight px-2 sm:px-0">
                {store.subStoreName || store.name}
              </h1>
              {store.voucherText && (
                <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs sm:text-sm md:text-base font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md sm:shadow-lg mb-3 sm:mb-4">
                  {store.voucherText}
                </div>
              )}
              {store.description && (
                <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl px-2 sm:px-0 leading-relaxed">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8 px-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
              Available <span className="text-orange-600">Coupons</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {coupons.length > 0 
                ? `Found ${coupons.length} active coupon${coupons.length !== 1 ? 's' : ''}`
                : 'No active coupons available at the moment'}
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl px-4">
              <p className="text-gray-500 text-base sm:text-lg">No coupons available for this store right now.</p>
              <Link
                href="/stores"
                className="inline-block mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
              >
                Browse Other Stores
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
            {coupons.map((coupon) => {
              const isExpired = coupon.expiryDate && coupon.expiryDate.toDate() < new Date();
              const isRevealed = false; // For store page, we don't track revealed state
              
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl sm:rounded-lg p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-orange-400 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-row items-center gap-2.5 sm:gap-3 md:gap-5 cursor-pointer active:scale-[0.98]"
                  style={{
                    overflow: 'visible',
                    minHeight: 'auto'
                  }}
                  onClick={() => handleCouponClick(coupon)}
                >
                  {/* Logo Section */}
                  <div className="flex-shrink-0">
                    {coupon.logoUrl ? (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 border border-gray-100">
                        <img
                          src={coupon.logoUrl}
                          alt={coupon.storeName || coupon.code}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?';
                              parent.innerHTML = `<span class="text-xs sm:text-sm font-semibold text-gray-500">${initial}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-500">
                          {coupon.code?.charAt(0) || coupon.storeName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2 sm:gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 pr-1">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 break-words mb-1 leading-tight line-clamp-2">
                        {coupon.storeName || coupon.code || 'Special Offer'}
                      </h3>
                      <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-green-600">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[9px] sm:text-[10px] font-medium">Verified</span>
                        </div>
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                          {coupon.expiryDate ? (
                            <>
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="whitespace-nowrap">{formatDate(coupon.expiryDate) || '31 Dec, 2025'}</span>
                            </>
                          ) : (
                            <span className="whitespace-nowrap">31 Dec, 2025</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Button on Right */}
                    <div className="flex-shrink-0">
                      {isExpired ? (
                        <div className="bg-red-50 text-red-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-center whitespace-nowrap border border-red-200">
                          Expired
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCouponClick(coupon);
                          }}
                          className="bg-gradient-to-r from-pink-500 via-pink-400 to-orange-500 border-2 border-dashed border-white/60 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 flex items-center justify-center gap-1.5 sm:gap-2 text-white font-semibold hover:from-pink-600 hover:via-pink-500 hover:to-orange-600 hover:border-white/80 active:scale-95 transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg whitespace-nowrap"
                          style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                        >
                          <span className="flex items-center justify-center text-[11px] sm:text-xs md:text-sm lg:text-base">
                            {isRevealed && coupon.couponType === 'code' && coupon.code ? (
                              <span className="font-bold drop-shadow-sm">
                                {coupon.code}
                              </span>
                            ) : (
                              <span className="drop-shadow-sm">
                                {coupon.couponType === 'code' 
                                  ? (coupon.getCodeText || 'Get Code')
                                  : (coupon.getDealText || 'Get Deal')}
                              </span>
                            )}
                          </span>
                          {getLastTwoDigits(coupon) && !isRevealed && (
                            <div className="hidden sm:flex w-0 opacity-0 group-hover:w-16 md:group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-out items-center justify-center border-l-2 border-dashed border-white/70 ml-1.5 sm:ml-2 pl-1.5 sm:pl-2 whitespace-nowrap overflow-hidden bg-gradient-to-r from-transparent to-orange-600/20" style={{ borderStyle: 'dashed' }}>
                              <span className="text-white font-bold text-[10px] sm:text-xs drop-shadow-md">...{getLastTwoDigits(coupon)}</span>
                            </div>
                          )}
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Back to Stores Link */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">
        <Link
          href="/stores"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base transition-colors active:opacity-70"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to All Stores</span>
        </Link>
      </div>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />
      
      {/* Footer */}
      <Footer />

      {/* Coupon Popup */}
      <CouponPopup
        coupon={selectedCoupon}
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          setSelectedCoupon(null);
        }}
        onContinue={handleContinue}
      />
    </div>
  );
}
