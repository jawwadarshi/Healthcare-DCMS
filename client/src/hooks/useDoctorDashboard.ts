import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export type DoctorAppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type DoctorAppointmentFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled';

export interface DoctorAppointment {
  id: string;
  patientId?: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId?: string | null;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: DoctorAppointmentStatus;
  notes?: string | null;
  createdAt: string;
}

export interface DoctorService {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
}

export interface DoctorPatient {
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
}

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
};

const isUpcoming = (appointment: DoctorAppointment) =>
  appointment.appointmentDate >= todayKey() &&
  !['completed', 'cancelled', 'no_show'].includes(appointment.status);

export const filterDoctorAppointments = (
  appointments: DoctorAppointment[],
  filter: DoctorAppointmentFilter
) => {
  switch (filter) {
    case 'today':
      return appointments.filter((appointment) => appointment.appointmentDate === todayKey());
    case 'upcoming':
      return appointments.filter(isUpcoming);
    case 'completed':
      return appointments.filter((appointment) => appointment.status === 'completed');
    case 'cancelled':
      return appointments.filter((appointment) => appointment.status === 'cancelled');
    default:
      return appointments;
  }
};

export const useDoctorAppointmentsQuery = (doctorId?: string, limit = 100) => {
  return useQuery({
    queryKey: ['doctor', 'appointments', doctorId, limit],
    enabled: !!doctorId,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<DoctorAppointment>>>(
        '/appointments',
        {
          params: {
            page: 1,
            limit,
            doctorId,
            sortBy: 'appointmentDate',
            sortOrder: 'asc',
          },
        }
      );

      return response.data.data.items;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useDoctorServicesQuery = () => {
  return useQuery({
    queryKey: ['doctor', 'services'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<DoctorService>>>(
        '/services',
        {
          params: { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' },
        }
      );

      return response.data.data.items;
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useDoctorOverview = (doctorId?: string) => {
  const appointmentsQuery = useDoctorAppointmentsQuery(doctorId);
  const servicesQuery = useDoctorServicesQuery();

  const data = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const serviceMap = new Map((servicesQuery.data ?? []).map((service) => [service.id, service]));
    const today = todayKey();

    return {
      appointments,
      serviceMap,
      recentAppointments: appointments.slice(0, 5),
      stats: {
        today: appointments.filter((appointment) => appointment.appointmentDate === today).length,
        upcoming: appointments.filter(isUpcoming).length,
        completed: appointments.filter((appointment) => appointment.status === 'completed').length,
        cancelled: appointments.filter((appointment) => appointment.status === 'cancelled').length,
      },
    };
  }, [appointmentsQuery.data, servicesQuery.data]);

  return {
    ...data,
    isLoading: appointmentsQuery.isLoading || servicesQuery.isLoading,
    isError: appointmentsQuery.isError || servicesQuery.isError,
  };
};

export const usePatientSearchQuery = (search: string) => {
  return useQuery({
    queryKey: ['doctor', 'patient-search', search],
    enabled: search.trim().length > 1,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<DoctorPatient>>>('/patients', {
        params: {
          page: 1,
          limit: 8,
          search: search.trim(),
          sortBy: 'firstName',
          sortOrder: 'asc',
        },
      });

      return response.data.data.items;
    },
  });
};

export const usePatientHistoryQuery = (doctorId?: string, patientId?: string) => {
  return useQuery({
    queryKey: ['doctor', 'patient-history', doctorId, patientId],
    enabled: !!doctorId && !!patientId,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<DoctorAppointment>>>(
        '/appointments',
        {
          params: {
            page: 1,
            limit: 100,
            doctorId,
            patientId,
            sortBy: 'appointmentDate',
            sortOrder: 'desc',
          },
        }
      );

      return response.data.data.items;
    },
  });
};
