import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Pagination,
  SelectInput,
  StaffModal,
  StaffPageHeader,
  StaffPanel,
  StatusBadge,
  TableSkeleton,
  TextAreaInput,
  TextInput,
  formatStatusLabel,
} from '../components/staff-dashboard';
import { CompleteTreatmentModal } from '../components/CompleteTreatmentModal';
import {
  appointmentStatuses,
  useAppointmentsQuery,
  useCreateAppointment,
  useDeleteAppointment,
  useStaffServicesQuery,
  //useUpdateAppointmentStatus,
  type AppointmentFormValues,
  type AppointmentStatus,
} from '../hooks/useAppointmentsManagement';
import { useAdminUsersQuery } from '../hooks/useAdminUsers';
import { useAuth } from '../context/AuthContext';
import { useAppointmentSocket } from '../hooks/useSocket';

const TODAY_KEY = new Date().toISOString().slice(0, 10);

const emptyAppointmentForm: AppointmentFormValues = {
  doctorId: '',
  serviceId: '',
  patientName: '',
  patientPhone: '',
  patientEmail: '',
  appointmentDate: '',
  appointmentTime: '',
  notes: '',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const formatTime = (value: string) => {
  const [hours = '0', minutes = '0'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
};

// Chronological sort: pending/confirmed today+upcoming first, then older
const sortChronological = <T extends { appointmentDate: string; appointmentTime: string; status: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const dateA = `${a.appointmentDate}T${a.appointmentTime}`;
    const dateB = `${b.appointmentDate}T${b.appointmentTime}`;

    const aActive = a.status === 'pending' || a.status === 'confirmed';
    const bActive = b.status === 'pending' || b.status === 'confirmed';

    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
};

const AppointmentForm = ({
  values, onChange, onSubmit, onCancel, isSubmitting, error, services, servicesLoading, doctors, doctorsLoading,
}: {
  values: AppointmentFormValues;
  onChange: (values: AppointmentFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
  services: { id: string; name: string }[];
  servicesLoading: boolean;
  doctors: { id: string; name: string }[];
  doctorsLoading: boolean;
}) => {
  const updateField = <Key extends keyof AppointmentFormValues>(key: Key, value: AppointmentFormValues[Key]) =>
    onChange({ ...values, [key]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Patient name">
          <TextInput required value={values.patientName} onChange={(event) => updateField('patientName', event.target.value)} />
        </Field>
        <Field label="Patient phone">
          <TextInput required value={values.patientPhone} onChange={(event) => updateField('patientPhone', event.target.value)} />
        </Field>
        <Field label="Patient email">
          <TextInput required type="email" value={values.patientEmail} onChange={(event) => updateField('patientEmail', event.target.value)} />
        </Field>
        <Field label="Doctor">
          <SelectInput required value={values.doctorId} onChange={(event) => updateField('doctorId', event.target.value)} disabled={doctorsLoading}>
            <option value="">{doctorsLoading ? 'Loading doctors...' : 'Select doctor'}</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Service">
          <SelectInput required value={values.serviceId} onChange={(event) => updateField('serviceId', event.target.value)} disabled={servicesLoading}>
            <option value="">{servicesLoading ? 'Loading services...' : 'Select service'}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Appointment date">
          <TextInput required type="date" value={values.appointmentDate} onChange={(event) => updateField('appointmentDate', event.target.value)} />
        </Field>
        <Field label="Appointment time">
          <TextInput required type="time" value={values.appointmentTime} onChange={(event) => updateField('appointmentTime', event.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <TextAreaInput value={values.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Optional appointment notes" />
      </Field>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">
          {isSubmitting ? 'Creating...' : 'Create appointment'}
        </button>
      </div>
    </form>
  );
};

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState<AppointmentFormValues>(emptyAppointmentForm);
  //const [statusError, setStatusError] = useState('');
  const [statusError] = useState<string | null>(null);
  const [completingAppointmentId, setCompletingAppointmentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const limit = 8;

  // Debounce search
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const appointmentsQuery = useAppointmentsQuery({ page, limit, status, appointmentDate });
  const servicesQuery = useStaffServicesQuery();
  const doctorsQuery = useAdminUsersQuery({ page: 1, limit: 100, role: 'doctor' });
  const createAppointment = useCreateAppointment();
  //const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const appointments = appointmentsQuery.data?.items ?? [];
  const total = appointmentsQuery.data?.meta.total ?? 0;
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const doctors = useMemo(() => doctorsQuery.data?.items ?? [], [doctorsQuery.data]);
  const serviceMap = useMemo(() => new Map(services.map((service) => [service.id, service.name])), [services]);
  const createError = createAppointment.error instanceof Error ? createAppointment.error.message : undefined;

  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const canHearAlerts = isAdmin || isStaff;

  // Client-side search filter
  const searchedAppointments = useMemo(() => {
    if (!debouncedSearch.trim()) return appointments;
    const q = debouncedSearch.toLowerCase();
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientPhone.toLowerCase().includes(q)
    );
  }, [appointments, debouncedSearch]);

  // Chronological sort
  const sortedAppointments = useMemo(() => sortChronological(searchedAppointments), [searchedAppointments]);

  // Alert stats
  const alertCounts = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const newToday = appointments.filter(
      (a) => a.status === 'pending' && a.appointmentDate >= TODAY_KEY
    ).length;
    return { pending, newToday };
  }, [appointments]);

  // Real-time socket listener for new appointments from other users
  /*useAppointmentSocket((data) => {
    if (canHearAlerts) {
      setToastMessage(`🔔 New Appointment Created: ${data.patientName} for ${data.appointmentDate} ${data.appointmentTime}`);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 5000);
      appointmentsQuery.refetch();
    },
  });
  */
  // Real-time socket listener for new appointments and WhatsApp dashboard updates
  useAppointmentSocket(
    // ✅ Existing: new appointment handler
    (data) => {
      if (canHearAlerts) {
        setToastMessage(`🔔 New Appointment: ${data.patientName} for ${data.appointmentDate} at ${data.appointmentTime}`);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 5000);
        appointmentsQuery.refetch();
      }
    },
    // ✅ NEW: WhatsApp dashboard update handler
    (data) => {
      if (!canHearAlerts) return;

      // Always refetch so new WhatsApp bookings appear in the table immediately
      appointmentsQuery.refetch();

      if (data.priority === 'urgent') {
        setToastMessage(`🚨 URGENT — ${data.message ?? data.type}`);
      } else if (data.priority === 'high') {
        setToastMessage(`⚠️ ${data.message ?? data.type}`);
      } else if (data.type === 'whatsapp_booking_created') {
        setToastMessage(`📱 WhatsApp Booking: ${data.patientName ?? 'Patient'} for ${data.appointmentDate ?? ''}`);
      } else if (data.type === 'whatsapp_reschedule_requested') {
        setToastMessage(`📅 Reschedule Request: ${data.patientName ?? 'Patient'}`);
      } else if (data.type === 'whatsapp_doctor_assistance_requested') {
        setToastMessage(`💬 Doctor Assistance: ${data.patientName ?? 'Patient'} — ${data.message ?? ''}`);
      } else {
        setToastMessage(`📱 WhatsApp: ${data.message ?? data.type}`);
      }

      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 6000);
    }
  );

  // Toast when this user creates an appointment
  useEffect(() => {
    if (createAppointment.isSuccess && createAppointment.data && canHearAlerts) {
      const data = createAppointment.data;
      setToastMessage(`🔔 New Appointment Created: ${data.patientName} for ${data.appointmentDate} ${data.appointmentTime?.slice(0, 5) || ''}`);
      setToastVisible(true);
      const timer = setTimeout(() => setToastVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [createAppointment.isSuccess, createAppointment.data, canHearAlerts]);

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setFormValues(emptyAppointmentForm);
    createAppointment.reset();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createAppointment.mutateAsync(formValues);
      closeCreateModal();
    } catch {
      // error handled via mutation
    }
  };

  /*const handleStatusChange = async (id: string, nextStatus: AppointmentStatus) => {
    setStatusError('');
    try {
      await updateStatus.mutateAsync({ id, status: nextStatus });
    } catch {
      setStatusError('Appointment status could not be updated. Please try again.');
    }
  }; */

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // error handled via mutation
    }
  };

  const handleStatusFilter = (nextStatus: AppointmentStatus | '') => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Staff Workspace"
        title="Appointments Management"
        description="Track daily bookings, filter clinic schedules, create appointments, and keep visit statuses current."
        action={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Create appointment
          </button>
        }
      />

      {/* Toast Notification */}
      {toastVisible && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-slide-in rounded-lg bg-teal-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <span>{toastMessage}</span>
            <button onClick={() => setToastVisible(false)} className="text-white/70 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Alert Banner for staff/admin */}
      {canHearAlerts && (alertCounts.pending > 0 || alertCounts.newToday > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-amber-800">📋 Appointment Summary</span>
            {alertCounts.pending > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                {alertCounts.pending} Pending
              </span>
            )}
            {alertCounts.newToday > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                {alertCounts.newToday} New Today
              </span>
            )}
          </div>
        </div>
      )}

      {(appointmentsQuery.isError || servicesQuery.isError) && (
        <ErrorBanner message="Appointments data could not be loaded. Please check the API connection and try again." />
      )}
      {statusError && <ErrorBanner message={statusError} />}

      <StaffPanel
        title="Appointment Schedule"
        description="Filter appointments by status or date"
        action={
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 md:w-auto">
            <TextInput
              placeholder="Search by name or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectInput
              value={status}
              onChange={(event) => handleStatusFilter(event.target.value as AppointmentStatus | '')}
            >
              <option value="">All statuses</option>
              {appointmentStatuses.map((s) => (
                <option key={s} value={s}>{formatStatusLabel(s)}</option>
              ))}
            </SelectInput>
            <TextInput
              type="date"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Current Status</th>
                <th className="px-5 py-3">Update Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {appointmentsQuery.isLoading ? (
              <TableSkeleton rows={limit} columns={7} />
            ) : sortedAppointments.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {sortedAppointments.map((appointment) => (
                  <tr key={appointment.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-sm text-slate-500">{appointment.patientPhone}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {serviceMap.get(appointment.serviceId) ?? 'Dental service'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(appointment.appointmentDate)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatTime(appointment.appointmentTime)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-5 py-4">
                      {appointment.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={() => setCompletingAppointmentId(appointment.id)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                        >
                          Complete Appointment
                        </button>
                      ) : (
                        <span className="text-sm text-slate-500">Completed</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(appointment.id)}
                          disabled={deleteAppointment.isPending}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete appointment"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No appointments found"
                      description="Clear filters or create a new appointment to populate the schedule."
                    />
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </StaffPanel>

      {/* Delete Confirmation Modal */}
      <StaffModal
        isOpen={!!confirmDeleteId}
        title="Delete Appointment"
        description="Are you sure you want to permanently delete this appointment? This action cannot be undone."
        onClose={() => setConfirmDeleteId(null)}
        size="md"
      >
        <div className="space-y-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setConfirmDeleteId(null)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</button>
            <button onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)} disabled={deleteAppointment.isPending}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400">
              {deleteAppointment.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </StaffModal>

      <StaffModal
        isOpen={isCreateOpen}
        title="Create appointment"
        description="Add a clinic-managed appointment for a patient and assign it to a doctor."
        onClose={closeCreateModal}
        size="xl"
      >
        <AppointmentForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={handleCreate}
          onCancel={closeCreateModal}
          isSubmitting={createAppointment.isPending}
          error={createError}
          services={services}
          servicesLoading={servicesQuery.isLoading}
          doctors={doctors}
          doctorsLoading={doctorsQuery.isLoading}
        />
      </StaffModal>

      <CompleteTreatmentModal
        appointmentId={completingAppointmentId || ''}
        isOpen={!!completingAppointmentId}
        onClose={() => setCompletingAppointmentId(null)}
        onSuccess={() => {
          setCompletingAppointmentId(null);
          appointmentsQuery.refetch();
        }}
      />
    </div>
  );
};