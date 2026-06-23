import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useServices, usePublicBooking, type Service } from '../hooks';
import { Input, Button, SectionTitle } from '../components';

const appointmentSchema = z.object({
  patientName: z.string().min(2, 'Name must be at least 2 characters'),
  patientEmail: z.string().email('Please enter a valid email'),
  patientPhone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number'),
  serviceId: z.string().min(1, 'Please select a service'),
  appointmentDate: z.string().min(1, 'Please select a date'),
  appointmentTime: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const PublicAppointmentPage = () => {
  const [searchParams] = useSearchParams();
  const { data: services, isLoading: isLoadingServices } = useServices();
  const bookingMutation = usePublicBooking();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const serviceIdFromUrl = searchParams.get('service');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      serviceId: serviceIdFromUrl || '',
    },
  });

  // Set service ID from URL parameter if available
  useEffect(() => {
    if (serviceIdFromUrl) {
      setValue('serviceId', serviceIdFromUrl);
    }
  }, [serviceIdFromUrl, setValue]);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      await bookingMutation.mutateAsync(data);
      setSuccessMessage('Appointment booked successfully! We will confirm your appointment shortly.');
      reset();
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      // Error is displayed in the error state
      console.error('Booking failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book an Appointment</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Schedule your dental appointment at a time that works best for you. Our friendly team is here to help.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
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
                  <h3 className="text-lg font-medium text-green-800">Success!</h3>
                  <p className="text-green-700 mt-2">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <SectionTitle
              title="Appointment Details"
              subtitle="Fill out the form below to book your appointment"
              centered={false}
            />

            {/* Error Message */}
            {bookingMutation.isError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 text-red-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Booking Failed</h3>
                    <p className="text-red-700 mt-2">
                      {bookingMutation.error instanceof Error
                        ? bookingMutation.error.message
                        : 'An error occurred while booking your appointment. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Information */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>

                <div className="space-y-4">
                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Zain Asif"
                    error={errors.patientName?.message}
                    disabled={bookingMutation.isPending}
                    {...register('patientName')}
                  />

                  {/* Email */}
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="zain@example.com"
                    error={errors.patientEmail?.message}
                    disabled={bookingMutation.isPending}
                    {...register('patientEmail')}
                  />

                  {/* Phone */}
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+92-300-1234567"
                    error={errors.patientPhone?.message}
                    disabled={bookingMutation.isPending}
                    {...register('patientPhone')}
                  />
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>

                <div className="space-y-4">
                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Service
                    </label>
                    <select
                      {...register('serviceId')}
                      disabled={isLoadingServices || bookingMutation.isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingServices ? 'Loading services...' : 'Choose a service...'}
                      </option>
                      {services?.map((service: Service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} {/*(${parseFloat(service.basePrice).toFixed(2)}) */}
                        </option>
                      ))}
                    </select>
                    {errors.serviceId && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceId.message}</p>
                    )}
                  </div>

                  {/* Appointment Date */}
                  <Input
                    label="Appointment Date"
                    type="date"
                    min={today}
                    error={errors.appointmentDate?.message}
                    disabled={bookingMutation.isPending}
                    {...register('appointmentDate')}
                  />

                  {/* Appointment Time */}
                  <Input
                    label="Appointment Time"
                    type="time"
                    error={errors.appointmentTime?.message}
                    disabled={bookingMutation.isPending}
                    {...register('appointmentTime')}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Any specific requests or medical information we should know about?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={4}
                  disabled={bookingMutation.isPending}
                />
                <p className="mt-1 text-sm text-gray-600">Max 500 characters</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={bookingMutation.isPending}
                disabled={bookingMutation.isPending || isLoadingServices}
              >
                {bookingMutation.isPending ? 'Booking Appointment...' : 'Book Appointment'}
              </Button>

              {/* Additional Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> We'll send your appointment details to the phone number you provide. Please use a WhatsApp-enabled number.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Why Book Online Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Why Book Online?"
            subtitle="Convenient scheduling at your fingertips"
          />

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: '⏰',
                title: 'Save Time',
                description: 'Book your appointment instantly without waiting on the phone',
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Book from anywhere, anytime on any device',
              },
              {
                icon: '✅',
                title: 'Instant Confirmation',
                description: 'Get appointment details through WhatsApp when notifications are enabled',
              },
              {
                icon: '🔔',
                title: 'Reminders',
                description: 'Receive reminder notifications before your appointment',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Can't Book Online?"
            subtitle="Contact us directly"
          />

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                label: 'Call Us',
                value: '+1-800-DENTAL-1',
                icon: '📞',
              },
              {
                label: 'Email Us',
                value: 'appointments@dentalclinic.com',
                icon: '📧',
              },
              {
                label: 'Hours',
                value: 'Mon-Fri: 9AM-6PM | Sat: 9AM-2PM',
                icon: '🕐',
              },
            ].map((contact, idx) => (
              <div key={idx}>
                <div className="text-4xl mb-3">{contact.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{contact.label}</h3>
                <p className="text-gray-300">{contact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Tips */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Booking Tips"
            subtitle="Make the most of your appointment"
          />

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Book in Advance',
                description: 'We recommend booking 1-2 weeks in advance to ensure your preferred time slot is available.',
              },
              {
                title: 'Arrive Early',
                description: 'Please arrive 10-15 minutes before your appointment for check-in and paperwork.',
              },
              {
                title: 'Medical History',
                description: 'Update your medical history and medications in the notes section to help us provide better care.',
              },
              {
                title: 'Cancellations',
                description: 'If you need to reschedule, please contact us at least 24 hours in advance.',
              },
            ].map((tip, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{tip.title}</h3>
                <p className="text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
