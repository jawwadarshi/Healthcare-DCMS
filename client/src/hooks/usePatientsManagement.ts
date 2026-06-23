import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PatientsQueryParams {
  page: number;
  limit: number;
  search?: string;
}

const cleanPatientPayload = (values: PatientFormValues) => ({
  ...values,
  email: values.email.trim() || undefined,
});

export const usePatientsQuery = ({ page, limit, search }: PatientsQueryParams) => {
  return useQuery({
    queryKey: ['patients-management', page, limit, search],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<Patient>>>('/patients', {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PatientFormValues) => {
      const response = await apiClient.post<ApiResponse<Patient>>(
        '/patients',
        cleanPatientPayload(values)
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PatientFormValues }) => {
      const response = await apiClient.patch<ApiResponse<Patient>>(
        `/patients/${id}`,
        cleanPatientPayload(values)
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/patients/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
