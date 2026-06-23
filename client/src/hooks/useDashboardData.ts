import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import type { ApiResponse, PaginatedData } from '../types';

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  activeServices: number;
}

export interface RecentAppointment {
  id: string;
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
}

export interface RecentPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface PatientApiItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  createdAt: string;
}

interface AppointmentApiItem {
  id: string;
  patientName: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

interface ServiceApiItem {
  id: string;
  name: string;
  basePrice: string;
  isActive: boolean;
}

const getPaginatedData = <T>(response: ApiResponse<PaginatedData<T>>) => response.data;

const formatDate = (value: string) => {
  if (!value) return 'Not scheduled';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatTime = (value: string) => {
  if (!value) return '--';

  const [hours = '0', minutes = '0'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const fetchPatients = async (limit = 100) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<PatientApiItem>>>('/patients', {
    params: { page: 1, limit, sortBy: 'createdAt', sortOrder: 'desc' },
  });

  return getPaginatedData(response.data);
};

const fetchAppointments = async (limit = 100) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<AppointmentApiItem>>>(
    '/appointments',
    {
      params: { page: 1, limit, sortBy: 'appointmentDate', sortOrder: 'desc' },
    }
  );

  return getPaginatedData(response.data);
};

const fetchServices = async (limit = 100) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<ServiceApiItem>>>('/services', {
    params: { page: 1, limit, sortBy: 'createdAt', sortOrder: 'desc' },
  });

  return getPaginatedData(response.data);
};

export const usePatientsDashboardQuery = (limit = 100) => {
  return useQuery({
    queryKey: ['dashboard', 'patients', limit],
    queryFn: () => fetchPatients(limit),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAppointmentsDashboardQuery = (limit = 100) => {
  return useQuery({
    queryKey: ['dashboard', 'appointments', limit],
    queryFn: () => fetchAppointments(limit),
    staleTime: 1000 * 60 * 2,
  });
};

export const useServicesDashboardQuery = (limit = 100) => {
  return useQuery({
    queryKey: ['dashboard', 'services', limit],
    queryFn: () => fetchServices(limit),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdminDashboardData = () => {
  const patientsQuery = usePatientsDashboardQuery();
  const appointmentsQuery = useAppointmentsDashboardQuery();
  const servicesQuery = useServicesDashboardQuery();

  const data = useMemo(() => {
    const patients = patientsQuery.data?.items ?? [];
    const appointments = appointmentsQuery.data?.items ?? [];
    const services = servicesQuery.data?.items ?? [];
    const serviceMap = new Map(services.map((service) => [service.id, service]));

    const recentAppointments: RecentAppointment[] = appointments.slice(0, 5).map((appointment) => ({
      id: appointment.id,
      patientName: appointment.patientName,
      serviceName: serviceMap.get(appointment.serviceId)?.name ?? 'Dental service',
      date: formatDate(appointment.appointmentDate),
      time: formatTime(appointment.appointmentTime),
      status: appointment.status,
    }));

    const recentPatients: RecentPatient[] = patients.slice(0, 5).map((patient) => ({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      email: patient.email || 'No email added',
      phone: patient.phone,
      joinDate: formatDate(patient.createdAt),
      status: 'active',
    }));

    const totalRevenue = appointments.reduce((sum, appointment) => {
      if (!['completed', 'paid'].includes(appointment.status.toLowerCase())) return sum;

      const price = Number(serviceMap.get(appointment.serviceId)?.basePrice ?? 0);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    const stats: DashboardStats = {
      totalPatients: patientsQuery.data?.meta.total ?? patients.length,
      totalAppointments: appointmentsQuery.data?.meta.total ?? appointments.length,
      totalRevenue,
      activeServices: services.filter((service) => service.isActive).length,
    };

    return {
      stats,
      recentAppointments,
      recentPatients,
    };
  }, [appointmentsQuery.data, patientsQuery.data, servicesQuery.data]);

  return {
    ...data,
    isLoading: patientsQuery.isLoading || appointmentsQuery.isLoading || servicesQuery.isLoading,
    isFetching: patientsQuery.isFetching || appointmentsQuery.isFetching || servicesQuery.isFetching,
    isError: patientsQuery.isError || appointmentsQuery.isError || servicesQuery.isError,
  };
};
