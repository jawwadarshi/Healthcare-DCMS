// frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

interface NewAppointmentPayload {
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    timestamp: string;
}

export interface DashboardUpdatePayload {
    type: string;
    title?: string;
    message?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    appointmentId?: string;
    patientName?: string;
    patientPhone?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    status?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
}

type AppointmentListener = (data: NewAppointmentPayload) => void;
type DashboardUpdateListener = (data: DashboardUpdatePayload) => void;

export const useAppointmentSocket = (
    onNewAppointment?: AppointmentListener,
    onDashboardUpdate?: DashboardUpdateListener
) => {
    const { user, token } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const appointmentListenerRef = useRef<AppointmentListener | undefined>(onNewAppointment);
    const dashboardListenerRef = useRef<DashboardUpdateListener | undefined>(onDashboardUpdate);

    // Keep refs in sync so stale closures never fire old callbacks
    appointmentListenerRef.current = onNewAppointment;
    dashboardListenerRef.current = onDashboardUpdate;

    const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

    useEffect(() => {
        if (!isStaffOrAdmin || !token) return;

        let cleanBaseUrl = SOCKET_URL;
        try {
            const serverUrl = new URL(SOCKET_URL);
            cleanBaseUrl = serverUrl.origin;
        } catch (error) {
            console.error('[Socket] Invalid VITE_API_BASE_URL format:', error);
        }

        const socket = io(cleanBaseUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            forceNew: true,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected successfully as:', user?.email);
        });

        socket.on('connect_error', (err: any) => {
            console.error('[Socket] Connection error:', err.message);
        });

        // ✅ Appointment notifications (already working)
        socket.on('new-appointment', (data: NewAppointmentPayload) => {
            console.log('[Socket] New appointment received:', data);
            appointmentListenerRef.current?.(data);
        });

        socket.on('new_appointment', (data: NewAppointmentPayload) => {
            appointmentListenerRef.current?.(data);
        });

        // ✅ Dashboard updates — WhatsApp bookings, triage alerts, reschedules
        socket.on('dashboard-update', (data: DashboardUpdatePayload) => {
            console.log('[Socket] Dashboard update received:', data.type, data);
            dashboardListenerRef.current?.(data);
        });

        socket.on('dashboard_update', (data: DashboardUpdatePayload) => {
            dashboardListenerRef.current?.(data);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isStaffOrAdmin, token, user?.email]);

    return socketRef;
};