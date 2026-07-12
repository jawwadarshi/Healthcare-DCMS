import { useState } from 'react';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';

interface FloatingSocialButtonsProps {
    whatsappNumber?: string;
    facebookUrl?: string;
    showTooltip?: boolean;
}

export const FloatingSocialButtons = ({
    whatsappNumber = '+1(555)653-2859',
    facebookUrl = 'https://facebook.com/myDentalClinic',
    showTooltip = true,
}: FloatingSocialButtonsProps) => {
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleWhatsAppClick = async () => {
        setIsRedirecting(true);

        // Fallback to a placeholder if your environment variable isn't loaded yet
        const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://healthcare-dcms.onrender.com';
        const cleanNumber = whatsappNumber.replace(/\D/g, '');
        const whatsappLink = `https://wa.me/${cleanNumber}?text=hi`;

        // 1. Fire a background wake-up ping immediately
        fetch(`${BACKEND_URL}/api/health`).catch(() => {
            /* Fire-and-forget: ignore errors, we just want to wake up the container */
        });

        // 2. Introduce a 1.2s delay to give the backend an aggressive head start 
        // while they transition out of your site into the WhatsApp application
        setTimeout(() => {
            setIsRedirecting(false);
            window.open(whatsappLink, '_blank', 'noopener,noreferrer');
        }, 1200);
    };

    const handleFacebookClick = () => {
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            {/* Smooth transition overlay that turns a server lag into a sleek feature */}
            {isRedirecting && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white transition-all duration-300">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-400 mb-3"></div>
                    <p className="text-sm font-medium tracking-wide">Connecting to our clinic on WhatsApp...</p>
                </div>
            )}

            {/* CHANGED: fixed bottom-6 right-6 -> fixed bottom-6 left-6 */}
            <div className="fixed bottom-6 left-6 flex flex-col gap-4 z-50">
                {/* WhatsApp Button */}
                {/* CHANGED: justify-end -> justify-start */}
                <div className="relative flex items-center justify-start">
                    <button
                        onClick={handleWhatsAppClick}
                        onMouseEnter={() => setHoveredButton('whatsapp')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="group relative w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white hover:text-white z-10"
                        aria-label="Chat on WhatsApp"
                    >
                        <FaWhatsapp className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></span>
                    </button>
                    {/* CHANGED: absolute right-16 -> absolute left-16, arrow orientation inverted */}
                    {showTooltip && hoveredButton === 'whatsapp' && (
                        <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg animate-fade-in">
                            Chat on WhatsApp
                            <div className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Facebook Button */}
                {/* CHANGED: justify-end -> justify-start */}
                <div className="relative flex items-center justify-start">
                    <button
                        onClick={handleFacebookClick}
                        onMouseEnter={() => setHoveredButton('facebook')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="group relative w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white hover:text-white z-10"
                        aria-label="Visit our Facebook"
                    >
                        <FaFacebook className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></span>
                    </button>
                    {/* CHANGED: absolute right-16 -> absolute left-16, arrow orientation inverted */}
                    {showTooltip && hoveredButton === 'facebook' && (
                        <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg animate-fade-in">
                            Visit our Facebook
                            <div className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};