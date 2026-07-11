import { Link } from 'react-router-dom';
import { Button, ServiceCard, Loader, FloatingSocialButtons, AiReceptionistChat } from '../components';
import { FeedbackSection } from '../components/FeedbackSection';
import { ServiceCarousel } from '../components/ServiceCarousel';
import { useServices } from '../hooks';
import { usePreWarm } from '../hooks/usePreWarm';
export const HomePage = () => {
  // Passively trigger pre-warm on home page load
  usePreWarm();

  const { data: services, isLoading } = useServices();
  const featuredServices = services?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white">
      <FloatingSocialButtons
        whatsappNumber="+923237971017"
        facebookUrl="https://facebook.com/myDentalClinic"
      />
      <AiReceptionistChat />
      {/* Service Carousel - Premium Dynamic Slideshow */}
      <ServiceCarousel />

      {/* About Clinic Section - Premium Design */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* About Image */}
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-300 to-blue-300 rounded-2xl opacity-25 blur-lg"></div>
                <div className="relative bg-white rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/images/img2.jpg"
                    alt="Professional dental clinic team"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>

            {/* About Text */}
            <div className="order-1 md:order-2 space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">About Our Clinic</h2>
                <p className="text-base text-gray-600 leading-relaxed mb-4">
                  For over 20 years, we've been dedicated to providing exceptional dental care to families throughout our community. Our state-of-the-art facility and compassionate team work together to create positive, comfortable experiences for every patient.
                </p>
                <p className="text-base text-gray-600 leading-relaxed">
                  We believe that excellent dental care is about more than just treatment—it's about building lasting relationships with our patients and helping them achieve their healthiest, most beautiful smiles.
                </p>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  //{ icon: '🏆', title: 'Award-Winning', desc: 'Recognized for excellence' },
                  { icon: '⚡', title: 'Latest Tech', desc: 'State-of-the-art equipment' },
                  { icon: '👥', title: 'Expert Team', desc: '15+ experienced dentists' },
                  { icon: '❤️', title: 'Patient Care', desc: 'Your comfort first' },
                ].map((feature, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-teal-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-2xl mb-1">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-xs mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <Link to="/contact">
                <Button className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform transition hover:scale-105">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section - Enhanced */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Featured Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive dental solutions tailored to meet all your oral health needs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {featuredServices.map((service) => (
                <div key={service.id} className="group h-full">
                  <ServiceCard
                    id={service.id}
                    name={service.name}
                    description={service.description}
                    durationInMinutes={service.durationInMinutes}
                    //basePrice={service.basePrice}
                    isActive={service.isActive}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No services available at the moment</p>
            </div>
          )}

          <div className="text-center">
            <Link to="/services">
              <Button variant="outline" className="px-6 py-3 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold rounded-lg" size="md">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Premium Design */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-teal-900 to-gray-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500 opacity-10 rounded-full -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500 opacity-10 rounded-full -ml-40 -mb-40"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Our Clinic?</h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              We're committed to providing exceptional care in a welcoming, modern environment
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: '👨‍⚕️',
                title: 'Expert Team',
                description: 'Board-certified dentists with extensive training and years of clinical experience',
              },
              {
                icon: '🔬',
                title: 'Advanced Technology',
                description: 'Cutting-edge digital imaging and painless treatment techniques',
              },
              {
                icon: '🛋️',
                title: 'Patient Comfort',
                description: 'Relaxing environment with amenities designed for your peace of mind',
              },
              {
                icon: '💎',
                title: 'Premium Results',
                description: 'Aesthetic and functional outcomes that exceed expectations',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300 rounded-xl p-5 border border-white/20 group cursor-pointer"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition duration-300">{item.icon}</div>
                <h3 className="text-lg font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-blue-100 leading-relaxed text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section - Premium Design */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { number: '5000+', label: 'Happy Patients', icon: '😊' },
              { number: '20+', label: 'Years Experience', icon: '⭐' },
              { number: '15+', label: 'Expert Dentists', icon: '👥' },
              { number: '50K+', label: 'Smiles Transformed', icon: '✨' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-blue-100">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-700 font-semibold text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Premium Design */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Patients Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from patients who've experienced our commitment to excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Zain',
                role: 'Business Owner',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
                rating: 5,
              },
              {
                name: 'Awais',
                role: 'Corporate Executive',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
                content:
                  'Exceptional service from start to finish. The staff is attentive, the facilities are pristine, and results are outstanding.',
                rating: 5,
              },
              {
                name: 'Dr. javeria',
                role: 'Healthcare Professional',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
                content:
                  'As a healthcare professional, I appreciate their commitment to quality and patient care. Highly recommended!',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition duration-300"
              >
                {/* Stars */}
                <div className="flex mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">
                        ★
                      </span>
                    ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 mb-5 leading-relaxed italic text-sm">
                  "{testimonial.content}"
                </p>

                {/* Patient Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <FeedbackSection />

      {/* Call to Action Section - Premium Design */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-600 via-blue-600 to-cyan-500 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-5 right-5 w-56 h-56 bg-white opacity-5 rounded-full"></div>
          <div className="absolute bottom-5 left-5 w-56 h-56 bg-white opacity-5 rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium mb-4">
            🎯 Limited Time Offer
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Ready to Transform Your Smile?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Schedule a consultation with our expert team today and discover how we can help you achieve the beautiful, healthy smile you've always wanted. Your journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/book-appointment">
              <Button className="px-6 py-3 bg-white text-teal-600 hover:bg-gray-100 font-semibold rounded-lg shadow-lg transform transition hover:scale-105 w-full sm:w-auto" size="md">
                Schedule Appointment
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                className="px-6 py-3 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-lg transition w-full sm:w-auto"
                size="md"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

