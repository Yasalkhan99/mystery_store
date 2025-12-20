'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
    id: number;
    name: string;
    role: string;
    text: string;
    rating: number;
    avatar: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        name: 'David Smith',
        role: 'Software Engineer',
        text: "I've saved so much money using this platform! From groceries to electronics, the cashback offers are legit and timely. What I love most is how easy it is to request money after making a purchase.",
        rating: 5,
        avatar: '👨‍💼'
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        role: 'Marketing Manager',
        text: "Amazing deals and cashback offers! This platform has become my go-to for all online shopping. The savings add up quickly and the process is super smooth.",
        rating: 5,
        avatar: '👩‍💼'
    },
    {
        id: 3,
        name: 'Michael Chen',
        role: 'Business Owner',
        text: "Best cashback platform I've used. The variety of stores and exclusive coupons make shopping so much more rewarding. Highly recommend!",
        rating: 5,
        avatar: '👨‍💻'
    },
    {
        id: 4,
        name: 'Emily Davis',
        role: 'Teacher',
        text: "Love the exclusive deals and how easy it is to save money on everyday purchases. The customer service is also top-notch!",
        rating: 5,
        avatar: '👩‍🏫'
    },
    {
        id: 5,
        name: 'James Wilson',
        role: 'Designer',
        text: "Great platform with amazing offers. I've saved hundreds of dollars in just a few months. The interface is clean and user-friendly.",
        rating: 5,
        avatar: '👨‍🎨'
    },
    {
        id: 6,
        name: 'Lisa Anderson',
        role: 'Entrepreneur',
        text: "Fantastic savings and excellent customer support. This platform makes online shopping so much more rewarding!",
        rating: 5,
        avatar: '👩‍💼'
    },
    {
        id: 7,
        name: 'Robert Taylor',
        role: 'Developer',
        text: "The best cashback platform I've ever used. Simple, effective, and the deals are always great!",
        rating: 5,
        avatar: '👨‍💻'
    }
];

export default function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const currentTestimonial = testimonials[currentIndex];

    // Calculate positions for avatar circle - matching reference image
    const getAvatarPosition = (index: number) => {
        const totalAvatars = testimonials.length;
        const angle = (index * 360) / totalAvatars - 90; // Start from top
        const radius = 220; // Distance from center
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return { x, y };
    };

    return (
        <section className="py-16 bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="relative">
                    {/* Avatar Circle Container */}
                    <div className="relative h-[450px] flex items-center justify-center">
                        {/* Avatars positioned in circle */}
                        {testimonials.map((testimonial, index) => {
                            const { x, y } = getAvatarPosition(index);
                            const isActive = index === currentIndex;

                            return (
                                <motion.button
                                    key={testimonial.id}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 border-2 ${isActive
                                        ? 'bg-[#CD3D1C] border-[#CD3D1C] scale-110 shadow-lg'
                                        : 'bg-gray-100 border-gray-200 hover:border-gray-300 hover:scale-105'
                                        }`}
                                    style={{
                                        left: `calc(50% + ${x}px)`,
                                        top: `calc(50% + ${y}px)`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {testimonial.avatar}
                                </motion.button>
                            );
                        })}

                        {/* Center Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="max-w-xl mx-auto text-center px-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Quote Icon */}
                                        <div className="flex justify-center mb-4">
                                            <Quote className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                                        </div>

                                        {/* Star Rating */}
                                        <div className="flex justify-center gap-1 mb-4">
                                            {[...Array(currentTestimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 fill-[#FFA500] text-[#FFA500]" />
                                            ))}
                                        </div>

                                        {/* Testimonial Text */}
                                        <p className="text-gray-700 text-base mb-6 leading-relaxed max-w-lg mx-auto">
                                            "{currentTestimonial.text}"
                                        </p>

                                        {/* Author Info */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-[#CD3D1C] rounded-full flex items-center justify-center text-3xl mb-3 shadow-md">
                                                {currentTestimonial.avatar}
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900">
                                                {currentTestimonial.name}
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                {currentTestimonial.role}
                                            </p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevTestimonial}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition border border-gray-200 z-20"
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                        onClick={nextTestimonial}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#CD3D1C] rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition z-20"
                        aria-label="Next testimonial"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </section>
    );
}
