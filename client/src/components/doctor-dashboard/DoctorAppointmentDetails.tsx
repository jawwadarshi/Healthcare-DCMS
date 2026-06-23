import type { DoctorAppointment, DoctorService } from '../../hooks/useDoctorDashboard';
import { StaffModal } from '../staff-dashboard';
import { formatDoctorDate, formatDoctorTime } from './doctorFormat';
import { DoctorStatusBadge } from './DoctorStatusBadge';

export const DoctorAppointmentDetails = ({
  appointment,
  service,
  onClose,
}: {
  appointment: DoctorAppointment | null;
  service?: DoctorService;
  onClose: () => void;
}) => {
  return (
    <StaffModal
      isOpen={!!appointment}
      title="Appointment Details"
      description="Patient, service, timing, and clinical notes for this appointment."
      onClose={onClose}
      size="lg"
    >
      {appointment && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Patient</p>
              <p className="mt-2 font-bold text-slate-950">{appointment.patientName}</p>
              <p className="mt-1 text-sm text-slate-500">{appointment.patientPhone}</p>
              <p className="text-sm text-slate-500">{appointment.patientEmail}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
              <div className="mt-2">
                <DoctorStatusBadge status={appointment.status} />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Service</p>
              <p className="mt-2 font-semibold text-slate-900">{service?.name ?? 'Dental service'}</p>
              {service?.description && (
                <p className="mt-1 text-sm text-slate-500">{service.description}</p>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Schedule</p>
              <p className="mt-2 font-semibold text-slate-900">
                {formatDoctorDate(appointment.appointmentDate)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatDoctorTime(appointment.appointmentTime)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
            <p className="mt-2 text-sm text-slate-700">{appointment.notes || 'No notes added.'}</p>
          </div>
        </div>
      )}
    </StaffModal>
  );
};
