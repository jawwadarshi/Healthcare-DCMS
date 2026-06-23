import type { DoctorAppointment, DoctorService } from '../../hooks/useDoctorDashboard';
import {
  formatDoctorDate,
  formatDoctorTime,
} from './doctorFormat';
import { DoctorEmptyState, DoctorTableSkeleton } from './DoctorStates';
import { DoctorStatusBadge } from './DoctorStatusBadge';

export const DoctorAppointmentTable = ({
  appointments,
  serviceMap,
  isLoading,
  emptyTitle = 'No appointments found',
  emptyDescription = 'Appointments assigned to you will appear here.',
  onViewDetails,
}: {
  appointments: DoctorAppointment[];
  serviceMap: Map<string, DoctorService>;
  isLoading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onViewDetails?: (appointment: DoctorAppointment) => void;
}) => {
  const columnCount = onViewDetails ? 6 : 5;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <th className="px-5 py-3">Patient</th>
            <th className="px-5 py-3">Service</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Time</th>
            <th className="px-5 py-3">Status</th>
            {onViewDetails && <th className="px-5 py-3 text-right">Details</th>}
          </tr>
        </thead>
        {isLoading ? (
          <DoctorTableSkeleton rows={5} columns={columnCount} />
        ) : appointments.length > 0 ? (
          <tbody className="divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                  <p className="text-sm text-slate-500">{appointment.patientPhone}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {serviceMap.get(appointment.serviceId)?.name ?? 'Dental service'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDoctorDate(appointment.appointmentDate)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDoctorTime(appointment.appointmentTime)}
                </td>
                <td className="px-5 py-4">
                  <DoctorStatusBadge status={appointment.status} />
                </td>
                {onViewDetails && (
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetails(appointment)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      View
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td colSpan={columnCount}>
                <DoctorEmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
};
