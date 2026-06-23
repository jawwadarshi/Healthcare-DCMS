import { Link } from 'react-router-dom';
import { SectionTitle, ServiceCard, Loader } from '../components';
import { useServices } from '../hooks';

export const ServicesPage = () => {
  const { data: services, isLoading, error } = useServices();

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Comprehensive dental care solutions for your entire family. Browse through our wide range of professional services.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Dental Services"
            subtitle="Professional care tailored to your needs"
          />

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Unable to Load Services</h3>
                  <p className="text-red-700 mt-2">
                    {error instanceof Error
                      ? error.message
                      : 'An error occurred while fetching services. Please try again later.'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!services || services.length === 0) && (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h3>
              <p className="text-gray-600 mb-6">
                We're currently updating our service catalog. Please check back soon.
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          )}

          {/* Services Grid */}
          {!isLoading && services && services.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  durationInMinutes={service.durationInMinutes}
                  //basePrice={service.basePrice}
                  isActive={service.isActive}
                />
              ))}
            </div>
          )}

          {/* Service Count */}
          {!isLoading && services && services.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-gray-600">
                Showing {services.length} service{services.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Service Categories Info */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Service Categories"
            subtitle="We offer a wide range of dental services"
          />

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: '🦷',
                title: 'General Dentistry',
                description: 'Regular checkups, cleanings, and preventive care',
              },
              {
                icon: '✨',
                title: 'Cosmetic Dentistry',
                description: 'Teeth whitening, veneers, and smile makeovers',
              },
              {
                icon: '🔧',
                title: 'Restorative',
                description: 'Fillings, crowns, bridges, and implants',
              },
              {
                icon: '😊',
                title: 'Orthodontics',
                description: 'Braces and aligner treatments for perfect alignment',
              },
            ].map((category, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Schedule Your Appointment?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose a service above and book your appointment today. Our team is ready to help!
          </p>
          <Link
            to="/book-appointment"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Book an Appointment
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Find answers to common questions about our services"
          />

          <div className="space-y-6">
            {[
              {
                question: 'Do you accept online payments?',
                answer:
                  'Yes, we accept it. Contact us to verify your coverage.',
              },
              {
                question: 'How often should I have checkups?',
                answer:
                  'We recommend regular checkups every 6 months for preventive care and early detection of issues.',
              },
              {
                question: 'Are your services suitable for children?',
                answer:
                  'Absolutely! We offer specialized pediatric dental services in a child-friendly environment.',
              },
              {
                question: 'Do you offer emergency services?',
                answer:
                  'Yes, we provide emergency dental services for urgent issues. Call our CLinic for immediate assistance.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
