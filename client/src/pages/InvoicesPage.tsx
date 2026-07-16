import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { useAllInvoices, usePatientInvoices, useCreateInvoice, useDeleteInvoice } from '../hooks/useBilling';
import { usePatientsQuery } from '../hooks/usePatientsManagement';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../context/AuthContext';

const PAYMENT_STYLES: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    partially_paid: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const PAYMENT_LABELS: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    partially_paid: 'Partial',
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

const getServiceNames = (items: Array<{ description: string }>) => {
    return items.map((item) => item.description).join(', ');
};

export const InvoicesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
    const [page, setPage] = useState(1);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 850);
        return () => window.clearTimeout(timeout);
    }, [search]);

    // Create invoice form state
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    // Get patients for info banner and search
    const { data: patientRecord } = usePatientsQuery({ page: 1, limit: 10 });
    const { data: allPatients } = usePatientsQuery({ page: 1, limit: 100 });
    const patient = patientRecord?.items?.find((p) => p.id === patientId);

    // Patient name lookup map
    const patientMap = useMemo(() => {
        if (!allPatients?.items) return new Map<string, string>();
        return new Map(allPatients.items.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
    }, [allPatients]);

    // Get services for invoice creation
    const { data: servicesData } = useServices();
    const availableServices = useMemo(() => (servicesData || []).filter((s) => s.isActive), [servicesData]);

    // Get invoices
    const isGlobalView = !patientId;
    const invoicesQuery = useAllInvoices(page, 10, paymentStatusFilter || undefined, debouncedSearch || undefined);
    const patientInvoicesQuery = usePatientInvoices(patientId || undefined, page, 10, paymentStatusFilter || undefined);
    const { data: invoicesData, isLoading, isError } = isGlobalView ? invoicesQuery : patientInvoicesQuery;

    // Mutations
    const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();
    const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();

    const canManage = user?.role === 'admin' || user?.role === 'staff';
    const isAdmin = user?.role === 'admin';

    // Filter patients by search
    const filteredPatients = useMemo(() => {
        if (!allPatients?.items || !patientSearch.trim()) return [];
        const searchTerm = patientSearch.toLowerCase();
        return allPatients.items.filter(
            (p) =>
                p.firstName.toLowerCase().includes(searchTerm) ||
                p.lastName.toLowerCase().includes(searchTerm) ||
                p.phone.includes(searchTerm)
        );
    }, [allPatients, patientSearch]);

    // Calculate total
    const calculatedTotal = useMemo(() => {
        return availableServices
            .filter((s) => selectedServiceIds.includes(s.id))
            .reduce((sum, s) => sum + parseFloat(s.basePrice), 0);
    }, [availableServices, selectedServiceIds]);

    const handleServiceToggle = (serviceId: string) => {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleCreateInvoice = () => {
        if (!selectedPatientId || selectedServiceIds.length === 0) return;

        const items = availableServices
            .filter((s) => selectedServiceIds.includes(s.id))
            .map((s) => ({
                serviceId: s.id,
                description: s.name,
                quantity: 1,
                unitPrice: s.basePrice,
            }));

        createInvoice(
            { patientId: selectedPatientId, items, discount: '0' },
            { onSuccess: closeCreateModal }
        );
    };

    const handleDelete = (id: string) => {
        deleteInvoice(id, { onSuccess: () => setConfirmDeleteId(null) });
    };

    const openCreateModal = () => {
        setSelectedPatientId('');
        setPatientSearch('');
        setSelectedServiceIds([]);
        setIsCreateOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateOpen(false);
        setSelectedPatientId('');
        setPatientSearch('');
        setSelectedServiceIds([]);
    };

    const invoices = invoicesData?.items || [];
    const totalPages = invoicesData?.meta.total
        ? Math.ceil(invoicesData.meta.total / 10)
        : 1;

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const paidAmount = invoices
        .filter((inv) => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const pendingAmount = invoices
        .filter((inv) => ['pending', 'partially_paid'].includes(inv.paymentStatus))
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

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
                        <h2 className="font-semibold">Error loading invoices</h2>
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
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <SectionTitle title="Invoices" subtitle="Billing and payment tracking" />
                        {patient && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Patient:</span> {patient.firstName} {patient.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{patient.email}</p>
                            </div>
                        )}
                    </div>
                    {canManage && (
                        <button
                            onClick={openCreateModal}
                            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
                        >
                            Create Invoice
                        </button>
                    )}
                </div>

                {/* Global view alert */}
                {isGlobalView && (
                    <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
                        Showing all clinic invoices. Select a specific patient record via the search bar or directory to isolate individual accounts.
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by invoice number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-teal-600">
                        <p className="text-sm font-semibold text-gray-600 uppercase">Total Invoiced</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{totalRevenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{invoices.length} invoices</p>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-emerald-600">
                        <p className="text-sm font-semibold text-gray-600 uppercase">Paid</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">{paidAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {invoices.filter((inv) => inv.paymentStatus === 'paid').length} paid
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-yellow-600">
                        <p className="text-sm font-semibold text-gray-600 uppercase">Pending</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {invoices.filter((inv) => ['pending', 'partially_paid'].includes(inv.paymentStatus)).length} unpaid
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2 flex-wrap">
                    <button onClick={() => { setPaymentStatusFilter(''); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${paymentStatusFilter === '' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>All</button>
                    <button onClick={() => { setPaymentStatusFilter('paid'); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${paymentStatusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Paid</button>
                    <button onClick={() => { setPaymentStatusFilter('partially_paid'); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${paymentStatusFilter === 'partially_paid' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Partial</button>
                    <button onClick={() => { setPaymentStatusFilter('pending'); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${paymentStatusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Pending</button>
                </div>

                {/* Invoices Table */}
                {invoices.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Invoice #</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Patient</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Treatment</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{patientMap.get(invoice.patientId) || invoice.patientId.slice(0, 8)}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{formatDate(invoice.issuedDate)}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{getServiceNames(invoice.items)}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${PAYMENT_STYLES[invoice.paymentStatus] || PAYMENT_STYLES.pending}`}>
                                                    {PAYMENT_LABELS[invoice.paymentStatus] || invoice.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(invoice.id)}
                                                            disabled={isDeleting}
                                                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                            title="Delete invoice"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${page === p ? 'bg-teal-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{p}</button>
                                ))}
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-lg bg-gray-100 p-12 text-center">
                        <p className="text-gray-700 font-medium">No invoices found</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {paymentStatusFilter || debouncedSearch ? 'Try adjusting your filters or search' : 'No invoices have been created yet'}
                        </p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!confirmDeleteId} title="Delete Invoice" onClose={() => setConfirmDeleteId(null)} size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">Are you sure you want to delete this invoice? This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
                        <button onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)} disabled={isDeleting}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Create Invoice Modal */}
            <Modal isOpen={isCreateOpen} title="Create Invoice" onClose={closeCreateModal} size="lg">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Search Patient</label>
                        <input type="text" placeholder="Search by name or phone..." value={patientSearch}
                            onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId(''); }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200" />
                        {patientSearch.trim() && filteredPatients.length > 0 && (
                            <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                                {filteredPatients.map((p) => (
                                    <button key={p.id} type="button"
                                        onClick={() => { setSelectedPatientId(p.id); setPatientSearch(`${p.firstName} ${p.lastName} - ${p.phone}`); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 transition-colors ${selectedPatientId === p.id ? 'bg-teal-50 font-semibold' : ''}`}>
                                        {p.firstName} {p.lastName} - {p.phone}
                                    </button>
                                ))}
                            </div>
                        )}
                        {patientSearch.trim() && filteredPatients.length === 0 && <p className="mt-1 text-sm text-gray-500">No patients found</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Select Services</label>
                        <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                            {availableServices.length > 0 ? availableServices.map((service) => (
                                <label key={service.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedServiceIds.includes(service.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                                    <input type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={() => handleServiceToggle(service.id)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                                    <div className="flex-1"><p className="font-medium text-gray-900">{service.name}</p><p className="text-xs text-gray-500">{service.durationInMinutes} mins</p></div>
                                    <span className="font-semibold text-teal-600">{parseFloat(service.basePrice).toFixed(2)}</span>
                                </label>
                            )) : <p className="text-gray-500 text-sm p-2">No services available</p>}
                        </div>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-teal-600">${calculatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3 border-t pt-4">
                        <button onClick={closeCreateModal} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
                        <button onClick={handleCreateInvoice} disabled={!selectedPatientId || selectedServiceIds.length === 0 || isCreatingInvoice}
                            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400">
                            {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};