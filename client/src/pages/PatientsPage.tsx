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
} from '../components/staff-dashboard';
import {
  useCreatePatient,
  useDeletePatient,
  usePatientsQuery,
  useUpdatePatient,
  type Patient,
  type PatientFormValues,
} from '../hooks/usePatientsManagement';

const emptyPatientForm: PatientFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  gender: 'male',
  dateOfBirth: '',
  address: '',
  medicalHistory: 'None',
  allergies: 'None',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const toFormValues = (patient: Patient): PatientFormValues => ({
  firstName: patient.firstName,
  lastName: patient.lastName,
  phone: patient.phone,
  email: patient.email ?? '',
  gender: patient.gender,
  dateOfBirth: patient.dateOfBirth,
  address: patient.address,
  medicalHistory: patient.medicalHistory,
  allergies: patient.allergies,
  emergencyContactName: patient.emergencyContactName,
  emergencyContactPhone: patient.emergencyContactPhone,
});

const PatientForm = ({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  error,
}: {
  values: PatientFormValues;
  onChange: (values: PatientFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  error?: string;
}) => {
  const updateField = <Key extends keyof PatientFormValues>(
    key: Key,
    value: PatientFormValues[Key]
  ) => onChange({ ...values, [key]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="First name">
          <TextInput
            required
            value={values.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
        </Field>
        <Field label="Last name">
          <TextInput
            required
            value={values.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
        </Field>
        <Field label="Phone">
          <TextInput
            required
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </Field>
        <Field label="Gender">
          <SelectInput
            value={values.gender}
            onChange={(event) => updateField('gender', event.target.value as PatientFormValues['gender'])}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </SelectInput>
        </Field>
        <Field label="Date of birth">
          <TextInput
            required
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => updateField('dateOfBirth', event.target.value)}
          />
        </Field>
      </div>

      <Field label="Address">
        <TextAreaInput
          required
          value={values.address}
          onChange={(event) => updateField('address', event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Medical history">
          <TextAreaInput
            required
            value={values.medicalHistory}
            onChange={(event) => updateField('medicalHistory', event.target.value)}
          />
        </Field>
        <Field label="Allergies">
          <TextAreaInput
            required
            value={values.allergies}
            onChange={(event) => updateField('allergies', event.target.value)}
          />
        </Field>
        <Field label="Emergency contact name">
          <TextInput
            required
            value={values.emergencyContactName}
            onChange={(event) => updateField('emergencyContactName', event.target.value)}
          />
        </Field>
        <Field label="Emergency contact phone">
          <TextInput
            required
            value={values.emergencyContactPhone}
            onChange={(event) => updateField('emergencyContactPhone', event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export const PatientsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formValues, setFormValues] = useState<PatientFormValues>(emptyPatientForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const limit = 8;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const patientsQuery = usePatientsQuery({ page, limit, search: debouncedSearch });
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const patients = patientsQuery.data?.items ?? [];
  const total = patientsQuery.data?.meta.total ?? 0;
  const mutationError = useMemo(() => {
    const error = createPatient.error ?? updatePatient.error ?? deletePatient.error;
    return error instanceof Error ? error.message : undefined;
  }, [createPatient.error, deletePatient.error, updatePatient.error]);

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormValues(emptyPatientForm);
    setIsFormOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormValues(toFormValues(patient));
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingPatient(null);
    setFormValues(emptyPatientForm);
    createPatient.reset();
    updatePatient.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingPatient) {
        await updatePatient.mutateAsync({ id: editingPatient.id, values: formValues });
      } else {
        await createPatient.mutateAsync(formValues);
      }

      closeFormModal();
    } catch {
      // React Query exposes the mutation error in the modal.
    }
  };

  const confirmDelete = async () => {
    if (!deletingPatient) return;

    try {
      await deletePatient.mutateAsync(deletingPatient.id);
      setDeletingPatient(null);
    } catch {
      // React Query exposes the mutation error in the confirmation modal.
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Staff Workspace"
        title="Patients Management"
        description="Search, register, update, and organize patient records with the details your clinic team needs every day."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Add patient
          </button>
        }
      />

      {patientsQuery.isError && (
        <ErrorBanner message="Patients could not be loaded. Please check the API connection and try again." />
      )}

      <StaffPanel
        title="Patient Directory"
        description="Search by patient name or phone number"
        action={
          <div className="w-full md:w-80">
            <TextInput
              placeholder="Search patients..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3">Date of Birth</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {patientsQuery.isLoading ? (
              <TableSkeleton rows={limit} columns={6} />
            ) : patients.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 text-sm font-bold text-teal-700">
                          {patient.firstName.charAt(0)}
                          {patient.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-slate-500">Added {formatDate(patient.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">{patient.phone}</p>
                      <p className="text-sm text-slate-500">{patient.email || 'No email'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{patient.gender}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(patient.dateOfBirth)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status="active" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(patient)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPatient(patient)}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No patients found"
                      description="Try another search term or add a new patient record to begin."
                    />
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </StaffPanel>

      <StaffModal
        isOpen={isFormOpen}
        title={editingPatient ? 'Edit patient' : 'Add patient'}
        description="Keep patient demographics, contact details, and emergency information current."
        onClose={closeFormModal}
        size="xl"
      >
        <PatientForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
          isSubmitting={createPatient.isPending || updatePatient.isPending}
          submitLabel={editingPatient ? 'Update patient' : 'Create patient'}
          error={mutationError}
        />
      </StaffModal>

      <StaffModal
        isOpen={!!deletingPatient}
        title="Delete patient"
        description="This action will permanently remove the patient record."
        onClose={() => setDeletingPatient(null)}
        size="md"
      >
        {deletePatient.error && <ErrorBanner message="Patient could not be deleted. Please try again." />}
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">
            {deletingPatient?.firstName} {deletingPatient?.lastName}
          </span>
          ?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setDeletingPatient(null)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deletePatient.isPending}
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
          >
            {deletePatient.isPending ? 'Deleting...' : 'Delete patient'}
          </button>
        </div>
      </StaffModal>
    </div>
  );
};
