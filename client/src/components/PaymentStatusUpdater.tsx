import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './Button';
import { useUpdatePaymentStatus } from '../hooks/useBilling';

interface PaymentStatusUpdaterProps {
    invoiceId: string;
    currentStatus: 'pending' | 'paid' | 'partially_paid';
    invoiceTotal: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const updatePaymentSchema = z.object({
    paymentStatus: z.enum(['pending', 'paid', 'partially_paid']),
    paymentMethod: z.string().optional(),
    paymentDate: z.string().optional(),
    paymentNotes: z.string().optional(),
    amount: z.string().optional(),
    discountPercent: z.string().optional(),
});

type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;

export const PaymentStatusUpdater = ({
    invoiceId,
    currentStatus,
    invoiceTotal,
    isOpen,
    onClose,
    onSuccess,
}: PaymentStatusUpdaterProps) => {
    const { mutate: updatePaymentStatus, isPending } = useUpdatePaymentStatus();
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);
    const totalNum = parseFloat(invoiceTotal || '0');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<UpdatePaymentFormData>({
        resolver: zodResolver(updatePaymentSchema),
        defaultValues: {
            paymentStatus: currentStatus,
            amount: totalNum > 0 ? totalNum.toFixed(2) : '',
        },
    });

    const watchedStatus = watch('paymentStatus');
    const watchedDiscount = watch('discountPercent');

    // Calculate remaining balance considering discount (watchedDiscount is a string from form)
    const discountNum = watchedDiscount ? parseFloat(watchedDiscount) : 0;
    const hasDiscount = discountNum >= 1 && discountNum <= 20;
    const effectiveTotal = hasDiscount
        ? totalNum * (1 - discountNum / 100)
        : totalNum;

    // When status changes, update the amount field
    useEffect(() => {
        setSelectedStatus(watchedStatus);
        if (watchedStatus === 'paid') {
            setValue('amount', effectiveTotal.toFixed(2));
        } else if (watchedStatus === 'partially_paid') {
            // Keep whatever the user entered, or default to remaining
            const currentAmount = watch('amount');
            if (!currentAmount || parseFloat(currentAmount) <= 0) {
                setValue('amount', effectiveTotal.toFixed(2));
            }
        }
    }, [watchedStatus, effectiveTotal, setValue, watch]);

    // Recalculate amount when discount changes
    useEffect(() => {
        if (watchedStatus === 'paid') {
            setValue('amount', effectiveTotal.toFixed(2));
        }
    }, [discountNum, effectiveTotal, watchedStatus, setValue]);

    const onSubmit = (data: UpdatePaymentFormData) => {
        const payload: any = {
            id: invoiceId,
            paymentStatus: data.paymentStatus,
            paymentMethod: data.paymentMethod || undefined,
            paymentDate: data.paymentDate || undefined,
            paymentNotes: data.paymentNotes || undefined,
        };

        // Include amount for partial/paid payments
        if (data.paymentStatus !== 'pending' && data.amount) {
            payload.amount = data.amount;
        }

        // Include discount percent if provided (convert string to number)
        const discPct = data.discountPercent ? parseFloat(data.discountPercent) : 0;
        if (discPct >= 1 && discPct <= 20) {
            payload.discountPercent = discPct;
        }

        updatePaymentStatus(payload, {
            onSuccess: () => {
                reset();
                onClose();
                onSuccess?.();
            },
        });
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
                    {/* Invoice Total Display */}
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                        <p className="text-sm text-gray-600">Invoice Total</p>
                        <p className="text-xl font-bold text-gray-900">${totalNum.toFixed(2)}</p>
                        {discountNum >= 1 && discountNum <= 20 && (
                            <p className="text-sm text-teal-600 mt-1">
                                After {watchedDiscount}% discount: <strong>${effectiveTotal.toFixed(2)}</strong>
                            </p>
                        )}
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label htmlFor="paymentStatus" className="block text-sm font-semibold text-gray-900 mb-2">
                            Payment Status
                        </label>
                        <select
                            id="paymentStatus"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={isPending}
                            {...register('paymentStatus', {
                                onChange: (e) => setSelectedStatus(e.target.value),
                            })}
                        >
                            <option value="pending">Pending</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="paid">Paid</option>
                        </select>
                        {errors.paymentStatus && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentStatus.message}</p>
                        )}
                    </div>

                    {/* Amount to Pay - shown for paid and partially_paid */}
                    {selectedStatus !== 'pending' && (
                        <div>
                            <label htmlFor="amount" className="block text-sm font-semibold text-gray-900 mb-2">
                                Amount to Pay ($)
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={effectiveTotal.toFixed(2)}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={isPending || selectedStatus === 'paid'}
                                {...register('amount')}
                            />
                            {selectedStatus === 'paid' && (
                                <p className="mt-1 text-xs text-gray-500">Amount is fixed to full balance when status is "Paid".</p>
                            )}
                            {errors.amount && (
                                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                            )}
                        </div>
                    )}

                    {/* Apply Discount (%) */}
                    <div>
                        <label htmlFor="discountPercent" className="block text-sm font-semibold text-gray-900 mb-2">
                            Apply Discount (%) <span className="text-gray-400 font-normal">(1-20%, optional)</span>
                        </label>
                        <input
                            id="discountPercent"
                            type="number"
                            min="1"
                            max="20"
                            placeholder="e.g., 10 for 10% off"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={isPending}
                            {...register('discountPercent')}
                        />
                        {errors.discountPercent && (
                            <p className="mt-1 text-sm text-red-600">{errors.discountPercent.message}</p>
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