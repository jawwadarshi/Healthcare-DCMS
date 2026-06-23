import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

// Track which sockets belong to admin/staff for targeted broadcasts
const staffSockets = new Set<string>();

export let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Auth middleware: verify JWT on connection
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const secret = process.env.JWT_SECRET || "default-secret";
            const decoded = jwt.verify(token as string, secret) as { userId: string; role: string; email: string };
            (socket as any).user = decoded;
            next();
        } catch {
            return next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = (socket as any).user;
        // Only track staff/admin for appointment notifications
        if (user && (user.role === "admin" || user.role === "staff")) {
            staffSockets.add(socket.id);
            console.log(`[Socket] Staff/Admin connected: ${user.email} (${user.role})`);
        }

        socket.on("disconnect", () => {
            staffSockets.delete(socket.id);
        });
    });

    return io;
}

/**
 * Emit a new-appointment event to all connected admin/staff sockets.
 */
export function emitNewAppointment(patientName: string, appointmentDate: string, appointmentTime: string): number {
    if (!io) return 0;

    const payload = {
        patientName,
        appointmentDate,
        appointmentTime: appointmentTime?.slice(0, 5) || appointmentTime,
        timestamp: new Date().toISOString(),
    };

    // Emit to both channels to prevent frontend naming mismatches
    io.emit("new-appointment", payload);
    io.emit("new_appointment", payload);

    const count = staffSockets.size;
    console.log(`[Socket] Emitted 'new-appointment' to ${count} staff/admin clients: ${patientName}`);
    return count;
}

export type DashboardUpdatePayload = {
    type: string;
    title?: string;
    message?: string;
    priority?: "low" | "normal" | "high" | "urgent";
    appointmentId?: string;
    patientName?: string;
    patientPhone?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    status?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
};

export function emitDashboardUpdate(payload: DashboardUpdatePayload): number {
    if (!io) return 0;

    const eventPayload = {
        ...payload,
        timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    // ⚡ FIX: Emitting on BOTH string variants to satisfy frontend listeners
    io.emit("dashboard-update", eventPayload);
    io.emit("dashboard_update", eventPayload);

    const count = staffSockets.size;
    console.log(`[Socket] Emitted 'dashboard-update' to ${count} staff/admin clients: ${payload.type}`);
    return count;
}