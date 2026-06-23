import type { Invoice } from '../hooks/useBilling';

interface InvoiceCardProps {
    invoice: Invoice;
    onClick?: () => void;
}

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

export const InvoiceCard = ({ invoice, onClick }: InvoiceCardProps) => {
    const formattedTotal = parseFloat(invoice.total).toFixed(2);
    const formattedSubtotal = parseFloat(invoice.subtotal).toFixed(2);
    const formattedDiscount = parseFloat(invoice.discount).toFixed(2);

    return (
        <div
            onClick={onClick}
            className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-blue-300' : ''
                }`}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-500">
                        {new Date(invoice.issuedDate).toLocaleDateString()}
                    </p>
                </div>
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusColors[invoice.paymentStatus]
                        }`}
                >
                    {statusLabels[invoice.paymentStatus]}
                </span>
            </div>

            {/* Amount Info */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">${formattedSubtotal}</span>
                </div>
                {parseFloat(invoice.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-gray-900">-${formattedDiscount}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-teal-600">${formattedTotal}</span>
                </div>
            </div>

            {/* Items Count */}
            <p className="mt-3 text-xs text-gray-500">
                {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
            </p>
        </div>
    );
};
