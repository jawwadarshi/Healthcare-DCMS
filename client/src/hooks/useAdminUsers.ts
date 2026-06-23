import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export type AdminUserRole = 'admin' | 'doctor' | 'staff' | 'patient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  createdAt: string | null;
}

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  role: AdminUserRole;
}

export const adminUserRoles: AdminUserRole[] = ['admin', 'doctor', 'staff', 'patient'];

export const useAdminUsersQuery = ({
  page,
  limit,
  search,
  role,
}: {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole | '';
}) => {
  return useQuery({
    queryKey: ['admin-users', page, limit, search, role],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<AdminUser>>>('/users', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          role: role || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterUserRequest) => {
      const response = await apiClient.post<ApiResponse<AdminUser>>('/auth/register', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
