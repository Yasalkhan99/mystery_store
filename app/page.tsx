import Navbar from "./components/Navbar";
import HeroBanners from "./components/HeroBanners";
import MultiPanelHero from "./components/MultiPanelHero";
import ShopByCategory from "./components/ShopByCategory";
import HowItWorks from "./components/HowItWorks";
import TrendingStores from "./components/TrendingStores";
import PopularCoupons from "./components/PopularCoupons";
import SpotlightBanner from "./components/SpotlightBanner";
import TrustedPartners from "./components/TrustedPartners";
import RecentNews from "./components/RecentNews";
import Newsletter from "./components/Newsletter";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import { getBannersWithLayout } from "@/lib/services/bannerService";

export const revalidate = 0; // Ensure dynamic data fetching

export default async function Home() {
  const banners = await getBannersWithLayout();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section with Multi-Panel Layout */}
      <MultiPanelHero initialBanners={banners} />
      {/* Shop by Category Section */}
      <ShopByCategory />
      {/* Trending Stores Section */}
      <TrendingStores />
      {/* Alternative: Use HeroBanners for different layout */}
      {/* <HeroBanners /> */}
      {/* How It Works Section */}
      <HowItWorks />
      {/* Popular Coupons Section */}
      <PopularCoupons />
      {/* Spotlight Banner Section (Layout 5) */}
      <SpotlightBanner />
      {/* Trusted Partners Section (Logos Grid) */}
      <TrustedPartners />
      {/* Recent News & Articles Section */}
      <RecentNews />
      {/* Newsletter Subscription Section */}
      <Newsletter />
      {/* Testimonials Section */}
      <Testimonials />
      {/* Footer Section */}
      <Footer />
    </div>
  );
}
