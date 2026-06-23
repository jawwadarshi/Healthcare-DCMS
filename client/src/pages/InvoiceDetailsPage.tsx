import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { Button } from '../components/Button';
import { PaymentStatusUpdater } from '../components/PaymentStatusUpdater';
import { useInvoiceById } from '../hooks/useBilling';
import { useTreatmentHistoryById } from '../hooks/useTreatmentHistory';
import { usePatientsQuery } from '../hooks/usePatientsManagement';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    partially_paid: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    partially_paid: 'Partially Paid',
};

export const InvoiceDetailsPage = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const [showPaymentUpdater, setShowPaymentUpdater] = useState(false);

    const { data: invoice, isLoading, isError, refetch } = useInvoiceById(invoiceId);
    const { data: treatmentHistory } = useTreatmentHistoryById(invoice?.treatmentHistoryId);

    // Fetch patient info for print layout
    const { data: patientsData } = usePatientsQuery({ page: 1, limit: 100 });
    const patientInfo = patientsData?.items?.find((p) => p.id === invoice?.patientId);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (isError || !invoice) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-4">
                        <h2 className="font-semibold">Error loading invoice</h2>
                        <p className="text-sm">Please try again later</p>
                    </div>
                    <Button onClick={() => navigate(-1)} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const formattedSubtotal = parseFloat(invoice.subtotal).toFixed(2);
    const formattedDiscount = parseFloat(invoice.discount).toFixed(2);
    const formattedTotal = parseFloat(invoice.total).toFixed(2);

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body { background: white; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .print-invoice-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; border-radius: 0 !important; }
                    .print-invoice-card .print-header-bg { background: #f0fdfa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-invoice-card .print-clinic-name { font-size: 24px; font-weight: bold; color: #0f766e; }
                    .print-invoice-card .print-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; }
                    .print-invoice-card .print-value { font-size: 14px; font-weight: 600; color: #111827; }
                    @page { margin: 15mm; }
                }
                .print-only { display: none; }
            `}</style>

            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between no-print">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                            <p className="text-gray-500 mt-1">
                                Issued: {new Date(invoice.issuedDate).toLocaleDateString()}
                            </p>
                        </div>
                        <span
                            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusColors[invoice.paymentStatus]
                                }`}
                        >
                            {statusLabels[invoice.paymentStatus]}
                        </span>
                    </div>

                    {/* Back Button */}
                    <div className="no-print">
                        <Button
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="mb-6"
                        >
                            ← Go Back
                        </Button>
                    </div>

                    {/* Invoice Card */}
                    <div className="print-invoice-card rounded-xl bg-white shadow-md overflow-hidden mb-6">
                        {/* Print-Only Clinic Header */}
                        <div className="print-only p-6 border-b border-gray-200">
                            <h1 className="print-clinic-name">Dental Clinic</h1>
                            <p className="text-sm text-gray-600 mt-1">123 Healthcare Avenue, Suite 100</p>
                            <p className="text-sm text-gray-600">Phone: (555) 123-4567 | Email: info@dentalclinic.com</p>
                            <hr className="mt-4 border-gray-300" />
                        </div>

                        {/* Invoice Header Info */}
                        <div className="print-header-bg border-b border-gray-200 p-6 bg-gradient-to-r from-teal-50 to-blue-50">
                            {/* Print patient info */}
                            {patientInfo && (
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <p className="print-label text-sm font-semibold text-gray-600 uppercase mb-1">Patient Information</p>
                                    <p className="print-value text-lg font-bold text-gray-900">{patientInfo.firstName} {patientInfo.lastName}</p>
                                    <p className="text-sm text-gray-600">{patientInfo.phone}</p>
                                    <p className="text-sm text-gray-600">{patientInfo.address}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="print-label text-sm font-semibold text-gray-600 uppercase mb-1">Invoice Number</p>
                                    <p className="print-value text-lg font-bold text-gray-900">{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="print-label text-sm font-semibold text-gray-600 uppercase mb-1">Invoice Date</p>
                                    <p className="print-value text-lg font-bold text-gray-900">
                                        {new Date(invoice.issuedDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {invoice.dueDate && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="print-label text-sm font-semibold text-gray-600 uppercase mb-1">Due Date</p>
                                    <p className="print-value text-lg font-bold text-gray-900">
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-gray-200 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Quantity</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Unit Price</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900">{item.description}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-gray-900">
                                                    ${parseFloat(item.unitPrice).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    ${parseFloat(item.subtotal).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="p-6 bg-gray-50">
                            <div className="max-w-xs ml-auto space-y-3">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">${formattedSubtotal}</span>
                                </div>
                                {parseFloat(invoice.discount) > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                        <span>Discount:</span>
                                        <span className="font-medium text-red-600">-${formattedDiscount}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                                    <span className="font-bold text-gray-900">Total:</span>
                                    <span className="font-bold text-teal-600">${formattedTotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Details Section */}
                        {treatmentHistory && (
                            <div className="p-6 border-t border-gray-200 bg-blue-50">
                                <p className="text-sm font-semibold text-blue-700 uppercase mb-3">Clinical Details</p>
                                {treatmentHistory.prescription && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Prescription</p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                                            {treatmentHistory.prescription}
                                        </p>
                                    </div>
                                )}
                                {treatmentHistory.diagnosis && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Diagnosis</p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                                            {treatmentHistory.diagnosis}
                                        </p>
                                    </div>
                                )}
                                {treatmentHistory.notes && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Notes</p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                                            {treatmentHistory.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Info */}
                        {invoice.paymentDate && (
                            <div className="p-6 border-t border-gray-200 bg-emerald-50">
                                <p className="text-sm font-semibold text-emerald-700 uppercase mb-2">Payment Information</p>
                                {invoice.paymentMethod && (
                                    <p className="text-sm text-gray-700 mb-1">
                                        <span className="font-medium">Method:</span> {invoice.paymentMethod}
                                    </p>
                                )}
                                <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">Date:</span> {new Date(invoice.paymentDate).toLocaleDateString()}
                                </p>
                                {invoice.paymentNotes && (
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Notes:</span> {invoice.paymentNotes}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowPaymentUpdater(true)}
                            className="flex-1"
                        >
                            Update Payment Status
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="flex-1"
                        >
                            Print Invoice
                        </Button>
                    </div>

                    {/* Payment Status Updater Modal */}
                    <PaymentStatusUpdater
                        invoiceId={invoice.id}
                        currentStatus={invoice.paymentStatus}
                        isOpen={showPaymentUpdater}
                        onClose={() => setShowPaymentUpdater(false)}
                        onSuccess={() => refetch()}
                    />
                </div>
            </div>
        </>
    );
};
