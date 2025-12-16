"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, initializeSampleNotifications } from "@/lib/services/notificationsService";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)');
  const [promoIndex, setPromoIndex] = useState(0);
  
  const promotions = [
    "Get 35% Off Code FG6556KD",
    "Free Shipping on Orders Over $50",
    "New User Discount: 20% Off"
  ];
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
    
    initializeSampleNotifications();
    updateCounts();
    
    const handleFavoritesUpdate = () => updateCounts();
    const handleNotificationUpdate = () => updateCounts();
    
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    // Auto-rotate promotions
    const promoInterval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      clearInterval(promoInterval);
    };
  }, []);

  const updateCounts = () => {
    setFavoritesCount(getFavoritesCount());
    setNotificationsCount(getUnreadCount());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container') && !target.closest('.currency-dropdown-container')) {
        setSearchCategoryOpen(false);
        setCurrencyOpen(false);
      }
    };

    if (searchCategoryOpen || currencyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [searchCategoryOpen, currencyOpen]);

  const isActive = (path: string) => {
    if (path === '/categories') {
      return pathname === '/categories' || pathname?.startsWith('/categories/');
    }
    if (path === '/about-us') {
      return pathname === '/about-us';
    }
    if (path === '/contact-us') {
      return pathname === '/contact-us';
    }
    if (path === '/stores') {
      return pathname === '/stores';
    }
    return pathname === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query || selectedCategory) {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCategory) params.set('category', selectedCategory);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setSearchCategoryOpen(false);
  };

  return (
    <header className="w-full">
      {/* Top Utility Bar - Darker Teal Green */}
      <div className="bg-[#0B453C] text-white text-xs sm:text-sm py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-teal-200 cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Find a Store</span>
            </div>
            <div className="relative currency-dropdown-container">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1.5 hover:text-teal-200 transition-colors"
              >
                {selectedCurrency}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {currencyOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white text-gray-700 rounded shadow-lg z-50 min-w-[120px] border">
                  {['USD ($)', 'EUR (€)', 'GBP (£)', 'PKR (₨)'].map((currency) => (
                    <button
                      key={currency}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setCurrencyOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm first:rounded-t last:rounded-b"
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle - Promotional Banner */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length)}
              className="hover:text-teal-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-center min-w-[200px]">{promotions[promoIndex]}</span>
            <button 
              onClick={() => setPromoIndex((prev) => (prev + 1) % promotions.length)}
              className="hover:text-teal-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right Side - Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-200 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-teal-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </a>
            <a href="#" className="hover:text-teal-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-200 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header - Darker Teal Green */}
      <div className="bg-[#043830] text-white py-4 sm:py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left - Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-[#CD3D1C] p-2.5 rounded flex items-center justify-center w-12 h-12">
                <svg className="w-7 h-7 text-white absolute" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg className="w-4 h-4 text-white absolute opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">Cashora</span>
          </Link>

          {/* Middle - Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg w-full lg:w-auto lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex-1 lg:flex-initial overflow-hidden">
            <div className="relative category-dropdown-container">
              <button
                type="button"
                className={`flex items-center px-4 py-2.5 text-gray-700 font-medium text-sm rounded-l-full ${
                  selectedCategory ? 'text-[#CD3D1C]' : ''
                }`}
                onClick={() => setSearchCategoryOpen((v) => !v)}
              >
                <span>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Category' : 'Category'}</span>
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {searchCategoryOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                  <div 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleCategorySelect('')}
                  >
                    <span className={selectedCategory === '' ? 'font-semibold text-[#CD3D1C]' : ''}>All Categories</span>
                  </div>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => handleCategorySelect(category.id || '')}
                    >
                      {category.logoUrl && (
                        <img src={category.logoUrl} alt={category.name} className="w-5 h-5 object-contain" />
                      )}
                      <span className={selectedCategory === category.id ? 'font-semibold text-[#CD3D1C]' : ''}>
                        {category.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-300"></div>
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border-none outline-none bg-transparent text-gray-500 placeholder:text-gray-400 text-sm sm:text-base min-w-0"
            />
            <button
              type="submit"
              className="bg-[#CD3D1C] text-white font-semibold px-6 py-2.5 hover:bg-[#b02a0f] transition-colors rounded-r-full border-2 border-white"
            >
              Search
            </button>
          </form>

          {/* Right - Phone & Icons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Hotline: 196475</div>
                <div className="text-xs text-white/80">Call us for free</div>
              </div>
            </div>
            <button className="hover:text-teal-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3" />
              </svg>
            </button>
            <Link href="/favorites" className="relative hover:text-teal-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#CD3D1C] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </Link>
            <Link href="/profile" className="hover:text-teal-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation Links Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-6 lg:gap-8 overflow-x-auto scrollbar-hide py-2">
            <Link 
              href="/" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/categories" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/categories') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Categories
            </Link>
            <Link 
              href="/stores" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/stores') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Stores
            </Link>
            <Link 
              href="/faqs" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/faqs') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              FAQs
            </Link>
            <Link 
              href="/about-us" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/about-us') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              About Us
            </Link>
            <Link 
              href="/contact-us" 
              className={`font-semibold py-4 text-sm sm:text-base whitespace-nowrap transition-colors ${
                isActive('/contact-us') 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Contact Us
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative text-gray-700 hover:text-pink-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#CD3D1C] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationsCount > 9 ? '9+' : notificationsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
