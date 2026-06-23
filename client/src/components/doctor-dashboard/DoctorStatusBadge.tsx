import type { DoctorAppointmentStatus } from '../../hooks/useDoctorDashboard';
import { doctorStatusClasses, formatDoctorStatus } from './doctorFormat';

export const DoctorStatusBadge = ({ status }: { status: DoctorAppointmentStatus }) => {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${doctorStatusClasses[status]}`}
    >
      {formatDoctorStatus(status)}
    </span>
  );
};
