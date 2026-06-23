import { Link } from 'react-router-dom';
import { Card } from './Card';

export interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  durationInMinutes: number;
  basePrice: string;
  isActive: boolean;
}

export const ServiceCard = ({
  id,
  name,
  description,
  durationInMinutes,
  basePrice,
  isActive,
}: ServiceCardProps) => {
  // Map service names to icons (you can extend this)
  const getServiceIcon = (serviceName: string) => {
    const iconMap: { [key: string]: string } = {
      'cleaning': '🦷',
      'filling': '🔧',
      'extraction': '⚙️',
      'root canal': '💉',
      'crown': '👑',
      'whitening': '✨',
      'implant': '🏗️',
      'orthodontics': '📐',
      'checkup': '👀',
      'consultation': '💬',
    };
    const lowerName = serviceName.toLowerCase();
    return Object.entries(iconMap).find(([key]) => lowerName.includes(key))?.[1] || '🦷';
  };

  return (
    <Card className="h-full bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl hover:border-teal-300 transform hover:-translate-y-2 transition duration-300 border border-blue-100 group">
      <div className="space-y-6 h-full flex flex-col">
        {/* Icon and Title */}
        <div className="space-y-3">
          <div className="text-5xl group-hover:scale-110 transition duration-300">
            {getServiceIcon(name)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-teal-600 transition">
            {name}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed min-h-[3rem]">
            {description}
          </p>
        </div>

        {/* Details Section */}
        <div className="flex-grow"></div>
        <div className="space-y-4 pt-6 border-t border-blue-200">
          {/* Duration and Price */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{durationInMinutes}</span> mins
              </div>
              {/*<div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                PKR{parseFloat(basePrice).toFixed(2)}
              </div > */}

            </div>

            <Link
              to={`/book-appointment?service=${id}`}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition duration-300 text-sm font-semibold whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>

          {/* Status Badge */}
          {!isActive && (
            <div className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg text-center">
              ⏸️ Currently unavailable
            </div>
          )}
          {isActive && (
            <div className="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-2 rounded-lg text-center">
              ✓ Available for booking
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
