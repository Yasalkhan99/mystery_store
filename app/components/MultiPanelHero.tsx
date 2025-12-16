'use client'

import { useEffect, useState } from 'react'
import { getBannersWithLayout, Banner } from '@/lib/services/bannerService'
import { getCoupons, Coupon } from '@/lib/services/couponService'
import Link from 'next/link'

interface PanelItem {
  id: string
  imageUrl: string
  title: string
  discount?: string
  link?: string
}

export default function MultiPanelHero() {
  const [banners, setBanners] = useState<(Banner | null)[]>(Array(4).fill(null))
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, couponsData] = await Promise.all([
          getBannersWithLayout(),
          getCoupons()
        ])
        console.log('Fetched banners:', bannersData)
        console.log('Fetched coupons:', couponsData)
        setBanners(bannersData)
        setCoupons(couponsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Prepare panel items from banners or coupons - Only 4 banners needed
  const getPanelItem = (index: number, fallbackCoupon?: Coupon): PanelItem | null => {
    const banner = banners[index]
    if (banner) {
      return {
        id: `banner-${index}`,
        imageUrl: banner.imageUrl,
        title: banner.title,
        discount: 'UP TO -30%',
        link: '#'
      }
    }
    if (fallbackCoupon && fallbackCoupon.logoUrl) {
      return {
        id: `coupon-${index}`,
        imageUrl: fallbackCoupon.logoUrl,
        title: fallbackCoupon.code || fallbackCoupon.storeName || '',
        discount: fallbackCoupon.discount ? `-${fallbackCoupon.discount}${fallbackCoupon.discountType === 'percentage' ? '%' : ''}` : 'UP TO -30%',
        link: fallbackCoupon.url || '#'
      }
    }
    return null
  }

  // Layout: 4 panels
  // Panel 1: Left (tall) - Layout Position 1
  // Panel 2: Middle Top (shorter) - Layout Position 2
  // Panel 3: Middle Bottom (shorter) - Layout Position 3
  // Panel 4: Right (tall) - Layout Position 4
  
  // Get banners by their layout position (order_index)
  const banner1 = banners.find(b => b?.layoutPosition === 1)
  const banner2 = banners.find(b => b?.layoutPosition === 2)
  const banner3 = banners.find(b => b?.layoutPosition === 3)
  const banner4 = banners.find(b => b?.layoutPosition === 4)
  
  // Convert Banner to PanelItem format
  const panel1Item: PanelItem | null = banner1 ? {
    id: banner1.id || 'panel1',
    imageUrl: banner1.imageUrl,
    title: banner1.title,
    discount: 'UP TO -30%',
    link: '#'
  } : getPanelItem(0, coupons[0])
  
  const panel2Item: PanelItem | null = banner2 ? {
    id: banner2.id || 'panel2',
    imageUrl: banner2.imageUrl,
    title: banner2.title,
    discount: 'UP TO -30%',
    link: '#'
  } : getPanelItem(1, coupons[1])
  
  const panel3Item: PanelItem | null = banner3 ? {
    id: banner3.id || 'panel3',
    imageUrl: banner3.imageUrl,
    title: banner3.title,
    discount: 'UP TO -30%',
    link: '#'
  } : getPanelItem(2, coupons[2])
  
  const panel4Item: PanelItem | null = banner4 ? {
    id: banner4.id || 'panel4',
    imageUrl: banner4.imageUrl,
    title: banner4.title,
    discount: 'UP TO -30%',
    link: '#'
  } : getPanelItem(3, coupons[3])

  if (loading) {
    return (
      <div className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Panel - Tall (More Increased Height) */}
            <div className="md:col-span-1">
              <div className="aspect-[3/5] bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            {/* Middle Panels - 2 Stacked (More Decreased Height) */}
            <div className="md:col-span-1 space-y-4">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="aspect-[4/3] bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            {/* Right Panel - Tall (More Increased Height) */}
            <div className="md:col-span-1">
              <div className="aspect-[3/5] bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PanelCard = ({ item, className = '' }: { item: PanelItem | null; className?: string }) => {
    if (!item) {
      return (
        <div className={`relative rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-200 flex items-center justify-center ${className}`}>
          <p className="text-gray-400 text-sm">Banner</p>
        </div>
      )
    }

    console.log('Rendering PanelCard with item:', item)

    return (
      <Link 
        href={item.link || '#'} 
        className={`group relative block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${className}`}
        style={{ backgroundColor: 'transparent' }}
      >
        {/* Discount Badge */}
        {item.discount && (
          <div className="absolute top-4 right-4 z-20 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {item.discount}
          </div>
        )}

        {/* Image Container */}
        <div className="relative w-full h-full" style={{ minHeight: '100%', backgroundColor: 'transparent', position: 'relative' }}>
          {item.imageUrl ? (
            <>
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ 
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 20,
                  backgroundColor: 'transparent'
                }}
                onLoad={(e) => {
                  console.log('✅ Image loaded successfully:', item.imageUrl)
                  const target = e.target as HTMLImageElement
                  target.style.opacity = '1'
                  target.style.visibility = 'visible'
                  target.style.display = 'block'
                }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', item.imageUrl)
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center bg-gray-200 p-4"><p class="text-gray-400 text-xs">Image failed to load</p><p class="text-gray-400 text-xs mt-2 break-all text-center">${item.imageUrl.substring(0, 50)}...</p></div>`
                  }
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
              <p className="text-gray-400">{item.title}</p>
            </div>
          )}
        </div>

        {/* Overlay on hover - only visible on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 pointer-events-none z-10"></div>
      </Link>
    )
  }

  return (
    <div className="w-full px-4 py-8 bg-gradient-to-b from-white to-amber-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Panel 1: Left - Tall (More Increased Height) */}
          <div className="md:col-span-1">
            <PanelCard
              item={panel1Item}
              className="aspect-[3/5] w-full"
            />
          </div>

          {/* Panel 2 & 3: Middle - Stacked (More Decreased Height, Positioned Lower) */}
          <div className="md:col-span-1 space-y-4 lg:space-y-6 pt-6 lg:pt-6">
            {/* Top Middle Panel */}
            <PanelCard
              item={panel2Item}
              className="aspect-[4/3] w-full"
            />
            {/* Bottom Middle Panel */}
            <PanelCard
              item={panel3Item}
              className="aspect-[4/3] w-full"
            />
          </div>

          {/* Panel 4: Right - Tall (More Increased Height) */}
          <div className="md:col-span-1">
            <PanelCard
              item={panel4Item}
              className="aspect-[3/5] w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
