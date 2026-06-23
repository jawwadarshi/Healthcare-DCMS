import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">DC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Dental Clinic</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/book-appointment">
                <Button size="sm">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">About</h3>
              <p className="text-gray-400 text-sm">Professional and AI-powered dental clinic management and WhatsApp automation system designed to scale practices and streamline patient care.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Services</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Checkup</a></li>
                <li><a href="#" className="hover:text-white">Cleaning</a></li>
                <li><a href="#" className="hover:text-white">Treatment</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">Email: info@dentalclinic.com</p>
              <p className="text-gray-400 text-sm">Phone: +92-300-1234567</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy;2026 Designed and Developed by Arshi Architects . All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
