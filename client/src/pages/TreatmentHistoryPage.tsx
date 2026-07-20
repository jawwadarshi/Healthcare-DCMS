import { useEffect, useState } from 'react';
import { Check, Loader2, Mic, MicOff } from 'lucide-react';
import { SectionTitle } from '../components/SectionTitle';
import { Loader } from '../components/Loader';
import { StaffModal } from '../components/staff-dashboard/StaffModal';
import { useTreatmentPatients, usePatientTreatmentHistory } from '../hooks/useTreatmentHistory';

const formatDate = (iso: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
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

interface ServiceItem {
    id: string;
    serviceName: string;
}

interface TreatmentItem {
    id: string;
    treatmentDate: string;
    notes?: string | null;
    prescription?: string | null;
    diagnosis?: string | null;
    services: ServiceItem[];
}

export const TreatmentHistoryPage = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientTreatmentSummary | null>(null);
    const [historyPage, setHistoryPage] = useState(1);

    // AI Scribe State variables
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    // Debounce search
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    // Initialize Speech Recognition API
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            rec.onerror = () => {
                setAiError('Voice capture cut out. Check mic permissions.');
                setIsRecording(false);
            };

            setRecognition(rec);
        }
    }, []);

    const { data: patientsData, isLoading, isError, refetch: refetchPatients } = useTreatmentPatients(page, 20, debouncedSearch || undefined);
    const patients: PatientTreatmentSummary[] = patientsData?.items ?? [];
    const total = patientsData?.meta.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    // Fetch full history when modal opens
    const { data: historyData, isLoading: historyLoading } = usePatientTreatmentHistory(
        selectedPatient?.patientId,
        historyPage,
        50
    );
    const historyItems: TreatmentItem[] = historyData?.items ?? [];

    const handlePatientClick = (patient: PatientTreatmentSummary) => {
        setSelectedPatient(patient);
        setHistoryPage(1);
    };

    const closeModal = () => {
        setSelectedPatient(null);
        setHistoryPage(1);
    };

    // Toggle Scribe Recording
    const handleToggleRecording = () => {
        if (!recognition) {
            setAiError('Speech recognition is not fully supported in this browser layout.');
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setAiError(null);
            setAiSuccessMessage(null);
            setTranscript('');
            recognition.start();
            setIsRecording(true);
        }
    };

    // Submit text to Gemini Backend Route
    const handleProcessScribe = async () => {
        if (!transcript.trim()) return;
        setAiLoading(true);
        setAiError(null);
        setAiSuccessMessage(null);

        try {
            const env = (window as any).process?.env || {};
            const baseUrl = env.NEXT_PUBLIC_BASE_URL || env.BASEURL || "http://localhost:5005";

            const res = await fetch(`${baseUrl}/api/v1/ai/parse-scribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText: transcript }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to file record.');
            }

            setAiSuccessMessage(`Successfully processed! Treatment history filed for patient: ${data.data?.patientName || 'Matched Patient'}`);
            setTranscript('');

            // Refresh dashboard data instantly so new lists show up right away
            refetchPatients();
        } catch (err: any) {
            setAiError(err.message || 'An unknown error occurred matching patient records.');
        } finally {
            setAiLoading(false);
        }
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
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5">
                    <div>
                        <SectionTitle title="Treatment History" subtitle="Patient treatment records" />
                    </div>
                </div>

                {/* AI Scribe Console Panel */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-2 w-2 rounded-full bg-teal-500" />
                        <h3 className="text-sm font-semibold text-gray-800">Hands-Free AI Voice Scribe</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch gap-4">
                        <div className="flex flex-col gap-2 justify-start">
                            <button
                                type="button"
                                onClick={handleToggleRecording}
                                disabled={aiLoading}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all shadow-sm whitespace-nowrap ${isRecording
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                    }`}
                            >
                                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                {isRecording ? 'Stop Transcribing' : 'Record Voice Entry'}
                            </button>

                            <button
                                type="button"
                                onClick={handleProcessScribe}
                                disabled={aiLoading || !transcript.trim() || isRecording}
                                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-medium text-sm px-5 py-3 rounded-lg transition-all whitespace-nowrap"
                            >
                                {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                File to History
                            </button>
                        </div>

                        {/* Interactive Textarea replacing the readOnly input */}
                        <div className="flex-1">
                            <textarea
                                rows={3}
                                placeholder="Click record and start speaking clinical findings, or type manually here..."
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-normal placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-y"
                            />
                        </div>
                    </div>

                    {/* Alert Notices */}
                    {aiError && (
                        <div className="mt-3 text-xs bg-red-50 text-red-700 border border-red-100 p-2.5 rounded-md">
                            ⚠️ {aiError}
                        </div>
                    )}
                    {aiSuccessMessage && (
                        <div className="mt-3 text-xs bg-green-50 text-green-800 border border-green-100 p-2.5 rounded-md font-medium">
                            ✓ {aiSuccessMessage}
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div>
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
                title={`${selectedPatient?.firstName ?? ''} ${selectedPatient?.lastName ?? ''} - Treatment History`}
                description={`${selectedPatient?.phone ?? ''} · ${selectedPatient?.totalTreatments ?? 0} total visits`}
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
                                        {treatment.services?.map((svc) => (
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