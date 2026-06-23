import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">DC</span>
              </div>
              <span className="text-lg font-bold">Dental Clinic</span>
            </div>
            <p className="text-gray-400 text-sm">Professional dental care for your family. AI-powered dental clinic management and WhatsApp automation software designed to scale practices and streamline patient care.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/book-appointment" className="hover:text-white transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-white mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Checkup & Cleaning</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Root Canal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Orthodontics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cosmetic Dentistry</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>Email: <a href="mailto:info@dentalclinic.com" className="hover:text-white">info@dentalclinic.com</a></p>
              <p>Phone: <a href="tel:+923001234567" className="hover:text-white">+92300-1234567</a></p>
              <p>Hours: Mon-Fri 2PM-11PM<br />Sat 9AM-2PM</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800"></div>
        {/* Bottom */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Designed and Developed by Arshi Architects. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
