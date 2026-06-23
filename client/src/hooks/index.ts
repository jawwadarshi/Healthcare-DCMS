export { useLogin, useLogout } from './useAuth';
export { useServices, usePublicBooking, type Service, type PublicBookingRequest } from './useServices';
export {
  useAdminDashboardData,
  useAppointmentsDashboardQuery,
  usePatientsDashboardQuery,
  useServicesDashboardQuery,
  type DashboardStats,
  type RecentAppointment,
  type RecentPatient,
} from './useDashboardData';
export {
  useCreatePatient,
  useDeletePatient,
  usePatientsQuery,
  useUpdatePatient,
  type Patient,
  type PatientFormValues,
} from './usePatientsManagement';
export {
  appointmentStatuses,
  useAppointmentsQuery,
  useCreateAppointment,
  useStaffServicesQuery,
  useUpdateAppointmentStatus,
  type Appointment,
  type AppointmentFormValues,
  type AppointmentStatus,
} from './useAppointmentsManagement';
export {
  filterDoctorAppointments,
  useDoctorAppointmentsQuery,
  useDoctorOverview,
  useDoctorServicesQuery,
  usePatientHistoryQuery,
  usePatientSearchQuery,
  type DoctorAppointment,
  type DoctorAppointmentFilter,
  type DoctorAppointmentStatus,
  type DoctorPatient,
  type DoctorService,
} from './useDoctorDashboard';
export {
  adminUserRoles,
  useAdminUsersQuery,
  type AdminUser,
  type AdminUserRole,
} from './useAdminUsers';
export {
  useAdminServicesQuery,
  useToggleServiceStatus,
  type AdminService,
} from './useAdminServices';
export {
  useCompleteTreatment,
  useTreatmentHistoryById,
  useTreatmentHistoryByAppointment,
  usePatientTreatmentHistory,
  type TreatmentHistory,
  type TreatmentHistoryService,
  type CompleteTreatmentRequest,
} from './useTreatmentHistory';
export {
  useCreateInvoice,
  useInvoiceById,
  usePatientInvoices,
  useUpdatePaymentStatus,
  type Invoice,
  type InvoiceItem,
  type CreateInvoiceRequest,
  type UpdatePaymentStatusRequest,
} from './useBilling';
