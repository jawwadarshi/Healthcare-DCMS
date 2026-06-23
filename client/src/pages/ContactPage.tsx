import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, SectionTitle } from '../components';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactPage = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Contact form submitted:', data);
      setSuccessMessage('Thank you for your message! We will get back to you shortly.');
      reset();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clinicInfo = {
    address: 'Gujranwala,City, Pakistan',
    phone: '+92-300-1234567',
    email: 'info@dentalclinic.com',
    emergency: '+92-300-1234568',
  };

  const workingHours = [
    { day: 'Monday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Thursday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Friday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Have a question or ready to schedule your appointment? We'd love to hear from you. Reach out to us anytime!
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Address */}
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600 text-sm">{clinicInfo.address}</p>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600 text-sm mb-2">
                <a href={`tel:${clinicInfo.phone}`} className="hover:text-blue-600 transition-colors">
                  {clinicInfo.phone}
                </a>
              </p>
              <p className="text-xs text-gray-500">Emergency: <a href={`tel:${clinicInfo.emergency}`} className="text-blue-600 hover:text-blue-700">{clinicInfo.emergency}</a></p>
            </div>

            {/* Email */}
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm">
                <a href={`mailto:${clinicInfo.email}`} className="hover:text-blue-600 transition-colors">
                  {clinicInfo.email}
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-2">We reply within 24 hours</p>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="text-4xl mb-4">🕐</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hours</h3>
              <p className="text-xs text-gray-600">Mon-Fri: 9AM-6PM</p>
              <p className="text-xs text-gray-600">Sat: 9AM-2PM</p>
              <p className="text-xs text-gray-600">Sun: Closed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <SectionTitle
                  title="Send us a Message"
                  subtitle="Fill out the form below and we'll get back to you soon"
                  centered={false}
                />

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="h-6 w-6 text-green-600 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-green-800">Message Sent!</h3>
                        <p className="text-green-700 mt-2">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    error={errors.name?.message}
                    disabled={isSubmitting}
                    {...register('name')}
                  />

                  {/* Email */}
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="awais@example.com"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    {...register('email')}
                  />

                  {/* Phone (Optional) */}
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="+92-300-1234567"
                    error={errors.phone?.message}
                    disabled={isSubmitting}
                    {...register('phone')}
                  />

                  {/* Subject */}
                  <Input
                    label="Subject"
                    type="text"
                    placeholder="Appointment Inquiry"
                    error={errors.subject?.message}
                    disabled={isSubmitting}
                    {...register('subject')}
                  />

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Message
                    </label>
                    <textarea
                      {...register('message')}
                      placeholder="Tell us how we can help you..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
                      rows={5}
                      disabled={isSubmitting}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Max 1000 characters</p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Sidebar - Clinic Info & Hours */}
            <div className="space-y-6">
              {/* Clinic Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Dental Clinic</h3>

                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">📍 Address</h4>
                    <p className="text-gray-600 text-sm">{clinicInfo.address}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">📞 Phone</h4>
                    <a
                      href={`tel:${clinicInfo.phone}`}
                      className="text-blue-600 hover:text-blue-700 text-sm block"
                    >
                      {clinicInfo.phone}
                    </a>
                    <a
                      href={`tel:${clinicInfo.emergency}`}
                      className="text-gray-600 hover:text-blue-600 text-xs block mt-1"
                    >
                      Emergency: {clinicInfo.emergency}
                    </a>
                  </div>

                  {/* Email */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">📧 Email</h4>
                    <a
                      href={`mailto:${clinicInfo.email}`}
                      className="text-blue-600 hover:text-blue-700 text-sm break-all"
                    >
                      {clinicInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Working Hours Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Working Hours</h3>

                <div className="space-y-2">
                  {workingHours.map((schedule, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm font-medium text-gray-700">{schedule.day}</span>
                      <span className={`text-sm ${schedule.hours === 'Closed' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        {schedule.hours}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> For emergencies, call our emergency line anytime.
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>

                <div className="space-y-2">
                  <a href="/services" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    → View Services
                  </a>
                  <a href="/book-appointment" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    → Book Appointment
                  </a>
                  <a href="/" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    → Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Find Us on the Map"
            subtitle="Visit our clinic location"
          />

          {/* Google Maps Placeholder */}
          <div className="w-full h-96 bg-gray-300 rounded-lg shadow-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d107933.2423145456!2d74.11046845353597!3d32.18111005188896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391f29b1b22e1b1d%3A0xa98971f34114fc8e!2sGujranwala%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1719140000000!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map of Gujranwala"
            ></iframe>
          </div>
          {/* 
          <p className="text-center text-gray-600 mt-4 text-sm">
            Replace the Google Maps embed code with your actual clinic location
          </p> */}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Common contact questions"
          />

          <div className="space-y-6">
            {[
              {
                question: 'What are your office hours?',
                answer:
                  'We are open Monday to Friday from 9:00 AM to 6:00 PM and Saturday from 9:00 AM to 2:00 PM. We are closed on Sundays. For emergencies, our emergency line is available 24/7.',
              },
              {
                question: 'How can I schedule an appointment?',
                answer:
                  'You can schedule an appointment online through our website,Whatsapp us, or call us directly at our phone number, or send us an email. We usually respond within 24 hours.',
              },
              {
                question: 'Do you offer emergency services?',
                answer:
                  'Yes, we provide emergency dental services outside regular office hours. Please call our emergency line immediately if you experience a dental emergency.',
              },
              {
                question: 'What areas do you serve?',
                answer:
                  'We serve patients in the local area and surrounding regions. We welcome new and existing patients. If you have questions about our service area, please contact us directly.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Schedule Your Appointment?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Don't wait! Book your appointment today and experience world-class dental care.
          </p>
          <a
            href="/book-appointment"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Book Now
          </a>
        </div>
      </section>
    </div>
  );
};
