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

    const handleWhatsAppClick = () => {
        const cleanNumber = whatsappNumber.replace(/\D/g, '');
        const whatsappLink = `https://wa.me/${cleanNumber}?text=hi`;
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    };

    const handleFacebookClick = () => {
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        /* CHANGED: fixed bottom-6 right-6 -> fixed bottom-6 left-6 */
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
    );
};