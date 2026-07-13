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
  const queryClient = useQueryClient(); //to manually tell React Query to forget old data or refresh its memory.
  //useMutation is a special function from React Query meant strictly for changing data on a server (Creating, Updating, or Deleting). It returns tracking variables like .isPending (is it loading?)
  //.mutateAsync (fire the request of the mutation)
  // mutationFn : It runs when you call mutateAsync in your form.
  return useMutation({
    mutationFn: async (payload: { name: string; basePrice: string; description: string }) => {
      //This is the actual network cable call! It tells your API client to make a POST request to the backend route '/services' and hand over the payload data package.
      //The <ApiResponse<AdminService>> part is just TypeScript ensuring that the network response matches your exact data structure rules.
      const response = await apiClient.post<ApiResponse<AdminService>>('/services', payload);
      return response.data.data;
    },
    onSuccess: () => { //If the backend successfully saved our new service, do the following steps immediately..."
      //This tells React Query: "Hey! The list of services we stored under the label ['admin-services'] is now old and out of date, because we just added a new one. Erase that old list from your memory and fetch a fresh one from the server right now!"
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
