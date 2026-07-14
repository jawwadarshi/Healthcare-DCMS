import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

export interface InvoiceItem {
    id: string;
    serviceId: string;
    description: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    patientId: string;
    treatmentHistoryId?: string;
    appointmentId?: string;
    subtotal: string;
    discount: string;
    total: string;
    paymentStatus: 'pending' | 'paid' | 'partially_paid';
    paymentMethod?: string;
    paymentDate?: string;
    paymentNotes?: string;
    issuedDate: string;
    dueDate?: string;
    items: InvoiceItem[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceRequest {
    patientId: string;
    treatmentHistoryId?: string;
    items: Array<{
        serviceId: string;
        description: string;
        quantity: number;
        unitPrice: string;
    }>;
    discount?: string;
    discountPercent?: number;
    dueDate?: string;
}

export interface UpdatePaymentStatusRequest {
    paymentStatus: 'pending' | 'paid' | 'partially_paid';
    paymentMethod?: string;
    paymentDate?: string;
    paymentNotes?: string;
    amount?: string;
    discountPercent?: number;
}

// Create invoice
export const useCreateInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateInvoiceRequest) => {
            const response = await apiClient.post('/billing/invoices', payload);
            return response.data.data as Invoice;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['patient-invoices', data.patientId] });
            queryClient.setQueryData(['invoice', data.id], data);
        },
    });
};

// Get invoice by ID
export const useInvoiceById = (id: string | undefined) => {
    return useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            const response = await apiClient.get(`/billing/invoices/${id}`);
            return response.data.data as Invoice;
        },
        enabled: !!id,
    });
};

// List all invoices (global) with search support
export const useAllInvoices = (
    page: number = 1,
    limit: number = 10,
    paymentStatus?: string,
    search?: string
) => {
    return useQuery({
        queryKey: ['invoices', page, limit, paymentStatus, search],
        queryFn: async () => {
            const response = await apiClient.get('/billing/invoices', {
                params: {
                    page,
                    limit,
                    paymentStatus,
                    search: search?.trim() || undefined,
                },
            });
            return response.data.data as {
                items: Invoice[];
                meta: { page: number; limit: number; total: number };
            };
        },
    });
};

// List patient invoices
export const usePatientInvoices = (
    patientId: string | undefined,
    page: number = 1,
    limit: number = 10,
    paymentStatus?: string
) => {
    return useQuery({
        queryKey: ['patient-invoices', patientId, page, limit, paymentStatus],
        queryFn: async () => {
            const response = await apiClient.get(`/billing/invoices/patient/${patientId}`, {
                params: {
                    page,
                    limit,
                    paymentStatus,
                    sortBy: 'issuedDate',
                    sortOrder: 'desc',
                },
            });
            return response.data.data as {
                items: Invoice[];
                meta: { page: number; limit: number; total: number };
            };
        },
        enabled: !!patientId,
    });
};

// Delete invoice (Admin only)
export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/billing/invoices/${id}`);
            return response.data.data as { id: string };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['patient-invoices'] });
        },
    });
};

// Update payment status
export const useUpdatePaymentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...payload }: UpdatePaymentStatusRequest & { id: string }) => {
            const response = await apiClient.patch(`/billing/invoices/${id}/payment-status`, payload);
            return response.data.data as Invoice;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['invoice', data.id], data);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['partial-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['patient-invoices', data.patientId] });
        },
    });
};