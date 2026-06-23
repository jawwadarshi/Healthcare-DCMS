import { useMemo, useState } from 'react';
import {
  DoctorAppointmentDetails,
  DoctorAppointmentTable,
  DoctorErrorBanner,
  DoctorPageHeader,
  DoctorPanel,
  formatDoctorStatus,
} from '../components/doctor-dashboard';
import { useAuth } from '../context/AuthContext';
import {
  filterDoctorAppointments,
  useDoctorAppointmentsQuery,
  useDoctorServicesQuery,
  type DoctorAppointment,
  type DoctorAppointmentFilter,
} from '../hooks/useDoctorDashboard';

const filters: { label: string; value: DoctorAppointmentFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const MyAppointmentsPage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<DoctorAppointmentFilter>('today');
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const appointmentsQuery = useDoctorAppointmentsQuery(user?.userId);
  const servicesQuery = useDoctorServicesQuery();
  const serviceMap = useMemo(
    () => new Map((servicesQuery.data ?? []).map((service) => [service.id, service])),
    [servicesQuery.data]
  );
  const filteredAppointments = useMemo(
    () => filterDoctorAppointments(appointmentsQuery.data ?? [], filter),
    [appointmentsQuery.data, filter]
  );

  return (
    <div className="space-y-6">
      <DoctorPageHeader
        title="My Appointments"
        description="View appointments assigned to you and filter your clinical schedule by visit state."
      />

      {(appointmentsQuery.isError || servicesQuery.isError) && (
        <DoctorErrorBanner message="Appointments could not be loaded. Please check the API connection and try again." />
      )}

      <DoctorPanel
        title="Appointment List"
        description={`Showing ${formatDoctorStatus(filter)} appointments`}
        action={
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  filter === item.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <DoctorAppointmentTable
          appointments={filteredAppointments}
          serviceMap={serviceMap}
          isLoading={appointmentsQuery.isLoading || servicesQuery.isLoading}
          emptyTitle="No appointments in this view"
          emptyDescription="Try another filter or check back once new appointments are assigned to you."
          onViewDetails={setSelectedAppointment}
        />
      </DoctorPanel>

      <DoctorAppointmentDetails
        appointment={selectedAppointment}
        service={selectedAppointment ? serviceMap.get(selectedAppointment.serviceId) : undefined}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
};
