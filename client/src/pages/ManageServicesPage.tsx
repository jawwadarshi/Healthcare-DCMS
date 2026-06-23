import { useEffect, useState } from 'react';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Pagination,
  SelectInput,
  StaffModal,
  StaffPageHeader,
  StaffPanel,
  TableSkeleton,
  TextInput,
} from '../components/staff-dashboard';
import { useAuth } from '../context/AuthContext';
import {
  useAdminServicesQuery,
  useCreateService,
  useDeleteService,
  useToggleServiceStatus,
  type AdminService,
} from '../hooks/useAdminServices';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const ServiceStatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${active
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

const formatPrice = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? currencyFormatter.format(parsed) : value;
};

export const ManageServicesPage = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActive, setIsActive] = useState<'true' | 'false' | ''>('');
  const [statusError, setStatusError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const limit = 8;
  const servicesQuery = useAdminServicesQuery({
    page,
    limit,
    search: debouncedSearch,
    isActive,
  });
  const toggleStatus = useToggleServiceStatus();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const services = servicesQuery.data?.items ?? [];
  const total = servicesQuery.data?.meta.total ?? 0;
  const canManage = user?.role === 'admin';

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const handleStatusFilter = (nextStatus: 'true' | 'false' | '') => {
    setIsActive(nextStatus);
    setPage(1);
  };

  const handleToggle = async (service: AdminService) => {
    setStatusError('');

    try {
      await toggleStatus.mutateAsync({ id: service.id, isActive: !service.isActive });
    } catch {
      setStatusError('Service status could not be updated. Please try again.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice.trim()) return;

    try {
      await createService.mutateAsync({
        name: newServiceName.trim(),
        basePrice: newServicePrice.trim(),
      });
      setNewServiceName('');
      setNewServicePrice('');
      setIsCreateOpen(false);
    } catch {
      // Error handled via mutation state
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      setConfirmDelete(null);
    } catch {
      // Error handled via mutation state
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Admin Workspace"
        title="Services Management"
        description="Review dental services, pricing, appointment duration, and booking availability."
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Add Service
            </button>
          ) : undefined
        }
      />

      {servicesQuery.isError && (
        <ErrorBanner message="Services could not be loaded. Please confirm the API server is running." />
      )}
      {statusError && <ErrorBanner message={statusError} />}

      <StaffPanel
        title="Dental Services"
        description="Search services and filter by availability"
        action={
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-[28rem]">
            <TextInput
              placeholder="Search services..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectInput
              value={isActive}
              onChange={(event) => handleStatusFilter(event.target.value as 'true' | 'false' | '')}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </SelectInput>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3">Service Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Active Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {servicesQuery.isLoading ? (
              <TableSkeleton rows={limit} columns={6} />
            ) : services.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {services.map((service) => (
                  <tr key={service.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{service.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-md text-sm leading-6 text-slate-600">
                        {service.description}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {service.durationInMinutes} min
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatPrice(service.basePrice)}
                    </td>
                    <td className="px-5 py-4">
                      <ServiceStatusBadge active={service.isActive} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggle(service)}
                              disabled={toggleStatus.isPending}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {service.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(service.id)}
                              disabled={deleteService.isPending}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">Read only</span>
                        )}
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
                      title="No services found"
                      description="Try another search term or status filter."
                    />
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </StaffPanel>

      {/* Create Service Modal */}
      <StaffModal
        isOpen={isCreateOpen}
        title="Add New Service"
        description="Create a new clinical service with pricing."
        onClose={() => {
          setIsCreateOpen(false);
          setNewServiceName('');
          setNewServicePrice('');
          createService.reset();
        }}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {createService.isError && (
            <ErrorBanner
              message={
                createService.error instanceof Error
                  ? createService.error.message
                  : 'Failed to create service. Please try again.'
              }
            />
          )}
          <Field label="Service name">
            <TextInput
              required
              placeholder="e.g. Root Canal"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
            />
          </Field>
          <Field label="Base price">
            <TextInput
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 150.00"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
            />
          </Field>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setNewServiceName('');
                setNewServicePrice('');
                createService.reset();
              }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createService.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {createService.isPending ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </StaffModal>

      {/* Delete Confirmation Modal */}
      <StaffModal
        isOpen={!!confirmDelete}
        title="Delete Service"
        description="Are you sure you want to permanently delete this service? This action cannot be undone."
        onClose={() => setConfirmDelete(null)}
        size="md"
      >
        <div className="space-y-5">
          {deleteService.isError && (
            <ErrorBanner
              message={
                deleteService.error instanceof Error
                  ? deleteService.error.message
                  : 'Failed to delete service. Please try again.'
              }
            />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={deleteService.isPending}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {deleteService.isPending ? 'Deleting...' : 'Delete Service'}
            </button>
          </div>
        </div>
      </StaffModal>
    </div>
  );
};