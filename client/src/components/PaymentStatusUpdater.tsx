import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './Button';
import { useUpdatePaymentStatus } from '../hooks/useBilling';

interface PaymentStatusUpdaterProps {
    invoiceId: string;
    currentStatus: 'pending' | 'paid' | 'partially_paid';
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const updatePaymentSchema = z.object({
    paymentStatus: z.enum(['pending', 'paid', 'partially_paid']),
    paymentMethod: z.string().optional(),
    paymentDate: z.string().optional(),
    paymentNotes: z.string().optional(),
});

type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;

export const PaymentStatusUpdater = ({
    invoiceId,
    currentStatus,
    isOpen,
    onClose,
    onSuccess,
}: PaymentStatusUpdaterProps) => {
    const { mutate: updatePaymentStatus, isPending } = useUpdatePaymentStatus();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<UpdatePaymentFormData>({
        resolver: zodResolver(updatePaymentSchema),
        defaultValues: {
            paymentStatus: currentStatus,
        },
    });

    const onSubmit = (data: UpdatePaymentFormData) => {
        updatePaymentStatus(
            {
                id: invoiceId,
                paymentStatus: data.paymentStatus,
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                paymentNotes: data.paymentNotes,
            },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                    onSuccess?.();
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Update Payment Status</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isPending}
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Payment Status */}
                    <div>
                        <label htmlFor="paymentStatus" className="block text-sm font-semibold text-gray-900 mb-2">
                            Payment Status
                        </label>
                        <select
                            id="paymentStatus"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={isPending}
                            {...register('paymentStatus')}
                        >
                            <option value="pending">Pending</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="paid">Paid</option>
                        </select>
                        {errors.paymentStatus && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentStatus.message}</p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-semibold text-gray-900 mb-2">
                            Payment Method (Optional)
                        </label>
                        <input
                            id="paymentMethod"
                            type="text"
                            placeholder="e.g., Credit Card, Cash, Bank Transfer"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={isPending}
                            {...register('paymentMethod')}
                        />
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-semibold text-gray-900 mb-2">
                            Payment Date (Optional)
                        </label>
                        <input
                            id="paymentDate"
                            type="datetime-local"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={isPending}
                            {...register('paymentDate')}
                        />
                    </div>

                    {/* Payment Notes */}
                    <div>
                        <label htmlFor="paymentNotes" className="block text-sm font-semibold text-gray-900 mb-2">
                            Payment Notes (Optional)
                        </label>
                        <textarea
                            id="paymentNotes"
                            placeholder="Additional payment details..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            rows={3}
                            disabled={isPending}
                            {...register('paymentNotes')}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isPending}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isPending} className="flex-1">
                            Update Payment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
