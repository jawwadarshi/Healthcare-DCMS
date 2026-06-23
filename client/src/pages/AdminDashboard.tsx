import { Link } from 'react-router-dom';
import {
  ChartPlaceholder,
  DashboardPanel,
  EmptyState,
  StatCard,
} from '../components/admin-dashboard';
import {
  useAdminDashboardData,
  type RecentAppointment,
  type RecentPatient,
} from '../hooks/useDashboardData';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  paid: 'bg-teal-50 text-teal-700 ring-teal-200',
};

const formatStatus = (status: string) =>
  status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
      statusStyles[status.toLowerCase()] ?? 'bg-slate-50 text-slate-700 ring-slate-200'
    }`}
  >
    {formatStatus(status)}
  </span>
);

const PatientsIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20a5 5 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8zm6-1.5a3 3 0 100-6 3 3 0 000 6zm2 9.5a4.5 4.5 0 00-3-4.24"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M8 7V4m8 3V4M5 10h14M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const RevenueIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 6v12m3-9.5A3.5 3.5 0 0012 7a3 3 0 00-3 3c0 1.5 1.1 2.3 3 2.7 1.9.4 3 1.2 3 2.8a3 3 0 01-3 3 3.7 3.7 0 01-3.3-1.8"
    />
  </svg>
);

const ServicesIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 6v12m6-6H6m12.5 6.5a9.2 9.2 0 01-13 0 9.2 9.2 0 010-13 9.2 9.2 0 0113 0 9.2 9.2 0 010 13z"
    />
  </svg>
);

const LoadingRows = ({ rows = 4 }: { rows?: number }) => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 px-5 py-4">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
      </div>
    ))}
  </div>
);

const RecentAppointments = ({
  appointments,
  isLoading,
}: {
  appointments: RecentAppointment[];
  isLoading: boolean;
}) => (
  <DashboardPanel
    title="Recent Appointments"
    subtitle="Latest patient visits and booking requests"
    className="lg:col-span-2"
    action={
      <Link
        to="/dashboard/appointments"
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        View all
      </Link>
    }
  >
    {isLoading ? (
      <LoadingRows rows={5} />
    ) : appointments.length === 0 ? (
      <EmptyState title="No recent appointments" description="New bookings will appear here once patients start scheduling visits." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                  {appointment.patientName}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{appointment.serviceName}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{appointment.date}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{appointment.time}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={appointment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </DashboardPanel>
);

const RecentPatients = ({ patients, isLoading }: { patients: RecentPatient[]; isLoading: boolean }) => (
  <DashboardPanel title="Recent Patients" subtitle="Newest patient profiles">
    {isLoading ? (
      <LoadingRows rows={5} />
    ) : patients.length === 0 ? (
      <EmptyState title="No recent patients" description="Patient records created by your team will show up here." />
    ) : (
      <div className="divide-y divide-slate-100">
        {patients.map((patient) => (
          <div key={patient.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 text-sm font-bold text-teal-700">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-900">{patient.name}</p>
                <StatusBadge status={patient.status} />
              </div>
              <p className="mt-1 truncate text-sm text-slate-500">{patient.email}</p>
              <p className="mt-1 text-xs text-slate-500">{patient.phone}</p>
              <p className="mt-3 text-xs font-medium text-slate-400">Joined {patient.joinDate}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </DashboardPanel>
);

export const AdminDashboard = () => {
  const { stats, recentAppointments, recentPatients, isLoading, isError, isFetching } =
    useAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100">
              Admin Overview
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              Clinic command center
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor patients, bookings, service activity, and revenue signals from one clean workspace.
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-white">
            {isFetching ? 'Refreshing dashboard data...' : 'Dashboard data is up to date'}
          </div>
        </div>
        {isError && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some dashboard data could not be loaded. Please confirm the API server is running.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={numberFormatter.format(stats.totalPatients)}
          helper="Registered patient records"
          icon={<PatientsIcon />}
          accent="bg-gradient-to-r from-teal-500 to-cyan-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Appointments"
          value={numberFormatter.format(stats.totalAppointments)}
          helper="Bookings across the clinic"
          icon={<CalendarIcon />}
          accent="bg-gradient-to-r from-blue-500 to-indigo-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={currencyFormatter.format(stats.totalRevenue)}
          helper="Completed appointment value"
          icon={<RevenueIcon />}
          accent="bg-gradient-to-r from-emerald-500 to-teal-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Services"
          value={numberFormatter.format(stats.activeServices)}
          helper="Services available for booking"
          icon={<ServicesIcon />}
          accent="bg-gradient-to-r from-amber-500 to-orange-400"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentAppointments appointments={recentAppointments} isLoading={isLoading} />
        <RecentPatients patients={recentPatients} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPlaceholder
          title="Appointments Overview"
          description="Weekly booking volume placeholder"
          tone="blue"
          bars={[42, 58, 48, 72, 64, 86, 76]}
        />
        <ChartPlaceholder
          title="Revenue Overview"
          description="Monthly revenue trend placeholder"
          tone="teal"
          bars={[36, 44, 52, 49, 68, 74, 88]}
        />
      </div>
    </div>
  );
};
