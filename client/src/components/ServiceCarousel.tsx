import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface Slide {
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
}

const slides: Slide[] = [
    {
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80',
        title: 'Advanced Dental Treatments',
        subtitle: 'From routine cleanings to complex procedures — our cutting-edge technology ensures pain-free, precision care for every patient.',
        buttonText: 'Book Appointment',
        buttonLink: '/book-appointment',
    },
    {
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=80',
        title: 'Expert Cosmetic Dentistry',
        subtitle: 'Transform your smile with veneers, whitening, and smile makeovers. Our specialists create natural, stunning results tailored to you.',
        buttonText: 'Explore Services',
        buttonLink: '/services',
    },
    {
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
        title: 'Comfort-First Patient Care',
        subtitle: 'We prioritize your comfort with sedation options, modern amenities, and a warm, welcoming environment from the moment you walk in.',
        buttonText: 'Learn More',
        buttonLink: '/contact',
    },
    {
        image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=1200&q=80',
        title: 'Family & Pediatric Dentistry',
        subtitle: 'Gentle, compassionate care for patients of all ages. Building healthy smiles and lasting relationships with every family member.',
        buttonText: 'Meet Our Team',
        buttonLink: '/contact',
    },
];

export const ServiceCarousel = () => {
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const totalSlides = slides.length;

    const goTo = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrent(index);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [isTransitioning]);

    const next = useCallback(() => {
        goTo((current + 1) % totalSlides);
    }, [current, totalSlides, goTo]);

    const prev = useCallback(() => {
        goTo((current - 1 + totalSlides) % totalSlides);
    }, [current, totalSlides, goTo]);

    // Auto-play every 5 seconds
    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <section className="relative w-full overflow-hidden bg-gray-900">
            {/* Slides Container */}
            <div className="relative h-[500px] sm:h-[520px] md:h-[560px] lg:h-[600px]">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === current
                                ? 'opacity-100 translate-x-0'
                                : index < current
                                    ? 'opacity-0 -translate-x-full'
                                    : 'opacity-0 translate-x-full'
                            }`}
                    >
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${slide.image})` }}
                        >
                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex items-center h-full px-6 sm:px-12 lg:px-20">
                            <div className="max-w-2xl">
                                <div className="inline-block bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-teal-300 mb-4">
                                    #{String(index + 1).padStart(2, '0')} — Premium Care
                                </div>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
                                    {slide.title}
                                </h2>
                                <p className="text-base sm:text-lg text-gray-200 leading-relaxed mb-8 max-w-xl">
                                    {slide.subtitle}
                                </p>
                                <Link
                                    to={slide.buttonLink}
                                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                                >
                                    {slide.buttonText}
                                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prev}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all"
                aria-label="Previous slide"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={next}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all"
                aria-label="Next slide"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Bottom Indicator Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goTo(index)}
                        className={`transition-all duration-300 rounded-full ${index === current
                                ? 'w-8 h-2.5 bg-teal-400'
                                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Slide counter */}
            <div className="absolute top-5 right-5 z-20 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80">
                {current + 1} / {totalSlides}
            </div>
        </section>
    );
};