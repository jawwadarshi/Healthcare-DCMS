import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { Loader } from '../components/Loader';
import { StaffModal } from '../components/staff-dashboard/StaffModal';
import { useTreatmentPatients, usePatientTreatmentHistory } from '../hooks/useTreatmentHistory';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

interface PatientTreatmentSummary {
    patientId: string;
    firstName: string;
    lastName: string;
    phone: string;
    lastServiceName: string;
    lastTreatmentDate: string;
    lastNotes: string | null;
    totalTreatments: number;
}

export const TreatmentHistoryPage = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientTreatmentSummary | null>(null);
    const [historyPage, setHistoryPage] = useState(1);

    // Debounce search
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    const { data: patientsData, isLoading, isError } = useTreatmentPatients(page, 20, debouncedSearch || undefined);
    const patients = patientsData?.items ?? [];
    const total = patientsData?.meta.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    // Fetch full history when modal opens
    const { data: historyData, isLoading: historyLoading } = usePatientTreatmentHistory(
        selectedPatient?.patientId,
        historyPage,
        50
    );
    const historyItems = historyData?.items ?? [];

    const handlePatientClick = (patient: PatientTreatmentSummary) => {
        setSelectedPatient(patient);
        setHistoryPage(1);
    };

    const closeModal = () => {
        setSelectedPatient(null);
        setHistoryPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="rounded-lg bg-red-50 p-4 text-red-700">
                        <h2 className="font-semibold">Error loading treatment history</h2>
                        <p className="text-sm">Please try again later</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <SectionTitle title="Treatment History" subtitle="Patient treatment records" />
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by patient name or phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    />
                </div>

                {/* Patients Table */}
                {patients.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Patient Name</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Phone</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Service</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Visit</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Doctor Advice</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {patients.map((patient) => (
                                        <tr
                                            key={patient.patientId}
                                            className="transition-colors hover:bg-teal-50 cursor-pointer"
                                            onClick={() => handlePatientClick(patient)}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {patient.firstName} {patient.lastName}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{patient.phone}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{patient.lastServiceName}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{formatDate(patient.lastTreatmentDate)}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {patient.lastNotes || 'No notes'}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePatientClick(patient);
                                                    }}
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
                                                >
                                                    View History ({patient.totalTreatments})
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${page === p
                                            ? 'bg-teal-600 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-lg bg-gray-100 p-12 text-center">
                        <p className="text-gray-700 font-medium">No treatment history found</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {debouncedSearch ? 'Try adjusting your search' : 'No treatments have been completed yet'}
                        </p>
                    </div>
                )}
            </div>

            {/* Patient History Modal */}
            <StaffModal
                isOpen={!!selectedPatient}
                title={`${selectedPatient?.firstName} ${selectedPatient?.lastName} - Treatment History`}
                description={`${selectedPatient?.phone} · ${selectedPatient?.totalTreatments} total visits`}
                onClose={closeModal}
                size="xl"
            >
                {historyLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader />
                    </div>
                ) : historyItems.length > 0 ? (
                    <div className="space-y-4">
                        {historyItems.map((treatment, index) => (
                            <div
                                key={treatment.id}
                                className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                            >
                                {/* Timeline connector */}
                                {index < historyItems.length - 1 && (
                                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-teal-200" />
                                )}

                                {/* Date & Timeline dot */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-teal-600 mt-1.5 ring-2 ring-teal-100" />
                                    <div>
                                        <p className="text-sm font-semibold text-teal-700">
                                            {formatDate(treatment.treatmentDate)}
                                        </p>
                                        <p className="text-xs text-gray-500">Visit #{index + 1}</p>
                                    </div>
                                </div>

                                {/* Services */}
                                <div className="ml-6 mb-3">
                                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Services Rendered</p>
                                    <div className="flex flex-wrap gap-2">
                                        {treatment.services.map((svc) => (
                                            <span
                                                key={svc.id}
                                                className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-200"
                                            >
                                                {svc.serviceName}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Doctor Remarks */}
                                {treatment.notes && (
                                    <div className="ml-6 mb-2">
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Doctor Remarks</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap">
                                            {treatment.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Prescriptions */}
                                {treatment.prescription && (
                                    <div className="ml-6">
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Prescriptions</p>
                                        <p className="text-sm text-gray-700 bg-blue-50 rounded p-2">
                                            {treatment.prescription}
                                        </p>
                                    </div>
                                )}

                                {/* Diagnosis */}
                                {treatment.diagnosis && (
                                    <div className="ml-6 mt-2">
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Diagnosis</p>
                                        <p className="text-sm text-gray-700">{treatment.diagnosis}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No treatment records found for this patient.</p>
                    </div>
                )}
            </StaffModal>
        </div>
    );
};