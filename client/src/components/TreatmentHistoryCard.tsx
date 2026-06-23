import { type TreatmentHistory } from '../hooks/useTreatmentHistory';
interface TreatmentHistoryCardProps {
    treatment: TreatmentHistory;
    onClick?: () => void;
}

export const TreatmentHistoryCard = ({ treatment, onClick }: TreatmentHistoryCardProps) => {
    const totalAmount = treatment.services.reduce((sum, service) => {
        return sum + parseFloat(service.servicePrice) * service.quantity;
    }, 0);

    return (
        <div
            onClick={onClick}
            className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-blue-300' : ''
                }`}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">
                        {new Date(treatment.treatmentDate).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-500">Treatment ID: {treatment.id.slice(0, 8)}...</p>
                </div>
                <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                    Completed
                </span>
            </div>

            {/* Services */}
            <div className="mb-3 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">Services</p>
                <div className="space-y-1">
                    {treatment.services.slice(0, 3).map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{service.serviceName}</span>
                            <span className="font-medium text-gray-900">
                                ${(parseFloat(service.servicePrice) * service.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                    {treatment.services.length > 3 && (
                        <p className="text-xs text-gray-500 italic">+{treatment.services.length - 3} more</p>
                    )}
                </div>
            </div>

            {/* Diagnosis */}
            {treatment.diagnosis && (
                <div className="mb-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Diagnosis / Analysis</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{treatment.diagnosis}</p>
                </div>
            )}

            {/* Prescription / Medicines */}
            {treatment.prescription && (
                <div className="mb-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Prescribed Medicines</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{treatment.prescription}</p>
                </div>
            )}

            {/* Doctor Notes */}
            {treatment.notes && (
                <div className="mb-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Doctor Notes</p>
                    <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{treatment.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-teal-600">${totalAmount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">{treatment.services.length} services</p>
                </div>
            </div>
        </div>
    );
};