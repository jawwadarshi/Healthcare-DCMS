import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './Button';
import { useServices } from '../hooks/useServices';
import { useCompleteTreatment } from '../hooks/useTreatmentHistory';
import { useCreateInvoice } from '../hooks/useBilling';

interface CompleteTreatmentModalProps {
    appointmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Predefined dropdown options
const DENTAL_MEDICATIONS = [
    'Amoxicillin',
    'Ibuprofen',
    'Paracetamol',
    'Clindamycin',
    'Metronidazole',
    'Penicillin',
    'Aspirin',
    'Antibiotic Mouthwash',
];

const DENTAL_CONDITIONS = [
    'Molar 8 Corrected',
    'Premolar Decay',
    'Deep Cavity',
    'Abscess',
    'Root Canal Needed',
    'Tooth Extraction',
    'Gum Disease',
    'Sensitivity Issue',
];

const completeTreatmentSchema = z.object({
    diagnosis: z.string().optional(),
    prescription: z.string().optional(),
    notes: z.string().optional(),
});

type CompleteTreatmentFormData = z.infer<typeof completeTreatmentSchema>;

export const CompleteTreatmentModal = ({
    appointmentId,
    isOpen,
    onClose,
    onSuccess,
}: CompleteTreatmentModalProps) => {
    const { data: services } = useServices();
    const { mutate: completeTreatment, isPending } = useCompleteTreatment();
    const { mutate: createInvoice } = useCreateInvoice();

    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [includePrescription, setIncludePrescription] = useState(false);
    const [includeDiagnosis, setIncludeDiagnosis] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');

    const {
        register,
        handleSubmit,
        reset,
    } = useForm<CompleteTreatmentFormData>({
        resolver: zodResolver(completeTreatmentSchema),
    });

    const handleServiceToggle = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleClose = () => {
        reset();
        setSelectedServiceIds([]);
        setIncludePrescription(false);
        setIncludeDiagnosis(false);
        setSelectedMedication('');
        setSelectedCondition('');
        onClose();
    };

    const onSubmit = (data: CompleteTreatmentFormData) => {
        // safety check
        if (selectedServiceIds.length === 0) {
            alert("Please select at least one service");
            return;
        }

        // Build diagnosis string from selected conditions or free text
        let diagnosisVal = data.diagnosis || '';
        if (includeDiagnosis && selectedCondition) {
            diagnosisVal = selectedCondition;
        }

        // Build prescription string from selected medications or free text
        let prescriptionVal = data.prescription || '';
        if (includePrescription && selectedMedication) {
            prescriptionVal = selectedMedication;
        }

        completeTreatment(
            {
                appointmentId,
                diagnosis: diagnosisVal || undefined,
                prescription: prescriptionVal || undefined,
                notes: data.notes,
                serviceIds: selectedServiceIds,
            },
            {
                onSuccess: (treatment) => {
                    const availableServices = services?.filter((s) => s.isActive) || [];

                    // Build invoice items
                    const items = availableServices
                        .filter(service => selectedServiceIds.includes(service.id))
                        .map(service => ({
                            serviceId: service.id,
                            description: service.name,
                            quantity: 1,
                            unitPrice: service.basePrice,
                        }));

                    // CREATE INVOICE
                    createInvoice(
                        {
                            patientId: treatment.patientId,
                            treatmentHistoryId: treatment.id,
                            items,
                            discount: "0",
                        },
                        {
                            onSuccess: () => {
                                handleClose();
                                onSuccess?.();
                            },
                        }
                    );
                },
            }
        );
    };

    if (!isOpen) return null;

    const availableServices = services?.filter((s) => s.isActive) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-screen overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 mb-6 flex items-center justify-between p-6 pb-4 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Complete Treatment
                    </h2>

                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isPending}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 pt-2">

                    {/* SERVICES */}
                    <div>
                        <label className="block text-sm font-semibold mb-3">
                            Services Provided
                        </label>

                        <div className="space-y-2 max-h-48 overflow-y-auto border p-4 rounded-lg">
                            {availableServices.length > 0 ? (
                                availableServices.map((service) => (
                                    <label key={service.id} className="flex gap-3 items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedServiceIds.includes(service.id)}
                                            onChange={() => handleServiceToggle(service.id)}
                                            disabled={isPending}
                                        />

                                        <div className="flex-1">
                                            <p className="font-medium">{service.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {service.durationInMinutes} mins
                                            </p>
                                        </div>

                                        <span className="font-semibold text-teal-600">
                                            ${parseFloat(service.basePrice).toFixed(2)}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <p>No services available</p>
                            )}
                        </div>
                    </div>

                    {/* Include Prescription Checkbox */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                            <input
                                type="checkbox"
                                checked={includePrescription}
                                onChange={(e) => setIncludePrescription(e.target.checked)}
                                disabled={isPending}
                            />
                            Include Prescription
                        </label>
                        {includePrescription && (
                            <select
                                value={selectedMedication}
                                onChange={(e) => setSelectedMedication(e.target.value)}
                                disabled={isPending}
                                className="w-full border p-2 rounded mb-2"
                            >
                                <option value="">Select medication</option>
                                {DENTAL_MEDICATIONS.map((med) => (
                                    <option key={med} value={med}>{med}</option>
                                ))}
                            </select>
                        )}
                        <textarea
                            placeholder="Or enter custom prescription"
                            {...register('prescription')}
                            className="w-full border p-2 rounded"
                            rows={2}
                            disabled={isPending || includePrescription}
                        />
                    </div>

                    {/* Include Diagnosis Checkbox */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                            <input
                                type="checkbox"
                                checked={includeDiagnosis}
                                onChange={(e) => setIncludeDiagnosis(e.target.checked)}
                                disabled={isPending}
                            />
                            Include Diagnosis / Analysis
                        </label>
                        {includeDiagnosis && (
                            <select
                                value={selectedCondition}
                                onChange={(e) => setSelectedCondition(e.target.value)}
                                disabled={isPending}
                                className="w-full border p-2 rounded mb-2"
                            >
                                <option value="">Select condition</option>
                                {DENTAL_CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                            </select>
                        )}
                        <textarea
                            placeholder="Or enter custom diagnosis"
                            {...register('diagnosis')}
                            className="w-full border p-2 rounded"
                            rows={2}
                            disabled={isPending || includeDiagnosis}
                        />
                    </div>

                    {/* Notes */}
                    <textarea
                        placeholder="Notes"
                        {...register('notes')}
                        className="w-full border p-2 rounded"
                        rows={3}
                        disabled={isPending}
                    />

                    {/* Footer */}
                    <div className="flex gap-3">
                        <Button type="button" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>

                        <Button type="submit" isLoading={isPending} className="flex-1">
                            Complete Treatment
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};