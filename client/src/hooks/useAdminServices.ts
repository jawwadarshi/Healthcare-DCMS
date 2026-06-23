import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export interface AdminService {
  id: string;
  name: string;
  description: string;
  durationInMinutes: number;
  basePrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useAdminServicesQuery = ({
  page,
  limit,
  search,
  isActive,
}: {
  page: number;
  limit: number;
  search?: string;
  isActive?: 'true' | 'false' | '';
}) => {
  return useQuery({
    queryKey: ['admin-services', page, limit, search, isActive],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<AdminService>>>(
        '/services',
        {
          params: {
            page,
            limit,
            search: search?.trim() || undefined,
            isActive: isActive || undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        }
      );

      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; basePrice: string }) => {
      const response = await apiClient.post<ApiResponse<AdminService>>('/services', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/services/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'services'] });
    },
  });
};

export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.patch<ApiResponse<AdminService>>(`/services/${id}`, {
        isActive,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'services'] });
    },
  });
};
