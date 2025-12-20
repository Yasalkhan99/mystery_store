"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCategories, Category } from "@/lib/services/categoryService";
import { getTrendingStores, Store } from "@/lib/services/storeService";
import { getFavoritesCount } from "@/lib/services/favoritesService";
import { getUnreadCount, initializeSampleNotifications } from "@/lib/services/notificationsService";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Search, Menu, X, ChevronDown, User,
  Phone, Heart, ShoppingBag, Moon,
  MapPin, ChevronLeft, ChevronRight, Facebook, Twitter, Instagram, Youtube
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingStores, setTrendingStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Height of TopBar (~40px) + MiddleBar (~90px) = ~130px
    // We show shadow right as it sticks
    setIsScrolled(latest > 120);
  });

  const promotions = [
    "Get 35% Off Code FG6556KD",
    "Free Shipping on Orders Over $50",
    "New Arrivals - Check Them Out!"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, stores] = await Promise.all([
          getCategories(),
          getTrendingStores()
        ]);
        setCategories(cats);
        setTrendingStores(stores.filter((s): s is Store => s !== null));
      } catch (error) {
        console.error('Error fetching navbar data:', error);
      }
    };
    fetchData();
    initializeSampleNotifications();
    updateCounts();

    const handleUpdate = () => updateCounts();
    window.addEventListener('notificationUpdated', handleUpdate);
    window.addEventListener('favoritesUpdated', handleUpdate);

    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
      window.removeEventListener('favoritesUpdated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const updateCounts = () => {
    setFavoritesCount(getFavoritesCount());
    setNotificationsCount(getUnreadCount());
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

  // --- Dropdown Components ---

  // 1. Categories Mega Menu
  const CategoriesMenu = () => (
    <div className="grid grid-cols-4 gap-4 p-5 w-[650px] bg-white rounded-b-xl shadow-xl border border-gray-100 mt-2">
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {categories.slice(0, 10).map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.id}`} className="flex items-center gap-2 group/item p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: cat.backgroundColor || '#ccc' }}>
              {cat.logoUrl ? <img src={cat.logoUrl} className="w-4 h-4 object-contain" /> : cat.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-700 font-medium group-hover/item:text-[#CD3D1C] transition-colors">{cat.name}</span>
          </Link>
        ))}
      </div>
      <div className="col-span-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <h4 className="font-bold text-gray-900 mb-1 text-sm">All Categories</h4>
        <p className="text-[10px] text-gray-500 mb-3">Explore thousands of products</p>
        <Link href="/categories" className="text-[10px] bg-[#043830] text-white px-3 py-1.5 rounded hover:bg-[#064e42] transition-colors">
          View All
        </Link>
      </div>
    </div>
  );

  // 2. Stores Mega Menu
  const StoresMenu = () => (
    <div className="grid grid-cols-4 gap-4 p-5 w-[650px] bg-white rounded-b-xl shadow-xl border border-gray-100 mt-2">
      <div className="col-span-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {trendingStores.slice(0, 10).map((store) => (
          <Link key={store.id} href={store.slug ? `/stores/${store.slug}` : `/stores/${store.id}`} className="flex items-center gap-2 group/item p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full border border-gray-100 bg-white flex items-center justify-center">
              {store.logoUrl ? <img src={store.logoUrl} className="w-6 h-6 object-contain rounded-full" /> : <span className="text-xs font-bold text-gray-400">{store.name.charAt(0)}</span>}
            </div>
            <span className="text-sm text-gray-700 font-medium group-hover/item:text-[#CD3D1C] transition-colors truncate">{store.name}</span>
          </Link>
        ))}
      </div>
      <div className="col-span-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <h4 className="font-bold text-gray-900 mb-1 text-sm">Top Stores</h4>
        <p className="text-[10px] text-gray-500 mb-3">Find best coupons</p>
        <Link href="/stores" className="text-[10px] bg-[#043830] text-white px-3 py-1.5 rounded hover:bg-[#064e42] transition-colors">
          View All
        </Link>
      </div>
    </div>
  );

  // 3. Simple List Menu
  const SimpleMenu = ({ items }: { items: { label: string; href: string }[] }) => (
    <div className="w-48 bg-white rounded-b-xl shadow-xl border border-gray-100 py-2 mt-2">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="block px-4 py-2 text-sm text-gray-600 hover:text-[#CD3D1C] hover:bg-gray-50 font-medium">
          {item.label}
        </Link>
      ))}
    </div>
  );

  const navLinks = [
    { name: "Home", path: "/", component: null },
    {
      name: "Browse Deals",
      path: "/deals",
      component: <SimpleMenu items={[
        { label: "Top Deals", href: "/deals/top" },
        { label: "New Arrivals", href: "/deals/new" },
        { label: "Trending", href: "/deals/trending" }
      ]} />
    },
    { name: "Stores", path: "/stores", component: <StoresMenu /> },
    { name: "Categories", path: "/categories", component: <CategoriesMenu /> },
    {
      name: "Pages",
      path: "/pages",
      component: <SimpleMenu items={[
        { label: "About Us", href: "/about-us" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" }
      ]} />
    },
    {
      name: "Blogs",
      path: "/blog",
      component: <SimpleMenu items={[
        { label: "Latest News", href: "/blog" },
        { label: "Savings Tips", href: "/blog/tips" }
      ]} />
    },
  ];

  return (
    <>

      {/* 1. TOP BAR (Teal - Balances Size) */}
      <div className="bg-[#042b26] text-white text-[11px] py-2 border-b border-white/5 relative z-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full">
          <div className="hidden md:flex items-center gap-5 opacity-90">
            <Link href="/stores" className="flex items-center gap-1.5 hover:text-[#CD3D1C] transition-colors">
              <MapPin className="w-3.5 h-3.5" /> <span className="font-semibold tracking-wide">Find a Store</span>
            </Link>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#CD3D1C] transition-colors group relative">
              <span className="font-semibold tracking-wide">USD ($)</span> <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center gap-3">
            <button onClick={() => setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length)} className="hover:text-[#CD3D1C] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <AnimatePresence mode="wait">
              <motion.span key={promoIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="font-semibold tracking-wider text-center min-w-[200px]">
                {promotions[promoIndex]}
              </motion.span>
            </AnimatePresence>
            <button onClick={() => setPromoIndex((prev) => (prev + 1) % promotions.length)} className="hover:text-[#CD3D1C] transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="hidden md:flex items-center gap-3 opacity-90">
            <a href="#" className="hover:text-[#CD3D1C] transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-[#CD3D1C] transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-[#CD3D1C] transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-[#CD3D1C] transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE BAR (Teal - Compact) */}
      <div className="bg-[#0B453C] py-4 border-b border-[#0f5c4e] relative z-40 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-8">

            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="relative">
                <ShoppingBag className="w-8 h-8 text-white relative z-10" />
                <div className="absolute -bottom-1 -right-1 bg-[#CD3D1C] text-[8px] text-white px-1.5 rounded-full font-bold z-20">$</div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-none group-hover:text-gray-200 transition-colors">
                  Mystery<span className="font-light">Store</span>
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="flex w-full bg-white rounded-full p-0.5 shadow-lg items-center relative z-20 h-[46px]">
                <div className="relative pl-4 pr-2 border-r border-gray-200 group/cat">
                  <button type="button" className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-[#CD3D1C] transition-colors">
                    {categories.find(c => c.id === selectedCategory)?.name || "Category"} <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover/cat:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute top-10 left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover/cat:block z-50">
                    <button onClick={() => setSelectedCategory('')} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-medium">All Categories</button>
                    {categories.slice(0, 8).map(cat => (
                      <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs text-gray-600 truncate">{cat.name}</button>
                    ))}
                  </div>
                </div>
                <input type="text" placeholder="Search here..." className="flex-1 px-4 py-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button type="submit" className="mr-1 bg-[#CD3D1C] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#b03014] transition-all hover:shadow-md">Search</button>
              </form>
            </div>

            <div className="flex items-center gap-6 text-white">
              <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-white/20">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center"><Phone className="w-4 h-4 text-[#0B453C]" /></div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-teal-100/90 font-medium tracking-wide">Hotline:</span>
                  <span className="text-sm font-bold">196475</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="hidden sm:block hover:text-[#CD3D1C] transition-colors"><Moon className="w-5 h-5" /></button>
                <Link href="/favorites" className="relative hover:text-[#CD3D1C] transition-colors">
                  <Heart className="w-5 h-5" />
                  {favoritesCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#CD3D1C] rounded-full"></span>}
                </Link>
                <Link href="/profile" className="hover:text-[#CD3D1C] transition-colors"><User className="w-5 h-5" /></Link>
                <button className="lg:hidden p-1 ml-1 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR (White - Sticky) */}
      <div className={`w-full bg-white border-b border-gray-200 hidden lg:block sticky top-0 z-[100] transition-shadow duration-300 ${isScrolled ? "shadow-md" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group h-14 flex items-center" onMouseEnter={() => setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                  <Link href={link.path} className={`text-[13px] font-bold flex items-center gap-1 hover:text-[#CD3D1C] transition-colors uppercase tracking-wide ${pathname === link.path ? "text-[#CD3D1C]" : "text-gray-700"}`}>
                    {link.name} <ChevronDown className={`w-3.5 h-3.5 mt-0.5 text-gray-400 group-hover:rotate-180 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180 text-[#CD3D1C]' : ''}`} />
                  </Link>
                  <AnimatePresence>
                    {activeDropdown === link.name && link.component && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 z-50 pt-0">
                        {link.component}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <Link href="/submit-coupon" className="text-[13px] font-bold text-gray-600 hover:text-[#CD3D1C] transition-colors uppercase tracking-wide">Submit Coupon</Link>
              <Link href="/support" className="text-[13px] font-bold text-gray-600 hover:text-[#CD3D1C] transition-colors uppercase tracking-wide">Support & FAQs</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden fixed inset-x-0 top-[140px] z-50 bg-[#0B453C] border-t border-white/10 shadow-xl overflow-hidden">
            <div className="px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto text-white">
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex w-full bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                  <input type="text" placeholder="Search products..." className="flex-1 px-4 py-2 bg-transparent outline-none text-white placeholder:text-gray-300 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button type="submit" className="bg-[#CD3D1C] p-2 rounded-full text-white"><Search className="w-4 h-4" /></button>
                </form>
              </div>
              {navLinks.map((link) => (
                <Link key={link.name} href={link.path} onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-white/10 font-medium text-sm">{link.name}</Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/submit-coupon" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs text-gray-300">Submit Coupon</Link>
                <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs text-gray-300">Support & FAQs</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
