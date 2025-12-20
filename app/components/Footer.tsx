'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#0a2f2a] to-[#042b26] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="py-12 border-b border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* About Us Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">About Us</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                We bring you the best deals, exclusive coupons, and rewarding cashback offers. And ensure you save more on every purchase.
              </p>
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>(302) 555-0107</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Link</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white transition text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/coupons" className="text-gray-300 hover:text-white transition text-sm">
                    Browse Deals
                  </Link>
                </li>
                <li>
                  <Link href="/stores" className="text-gray-300 hover:text-white transition text-sm">
                    Stores
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white transition text-sm">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">Send Us Email</p>
                  <a href="mailto:demo@gmail.com" className="text-gray-300 hover:text-white transition text-sm">
                    demo@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Visit Our Location</p>
                  <p className="text-gray-300 text-sm">
                    1901 Thornridge Cir. Hawaii<br />54126
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Middle Section - Logo & Social Media */}
        <div className="py-8 border-b border-gray-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#CD3D1C] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">🛍️</span>
                </div>
                <span className="text-2xl font-bold">Mystery Store</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 mr-2">Follow Us On :</span>
              <a href="#" className="w-8 h-8 bg-[#CD3D1C] rounded-full flex items-center justify-center hover:bg-[#b03014] transition">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#CD3D1C] rounded-full flex items-center justify-center hover:bg-[#b03014] transition">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#CD3D1C] rounded-full flex items-center justify-center hover:bg-[#b03014] transition">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#CD3D1C] rounded-full flex items-center justify-center hover:bg-[#b03014] transition">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-[#CD3D1C] rounded-full flex items-center justify-center hover:bg-[#b03014] transition">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright & Payment Icons */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              Copyright © 2025 <span className="text-[#CD3D1C] font-semibold">Mystery Store</span>. All rights reserved.
            </p>

            {/* Payment Method Icons */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">VISA</span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold">
                  <span className="text-red-600">●●</span>
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">AMEX</span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-orange-500">₿</span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">GPay</span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">ApplePay</span>
              </div>
              <div className="px-3 py-1.5 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">$</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
