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
import {
  adminUserRoles,
  useAdminUsersQuery,
  useRegisterUser,
  type AdminUser,
  type AdminUserRole,
} from '../hooks/useAdminUsers';
import { useAuth } from '../context/AuthContext';

const roleStyles: Record<AdminUserRole, string> = {
  admin: 'bg-violet-50 text-violet-700 ring-violet-200',
  doctor: 'bg-blue-50 text-blue-700 ring-blue-200',
  staff: 'bg-teal-50 text-teal-700 ring-teal-200',
  patient: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

const formatDate = (value: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const RoleBadge = ({ role }: { role: AdminUserRole }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleStyles[role]}`}>
    {formatRole(role)}
  </span>
);

const emptyForm = { name: '', email: '', password: '', role: '' as AdminUserRole | '' };

export const UsersPage = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<AdminUserRole | ''>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const limit = 8;
  const usersQuery = useAdminUsersQuery({ page, limit, search: debouncedSearch, role });
  const registerUser = useRegisterUser();
  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.meta.total ?? 0;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const handleRoleFilter = (nextRole: AdminUserRole | '') => {
    setRole(nextRole);
    setPage(1);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setFormValues(emptyForm);
    registerUser.reset();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name || !formValues.email || !formValues.password || !formValues.role) return;

    try {
      await registerUser.mutateAsync(formValues as { name: string; email: string; password: string; role: AdminUserRole });
      closeCreateModal();
    } catch {
      // Error handled via mutation state
    }
  };

  const canManage = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Admin Workspace"
        title="Users Management"
        description="Review system users, roles, and account creation history from a clean administrative directory."
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Add New User
            </button>
          ) : undefined
        }
      />

      {usersQuery.isError && (
        <ErrorBanner message="Users could not be loaded. Please confirm the server is running and your account has admin access." />
      )}

      <StaffPanel
        title="System Users"
        description="Search users and filter by role"
        action={
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-[28rem]">
            <TextInput
              placeholder="Search users..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectInput
              value={role}
              onChange={(event) => handleRoleFilter(event.target.value as AdminUserRole | '')}
            >
              <option value="">All roles</option>
              {adminUserRoles.map((userRole) => (
                <option key={userRole} value={userRole}>
                  {formatRole(userRole)}
                </option>
              ))}
            </SelectInput>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {usersQuery.isLoading ? (
              <TableSkeleton rows={limit} columns={5} />
            ) : users.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-teal-100 text-sm font-bold text-blue-700">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-900">{userItem.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{userItem.email}</td>
                    <td className="px-5 py-4">
                      <RoleBadge role={userItem.role} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(userItem.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(userItem)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No users found"
                      description="Try another search term or role filter."
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
        isOpen={!!selectedUser}
        title="User Details"
        description="Basic account information for this system user."
        onClose={() => setSelectedUser(null)}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Name</p>
              <p className="mt-2 font-bold text-slate-950">{selectedUser.name}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{selectedUser.email}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Role</p>
                <div className="mt-2">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-slate-500">Created</p>
                <p className="mt-2 text-sm text-slate-700">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </StaffModal>

      {/* Create User Modal */}
      <StaffModal
        isOpen={isCreateOpen}
        title="Add New User"
        description="Create a new system user with a specific role."
        onClose={closeCreateModal}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {registerUser.isError && (
            <ErrorBanner
              message={
                registerUser.error instanceof Error
                  ? registerUser.error.message
                  : 'Failed to create user. Please try again.'
              }
            />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name">
              <TextInput
                required
                placeholder="John Doe"
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <TextInput
                required
                type="email"
                placeholder="john@example.com"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <TextInput
                required
                type="password"
                placeholder="Minimum 6 characters"
                value={formValues.password}
                onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <SelectInput
                required
                value={formValues.role}
                onChange={(e) => setFormValues({ ...formValues, role: e.target.value as AdminUserRole })}
              >
                <option value="">Select role</option>
                {adminUserRoles.map((r) => (
                  <option key={r} value={r}>
                    {formatRole(r)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerUser.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {registerUser.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
};