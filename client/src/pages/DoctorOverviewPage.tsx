import { Link } from 'react-router-dom';
import {
  DoctorAppointmentTable,
  DoctorErrorBanner,
  DoctorPageHeader,
  DoctorPanel,
  DoctorStatCard,
} from '../components/doctor-dashboard';
import { useAuth } from '../context/AuthContext';
import { useDoctorOverview } from '../hooks/useDoctorDashboard';

const TodayIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UpcomingIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CompletedIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CancelledIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const DoctorOverviewPage = () => {
  const { user } = useAuth();
  const { stats, recentAppointments, serviceMap, isLoading, isError } = useDoctorOverview(
    user?.userId
  );

  return (
    <div className="space-y-6">
      <DoctorPageHeader
        title="Doctor Dashboard"
        description="Review your schedule, track completed treatments, and jump into patient history from one focused clinical workspace."
        action={
          <Link
            to="/dashboard/my-appointments"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            View appointments
          </Link>
        }
      />

      {isError && (
        <DoctorErrorBanner message="Doctor dashboard data could not be loaded. Please check the API connection and try again." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DoctorStatCard
          title="Today's Appointments"
          value={stats.today}
          helper="Patients scheduled for today"
          icon={<TodayIcon />}
          accent="bg-gradient-to-r from-teal-500 to-cyan-400"
          isLoading={isLoading}
        />
        <DoctorStatCard
          title="Upcoming"
          value={stats.upcoming}
          helper="Confirmed and pending future visits"
          icon={<UpcomingIcon />}
          accent="bg-gradient-to-r from-blue-500 to-indigo-400"
          isLoading={isLoading}
        />
        <DoctorStatCard
          title="Completed"
          value={stats.completed}
          helper="Finished appointment records"
          icon={<CompletedIcon />}
          accent="bg-gradient-to-r from-emerald-500 to-teal-400"
          isLoading={isLoading}
        />
        <DoctorStatCard
          title="Cancelled"
          value={stats.cancelled}
          helper="Cancelled appointment records"
          icon={<CancelledIcon />}
          accent="bg-gradient-to-r from-rose-500 to-pink-400"
          isLoading={isLoading}
        />
      </div>

      <DoctorPanel
        title="Recent Appointments"
        description="Latest appointments assigned to you"
        action={
          <Link
            to="/dashboard/patient-history"
            className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
          >
            Patient history
          </Link>
        }
      >
        <DoctorAppointmentTable
          appointments={recentAppointments}
          serviceMap={serviceMap}
          isLoading={isLoading}
          emptyTitle="No recent appointments"
          emptyDescription="Appointments assigned to your doctor profile will appear here."
        />
      </DoctorPanel>
    </div>
  );
};
