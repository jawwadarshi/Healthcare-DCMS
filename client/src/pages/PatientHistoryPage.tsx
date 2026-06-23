import { useEffect, useMemo, useState } from 'react';
import {
  DoctorEmptyState,
  DoctorErrorBanner,
  DoctorPageHeader,
  DoctorPanel,
  DoctorStatusBadge,
  DoctorTableSkeleton,
  formatDoctorDate,
  formatDoctorTime,
} from '../components/doctor-dashboard';
import { TextInput } from '../components/staff-dashboard';
import { useAuth } from '../context/AuthContext';
import {
  useDoctorServicesQuery,
  usePatientHistoryQuery,
  usePatientSearchQuery,
  type DoctorPatient,
} from '../hooks/useDoctorDashboard';

const patientName = (patient: DoctorPatient) => `${patient.firstName} ${patient.lastName}`.trim();

export const PatientHistoryPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
  const patientSearchQuery = usePatientSearchQuery(debouncedSearch);
  const historyQuery = usePatientHistoryQuery(user?.userId, selectedPatient?.id);
  const servicesQuery = useDoctorServicesQuery();
  const serviceMap = useMemo(
    () => new Map((servicesQuery.data ?? []).map((service) => [service.id, service])),
    [servicesQuery.data]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const history = historyQuery.data ?? [];

  return (
    <div className="space-y-6">
      <DoctorPageHeader
        title="Patient History"
        description="Search patient records, review contact and medical details, and see appointment and treatment history linked to your care."
      />

      {(patientSearchQuery.isError || historyQuery.isError || servicesQuery.isError) && (
        <DoctorErrorBanner message="Patient history data could not be loaded. Please check the API connection and try again." />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <DoctorPanel
          title="Find Patient"
          description="Search by name or phone number"
          className="xl:col-span-1"
        >
          <div className="space-y-4 p-5">
            <TextInput
              placeholder="Search patients..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {patientSearchQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : debouncedSearch.trim().length <= 1 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                Enter at least two characters to search patient records.
              </p>
            ) : (patientSearchQuery.data ?? []).length > 0 ? (
              <div className="space-y-2">
                {(patientSearchQuery.data ?? []).map((patient) => {
                  const selected = selectedPatient?.id === patient.id;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full rounded-lg border p-4 text-left transition-all ${
                        selected
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{patientName(patient)}</p>
                      <p className="mt-1 text-sm text-slate-500">{patient.phone}</p>
                      <p className="text-xs text-slate-500">{patient.email || 'No email added'}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No patients match your search.
              </p>
            )}
          </div>
        </DoctorPanel>

        <div className="space-y-6 xl:col-span-2">
          <DoctorPanel title="Patient Details" description="Demographics and medical notes">
            {selectedPatient ? (
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Patient</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    {patientName(selectedPatient)}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-500">{selectedPatient.gender}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Contact</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedPatient.phone}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPatient.email || 'No email added'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Address</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedPatient.address}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Medical History</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedPatient.medicalHistory}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Allergies</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedPatient.allergies}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Emergency Contact</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedPatient.emergencyContactName} - {selectedPatient.emergencyContactPhone}
                  </p>
                </div>
              </div>
            ) : (
              <DoctorEmptyState
                title="Select a patient"
                description="Search for a patient and select a record to view their details."
              />
            )}
          </DoctorPanel>

          <DoctorPanel title="Appointment History" description="Previous and scheduled visits">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Notes</th>
                  </tr>
                </thead>
                {historyQuery.isLoading || servicesQuery.isLoading ? (
                  <DoctorTableSkeleton rows={4} columns={5} />
                ) : selectedPatient && history.length > 0 ? (
                  <tbody className="divide-y divide-slate-100">
                    {history.map((appointment) => (
                      <tr key={appointment.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
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
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {appointment.notes || 'No notes'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={5}>
                        <DoctorEmptyState
                          title={selectedPatient ? 'No appointment history' : 'Select a patient'}
                          description={
                            selectedPatient
                              ? 'No appointments with this patient are assigned to your doctor profile yet.'
                              : 'Patient appointment and treatment history will appear here after selection.'
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </DoctorPanel>
        </div>
      </div>
    </div>
  );
};
