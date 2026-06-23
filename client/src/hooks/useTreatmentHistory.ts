import { useQuery } from '@tanstack/react-query';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

export interface TreatmentHistoryService {
    id: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    quantity: number;
}

export interface TreatmentHistory {
    id: string;
    patientId: string;
    appointmentId: string;
    doctorId: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    treatmentDate: string;
    services: TreatmentHistoryService[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CompleteTreatmentRequest {
    appointmentId: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    serviceIds: string[];
}

// Complete appointment and create treatment history
export const useCompleteTreatment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CompleteTreatmentRequest) => {
            const response = await apiClient.post('/treatment-history', payload);
            return response.data.data as TreatmentHistory;
        },
        onSuccess: (data) => {
            // Invalidate appointments list
            queryClient.invalidateQueries({ queryKey: ['appointments-management'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            // Invalidate treatment histories list
            queryClient.invalidateQueries({ queryKey: ['patient-treatment-history'] });

            // Invalidate invoices (for the patient if available)
            if (data.patientId) {
                queryClient.invalidateQueries({ queryKey: ['patient-invoices', data.patientId] });
            }
        },
    });
};

// Get treatment history by ID
export const useTreatmentHistoryById = (id: string | undefined) => {
    return useQuery({
        queryKey: ['treatment-history', id],
        queryFn: async () => {
            const response = await apiClient.get(`/treatment-history/${id}`);
            return response.data.data as TreatmentHistory;
        },
        enabled: !!id,
    });
};

// Get treatment history by appointment ID
export const useTreatmentHistoryByAppointment = (appointmentId: string | undefined) => {
    return useQuery({
        queryKey: ['treatment-history-by-appointment', appointmentId],
        queryFn: async () => {
            const response = await apiClient.get(`/treatment-history/appointment/${appointmentId}`);
            return response.data.data as TreatmentHistory;
        },
        enabled: !!appointmentId,
    });
};

// List distinct patients with treatment history
export const useTreatmentPatients = (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    return useQuery({
        queryKey: ['treatment-patients', page, limit, search],
        queryFn: async () => {
            const response = await apiClient.get('/treatment-history/patients', {
                params: { page, limit, search: search?.trim() || undefined },
            });
            return response.data.data as {
                items: Array<{
                    patientId: string;
                    firstName: string;
                    lastName: string;
                    phone: string;
                    lastServiceName: string;
                    lastTreatmentDate: string;
                    lastNotes: string | null;
                    totalTreatments: number;
                }>;
                meta: { page: number; limit: number; total: number };
            };
        },
    });
};

// List patient treatment history
export const usePatientTreatmentHistory = (
    patientId: string | undefined,
    page: number = 1,
    limit: number = 10
) => {
    return useQuery({
        queryKey: ['patient-treatment-history', patientId, page, limit],
        queryFn: async () => {
            const response = await apiClient.get(`/treatment-history/patient/${patientId}`, {
                params: { page, limit, sortBy: 'treatmentDate', sortOrder: 'desc' },
            });
            return response.data.data as {
                items: TreatmentHistory[];
                meta: { page: number; limit: number; total: number };
            };
        },
        enabled: !!patientId,
    });
};
