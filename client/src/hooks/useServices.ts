import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export interface Service {
  id: string;
  name: string;
  description: string;
  durationInMinutes: number;
  basePrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBookingRequest {
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export interface PublicBookingResponse {
  id: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdAt: string;
}

const servicesService = {
  getServices: async (): Promise<Service[]> => {
    const response = await apiClient.get<ApiResponse<PaginatedData<Service>>>(
      '/services?limit=100'
    );
    return response.data.data.items;
  },

  publicBooking: async (data: PublicBookingRequest): Promise<PublicBookingResponse> => {
    const response = await apiClient.post<ApiResponse<PublicBookingResponse>>(
      '/appointments/public-booking',
      data
    );
    return response.data.data;
  },
};

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: servicesService.getServices,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const usePublicBooking = () => {
  return useMutation({
    mutationFn: (data: PublicBookingRequest) => servicesService.publicBooking(data),
  });
};
