import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments, services } from "../../db/schema.js";
import { emitDashboardUpdate, emitNewAppointment } from "../../socket/index.js";
import { whatsappService, type WhatsAppListRow } from "./whatsapp.service.js";
import type { AppointmentRow } from "../appointments/appointments.repository.js";

const MENU_BOOK_APPOINTMENT = "MENU_BOOK_APPOINTMENT";
const MENU_RESCHEDULE_APPOINTMENT = "MENU_RESCHEDULE_APPOINTMENT";
const MENU_DOCTOR_ASSISTANCE = "MENU_DOCTOR_ASSISTANCE";
const BOOK_SLOT_PREFIX = "BOOK_SLOT";
const RESCHEDULE_INTENT_PREFIX = "RESCHEDULE_INTENT";
const MENU_SELECT_SERVICE_PREFIX = "MENU_SELECT_SERVICE";
const SYMPTOM_SELECT_PREFIX = "SYMPTOM_SELECT";
const SENTIMENT_PREFIX = "SENTIMENT";


const LANDING_PAGE_CLICK_TEXTS = [
  "hi",
  "hello",
  "book appointment",
  "i want to book an appointment",
  "whatsapp",
  "start",
  "menu",
];

type WhatsAppInboundContext = {
  patientPhone: string;
  profileName: string;
  messageText: string;
  payloadId?: string;
};

type AvailableSlot = {
  selectedDate: string;
  selectedTime: string;
  label: string;
  serviceId: string;
  serviceName: string;
};

type OpenAIJsonResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type TriageResult = {
  urgency: "urgent" | "routine" | "informational";
  reply: string;
};

type UserSession = {
  flow: string;
  step: string;
  data?: Record<string, string>;
};

// Gemini API response shape
type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

export class WhatsAppAutomationService {
  private readonly clinicName = process.env.CLINIC_NAME ?? "Dental Clinic";
  private readonly defaultEmailDomain =
    process.env.WHATSAPP_GUEST_EMAIL_DOMAIN ?? "whatsapp.local";
  private readonly userSessions = new Map<string, UserSession>();

  private setUserState(phone: string, state: UserSession): void {
    this.userSessions.set(phone, state);
  }

  private getUserState(phone: string): UserSession | null {
    return this.userSessions.get(phone) ?? null;
  }

  private clearUserState(phone: string): void {
    this.userSessions.delete(phone);
  }

  scheduleSentimentCheck(patientPhone: string, patientName: string, appointmentId: string): void {
    const delay =
      process.env.NODE_ENV === "production"
        ? 24 * 60 * 60 * 1000
        : 5 * 60 * 1000;

    setTimeout(() => {
      void this.sendSentimentCheck(patientPhone, patientName, appointmentId).catch((error) => {
        console.error(
          `[WhatsApp Sentiment] Failed to send sentiment check for appointment ${appointmentId}:`,
          error instanceof Error ? error.message : error
        );
      });
    }, delay);
  }

  private async sendSentimentCheck(
    patientPhone: string,
    patientName: string,
    appointmentId: string
  ): Promise<void> {
    await whatsappService.sendReplyButtons(
      patientPhone,
      `Hi ${patientName}, how was your experience at ${this.clinicName} today? We'd love your feedback! 😊`,
      [
        { id: `${SENTIMENT_PREFIX}::great`, title: "😊 Great" },
        { id: `${SENTIMENT_PREFIX}::okay`, title: "😐 Okay" },
        { id: `${SENTIMENT_PREFIX}::not_good`, title: "😟 Not Good" },
      ]
    );

    this.setUserState(patientPhone, {
      flow: "SENTIMENT",
      step: "AWAITING_RESPONSE",
      data: { appointmentId },
    });
  }

  // ─── Webhook Entry Point ────────────────────────────────────────────────────

  async processWebhook(payload: unknown): Promise<void> {
    const messages = this.extractInboundMessages(payload);

    for (const message of messages) {
      try {
        await this.routeInboundMessage(message);
      } catch (error) {
        console.error(
          `[WhatsApp Automation] Failed to process message from ${message.patientPhone}:`,
          error instanceof Error ? error.message : error
        );
        await whatsappService.sendTextMessage(
          message.patientPhone,
          "Thanks for your message. Our clinic team will review it and respond shortly."
        );
      }
    }
  }

  // ─── Router ─────────────────────────────────────────────────────────────────

  private async routeInboundMessage(context: WhatsAppInboundContext): Promise<void> {
    const normalizedText = context.messageText.trim().toLowerCase();
    const action = context.payloadId ?? context.messageText.trim();

    // ✅ 0. Check pending session state first (free-text follow-ups)
    const sessionState = this.getUserState(context.patientPhone);

    if (sessionState?.flow === "RESCHEDULE" && sessionState?.step === "AWAITING_DATE") {
      this.clearUserState(context.patientPhone);
      await this.handleRescheduleRequest(context, context.messageText);
      return;
    }

    if (sessionState?.flow === "TRIAGE" && sessionState?.step === "AWAITING_SYMPTOMS") {
      this.clearUserState(context.patientPhone);
      await this.handleSymptomTriage(context, context.messageText);
      return;
    }

    if (sessionState?.flow === "TRIAGE" && sessionState?.step === "AWAITING_DETAIL") {
      this.clearUserState(context.patientPhone);
      const baseSymptom = sessionState.data?.baseSymptom ?? context.messageText;
      const combined = `${baseSymptom}. Additional detail: ${context.messageText}`;
      await this.handleSymptomTriage(context, combined);
      return;
    }

    // ✅ 1. User taps "Book Appointment" from main menu
    if (sessionState?.flow === "SENTIMENT" && sessionState?.step === "AWAITING_RESPONSE") {
      await this.handleSentimentResponse(context, action);
      return;
    }

    if (action === MENU_BOOK_APPOINTMENT) {
      await this.sendBookingSlots(context);
      return;
    }

    // ✅ 2. User picks a service from the service list
    if (action.startsWith(`${MENU_SELECT_SERVICE_PREFIX}::`)) {
      await this.handleServiceSelection(context, action);
      return;
    }

    // ✅ 3. User picks a time slot
    if (action.startsWith(`${BOOK_SLOT_PREFIX}::`)) {
      await this.confirmBookingSlot(context, action);
      return;
    }

    // ✅ 4. User taps "Reschedule Appointment"
    if (action === MENU_RESCHEDULE_APPOINTMENT) {
      await this.sendReschedulePrompt(context);
      return;
    }

    // ✅ 5. User picks a reschedule day
    if (action.startsWith(`${RESCHEDULE_INTENT_PREFIX}::`)) {
      const parts = action.split("::");
      const dateStr = parts[1];
      const period = parts[2]; // "morning" or "evening"

      let requestText = context.messageText;
      if (dateStr && period) {
        const date = new Date(`${dateStr}T00:00:00`);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const shortDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        requestText = `Move to ${dayName} ${period} on ${shortDate}`;
      }

      await this.handleRescheduleRequest(context, requestText);
      return;
    }
    // ✅ 5b. User picks a symptom from the symptom list
    if (action.startsWith(`${SYMPTOM_SELECT_PREFIX}::`)) {
      const symptom = action.split("::")[1] ?? context.messageText;
      await this.handleSymptomSelected(context, symptom);
      return;
    }
    // ✅ 6. User taps "Doctor Assistance"
    if (action.startsWith(`${SENTIMENT_PREFIX}::`)) {
      await this.handleSentimentResponse(context, action);
      return;
    }

    if (action === MENU_DOCTOR_ASSISTANCE) {
      await this.handleDoctorAssistance(context);
      return;
    }

    // ✅ 7. Plain text greetings
    if (this.isLandingPageGreeting(normalizedText)) {
      await this.sendMainMenu(context.patientPhone, context.profileName);
      return;
    }

    // ✅ 8. Plain text reschedule request
    if (this.looksLikeRescheduleRequest(normalizedText)) {
      await this.handleRescheduleRequest(context, context.messageText);
      return;
    }

    // ✅ 9. Fallback
    // ✅ 9. AI Receptionist handles anything unrecognised
    await this.handleAIReceptionist(context);
    //await this.sendMainMenu(context.patientPhone, context.profileName);
  }

  // ─── Main Menu ───────────────────────────────────────────────────────────────

  private async sendMainMenu(patientPhone: string, profileName: string): Promise<void> {
    const greetingName = profileName || "there";

    await whatsappService.sendListMessage(
      patientPhone,
      `Hi ${greetingName}, welcome to ${this.clinicName}. How can we help today?`,
      "Choose",
      "Clinic menu",
      [
        { id: MENU_BOOK_APPOINTMENT, title: "Book Appointment" },
        { id: MENU_RESCHEDULE_APPOINTMENT, title: "Reschedule Appointment" },
        { id: MENU_DOCTOR_ASSISTANCE, title: "Doctor Assistance" },
      ],
      "Automated clinic assistant"
    );
  }

  // ─── Booking ─────────────────────────────────────────────────────────────────

  private async sendBookingSlots(context: WhatsAppInboundContext): Promise<void> {
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.createdAt));

    console.log("[DEBUG BOOKING] active services found:", allServices.length);

    if (!allServices.length) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "No services are currently available. Our staff will contact you shortly."
      );
      return;
    }

    if (allServices.length === 1) {
      console.log("[DEBUG BOOKING] only one service, skipping selection");
      await this.sendSlotsForService(context, allServices[0]!.id);
      return;
    }

    const rows: WhatsAppListRow[] = allServices.map((service) => ({
      id: `${MENU_SELECT_SERVICE_PREFIX}::${service.id}`,
      title: service.name.slice(0, 24),
      description: service.description ? service.description.slice(0, 72) : undefined,
    }));

    await whatsappService.sendListMessage(
      context.patientPhone,
      "Please select the service you need:",
      "View Services",
      "Available Services",
      rows,
      this.clinicName
    );
  }

  private async handleServiceSelection(
    context: WhatsAppInboundContext,
    action: string
  ): Promise<void> {
    const serviceId = action.split("::")[1];
    console.log("[DEBUG BOOKING] service selected:", serviceId);

    if (!serviceId) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "Could not read that selection. Please try again."
      );
      return;
    }

    await this.sendSlotsForService(context, serviceId);
  }

  private async sendSlotsForService(
    context: WhatsAppInboundContext,
    serviceId: string
  ): Promise<void> {
    const slots = await this.getNextOpenSlots(5, serviceId);
    console.log("[DEBUG BOOKING] slots found for service:", slots.length);

    if (!slots.length) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "No open slots are available right now. Our staff will contact you shortly."
      );
      emitDashboardUpdate({
        type: "whatsapp_no_booking_slots",
        priority: "high",
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: "WhatsApp patient requested booking but no slots were available.",
      });
      return;
    }

    const rows: WhatsAppListRow[] = slots.map((slot) => ({
      id: `${BOOK_SLOT_PREFIX}::${slot.selectedDate}::${slot.selectedTime}::${slot.serviceId}`,
      title: slot.label,
      description: `${slot.serviceName} at ${this.formatTimeForPatient(slot.selectedTime)}`,
    }));

    await whatsappService.sendListMessage(
      context.patientPhone,
      "Please choose an available appointment slot:",
      "View Slots",
      "Open Slots",
      rows,
      this.clinicName
    );
  }

  private async confirmBookingSlot(
    context: WhatsAppInboundContext,
    action: string
  ): Promise<void> {
    const [, selectedDate, selectedTime, serviceId] = action.split("::");

    if (!selectedDate || !selectedTime || !serviceId) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "That slot could not be read. Please open the menu and try again."
      );
      return;
    }

    const service = await this.getServiceById(serviceId);

    if (!service) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "That service is no longer available. Please open the menu and try again."
      );
      return;
    }

    if (!(await this.isSlotOpen(selectedDate, selectedTime))) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "That slot was just taken. Please choose another available slot."
      );
      await this.sendBookingSlots(context);
      return;
    }

    const patientName = context.profileName || "WhatsApp Patient";
    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: null,
        doctorId: null,
        serviceId,
        patientName,
        patientPhone: context.patientPhone,
        patientEmail: this.buildGuestEmail(context.patientPhone),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        status: "pending",
        notes: "Booked through WhatsApp automated assistant.",
        createdBy: null,
      })
      .returning();

    if (!appointment) {
      throw new Error("Appointment insert did not return a row.");
    }

    await whatsappService.sendTextMessage(
      context.patientPhone,
      [
        `Thanks ${patientName}. Your appointment request has been received.`,
        `Service: ${service.name}`,
        `Date: ${selectedDate}`,
        `Time: ${this.formatTimeForPatient(selectedTime)}`,
        "Status: pending",
      ].join("\n")
    );

    emitNewAppointment(patientName, selectedDate, selectedTime);
    emitDashboardUpdate({
      type: "whatsapp_booking_created",
      priority: "normal",
      appointmentId: appointment.id,
      patientName,
      patientPhone: context.patientPhone,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      status: "pending",
      message: "New WhatsApp appointment request created.",
      metadata: { serviceId, serviceName: service.name },
    });
  }

  // ─── Reschedule ──────────────────────────────────────────────────────────────

  private async sendReschedulePrompt(context: WhatsAppInboundContext): Promise<void> {
    const rows: WhatsAppListRow[] = [];
    const now = new Date();

    for (let offset = 1; offset <= 7; offset++) {
      const date = new Date(now);
      date.setDate(now.getDate() + offset);

      const dateStr = this.toDateString(date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      const shortDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      rows.push({
        id: `${RESCHEDULE_INTENT_PREFIX}::${dateStr}::morning`,
        title: `${dayName.slice(0, 3)} ${shortDate} AM`,
        description: `Morning slot on ${dayName}, ${shortDate}`,
      });

      rows.push({
        id: `${RESCHEDULE_INTENT_PREFIX}::${dateStr}::evening`,
        title: `${dayName.slice(0, 3)} ${shortDate} PM`,
        description: `Afternoon slot on ${dayName}, ${shortDate}`,
      });
    }

    await whatsappService.sendListMessage(
      context.patientPhone,
      "When would you like to reschedule? Choose a preferred day and time:",
      "View Options",
      "Available Days",
      rows,
      "Reschedule request"
    );
  }

  private async handleRescheduleRequest(
    context: WhatsAppInboundContext,
    requestText: string
  ): Promise<void> {
    const currentAppointment = await this.findActiveAppointmentByPhone(context.patientPhone);

    if (!currentAppointment) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "We could not find an active appointment for this WhatsApp number. Our staff will review your request shortly."
      );
      emitDashboardUpdate({
        type: "whatsapp_reschedule_lookup_failed",
        priority: "high",
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message:
          "WhatsApp reschedule requested, but no active appointment was found for the phone number.",
        metadata: { requestText },
      });
      return;
    }

    this.clearUserState(context.patientPhone);
    const availableSlots = await this.getNextOpenSlots(10, currentAppointment.serviceId);
    const selectedSlot = await this.resolveRescheduleSlot(requestText, availableSlots);

    if (!selectedSlot) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "We could not confidently match that request to an open slot. Please reply with a specific day and time, or choose staff help."
      );
      this.setUserState(context.patientPhone, { flow: "RESCHEDULE", step: "AWAITING_DATE" });
      return;
    }

    const previousNotes = currentAppointment.notes ? `${currentAppointment.notes}\n\n` : "";
    const rescheduleNote = [
      `${previousNotes}WhatsApp reschedule requested.`,
      `Patient request: ${requestText}`,
      `Previous slot: ${currentAppointment.appointmentDate} ${currentAppointment.appointmentTime}`,
      `Requested slot: ${selectedSlot.selectedDate} ${selectedSlot.selectedTime}`,
      `Requested at: ${new Date().toISOString()}`,
    ].join("\n");

    const [updated] = await db.transaction(async (tx) => {
      return tx
        .update(appointments)
        .set({
          appointmentDate: selectedSlot.selectedDate,
          appointmentTime: selectedSlot.selectedTime,
          status: "Reschedule_Requested",
          notes: rescheduleNote,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, currentAppointment.id))
        .returning();
    });

    if (!updated) {
      throw new Error("Appointment reschedule update did not return a row.");
    }

    await whatsappService.sendTextMessage(
      context.patientPhone,
      [
        "Your reschedule request has been sent to the clinic team.",
        `Requested date: ${selectedSlot.selectedDate}`,
        `Requested time: ${this.formatTimeForPatient(selectedSlot.selectedTime)}`,
        "Status: Reschedule_Requested",
      ].join("\n")
    );

    emitDashboardUpdate({
      type: "whatsapp_reschedule_requested",
      priority: "high",
      appointmentId: updated.id,
      patientName: updated.patientName,
      patientPhone: updated.patientPhone,
      appointmentDate: selectedSlot.selectedDate,
      appointmentTime: selectedSlot.selectedTime,
      status: "Reschedule_Requested",
      message: "WhatsApp patient requested an appointment reschedule.",
      metadata: {
        requestText,
        previousDate: currentAppointment.appointmentDate,
        previousTime: currentAppointment.appointmentTime,
      },
    });
  }

  // ─── Doctor Assistance + Symptom ThandleDoctorAssistanceriage ─────────────────────────────────────

  private async handleSentimentResponse(
    context: WhatsAppInboundContext,
    action: string
  ): Promise<void> {
    const sessionState = this.getUserState(context.patientPhone);
    const appointmentId = sessionState?.data?.appointmentId;
    const sentiment = action.startsWith(`${SENTIMENT_PREFIX}::`)
      ? action.split("::")[1]
      : context.messageText.trim().toLowerCase();

    if (!appointmentId) {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "Thank you for your feedback. Our team has received your response."
      );
      this.clearUserState(context.patientPhone);
      return;
    }

    if (sentiment === "great") {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "Thank you for your feedback! 😊 We're glad you had a great experience. See you next time!"
      );

      emitDashboardUpdate({
        type: "whatsapp_sentiment_positive",
        priority: "low",
        appointmentId,
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: `${context.profileName} had a great experience.`,
        metadata: { sentiment },
      });
    } else if (sentiment === "okay") {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "Thank you for your feedback! We'll keep working to improve your experience. See you next time!"
      );

      emitDashboardUpdate({
        type: "whatsapp_sentiment_okay",
        priority: "normal",
        appointmentId,
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: `${context.profileName} rated their experience as okay.`,
        metadata: { sentiment },
      });
    } else if (sentiment === "not_good") {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "We're sorry to hear that 😟. Our clinic manager will personally reach out to you shortly to understand how we can do better."
      );

      emitDashboardUpdate({
        type: "whatsapp_sentiment_negative",
        priority: "urgent",
        appointmentId,
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: `NEGATIVE REVIEW RISK: ${context.profileName} had a bad experience. Call immediately.`,
        metadata: { sentiment },
      });
    } else {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        "Please select one of the feedback buttons so we can record your experience."
      );
      return;
    }

    await this.appendAppointmentSentimentNote(appointmentId, sentiment);
    this.clearUserState(context.patientPhone);
  }
  private async handleAIReceptionist(context: WhatsAppInboundContext): Promise<void> {
    console.log("[Receptionist] WhatsApp query:", context.messageText);
    const reply = await this.callGeminiReceptionist(
      context.messageText,
      context.patientPhone
    );

    const showMenu = reply.includes("SHOW_MENU");
    const cleanReply = reply.replace("SHOW_MENU", "").trim();

    await whatsappService.sendTextMessage(context.patientPhone, cleanReply);

    if (showMenu) {
      await this.sendMainMenu(context.patientPhone, context.profileName);
    }
  }

  async handleWebsiteReceptionist(message: string, sessionId: string): Promise<string> {
    console.log("[Receptionist] Website query:", message, "session:", sessionId);
    const reply = await this.callGeminiReceptionist(message, sessionId);
    return reply.replace("SHOW_MENU", "").trim();
  }

  private async callGeminiReceptionist(
    message: string,
    phoneOrSessionId: string
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[Receptionist] GEMINI_API_KEY not set, using fallback");
      return (
        `Thank you for contacting ${this.clinicName}. ` +
        `Please call us or use our booking system for assistance. SHOW_MENU`
      );
    }

    // Fetch live data from DB
    const [activeServices, nextAppointment] = await Promise.all([
      db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.createdAt)),
      this.findActiveAppointmentByPhone(phoneOrSessionId).catch(() => null),
    ]);

    const servicesList = activeServices.length
      ? activeServices
        .map((s) => `- ${s.name}${s.price ? `: PKR ${s.price}` : ""}`)
        .join("\n")
      : "Please contact the clinic for service details.";

    const appointmentInfo = nextAppointment
      ? `Date: ${nextAppointment.appointmentDate}, ` +
      `Time: ${nextAppointment.appointmentTime}, ` +
      `Status: ${nextAppointment.status}`
      : "No upcoming appointment found for this patient.";

    const systemPrompt = `You are a friendly AI receptionist for ${this.clinicName} dental clinic.

CLINIC INFORMATION:
- Name: ${this.clinicName}
- Phone: ${process.env.CLINIC_PHONE ?? "Please call the clinic"}
- Hours: ${process.env.CLINIC_HOURS ?? "Monday to Saturday, 9 AM to 6 PM"}
- Address: ${process.env.CLINIC_ADDRESS ?? "Please contact the clinic for address"}

SERVICES AND PRICES (live from database):
${servicesList}

PATIENT NEXT APPOINTMENT (live from database):
${appointmentInfo}

YOUR RULES:
1. Answer questions about clinic timings, services, prices, location, and appointments
2. Be warm, professional, and concise (2-4 sentences for WhatsApp, up to 6 for website)
3. If asked about something outside your knowledge, say you will connect them with staff
4. If the patient wants to book, reschedule, cancel, or needs medical advice,
   end your reply with exactly this token on a new line: SHOW_MENU
5. Never make up prices or appointment details — only use what is provided above
6. Reply in the same language the patient writes in (Urdu or English)
7. Do not include SHOW_MENU in your reply text — only append it as a signal token`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      });

      const data = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        console.error("[Receptionist] Gemini API error:", response.status, data.error?.message);
        return (
          `Thank you for contacting ${this.clinicName}. ` +
          `Our team will be in touch shortly. SHOW_MENU`
        );
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("[DEBUG Receptionist] raw Gemini response:", rawText);

      const cleaned = rawText.replace(/```json|```/g, "").trim();
      return cleaned || `Thank you for contacting ${this.clinicName}. SHOW_MENU`;

    } catch (error) {
      console.error("[Receptionist] Failed to call Gemini:", error);
      return (
        `Thank you for contacting ${this.clinicName}. ` +
        `Our team will be in touch shortly. SHOW_MENU`
      );
    }
  }


  private async appendAppointmentSentimentNote(
    appointmentId: string,
    sentiment: string
  ): Promise<void> {
    const currentAppointment = await db
      .select({ notes: appointments.notes })
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    const previousNotes = currentAppointment[0]?.notes
      ? `${currentAppointment[0].notes}\n\n`
      : "";
    const sentimentNote = [
      `${previousNotes}WhatsApp sentiment feedback received.`,
      `Sentiment: ${sentiment}`,
      `Received at: ${new Date().toISOString()}`,
    ].join("\n");

    await db
      .update(appointments)
      .set({ notes: sentimentNote, updatedAt: new Date() })
      .where(eq(appointments.id, appointmentId));
  }

  private async handleDoctorAssistance(context: WhatsAppInboundContext): Promise<void> {
    await whatsappService.sendListMessage(
      context.patientPhone,
      "Please select your main symptom so we can help you better:",
      "Select Symptom",
      "Common Symptoms",
      [
        { id: `${SYMPTOM_SELECT_PREFIX}::Tooth pain`, title: "Tooth Pain", description: "Aching or sharp pain in a tooth" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Swelling in gums or face`, title: "Swelling", description: "Swelling in gums, cheek, or face" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Bleeding gums`, title: "Bleeding Gums", description: "Gums bleed when eating or brushing" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Pain when eating`, title: "Pain When Eating", description: "Pain or sensitivity while eating" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Cannot eat or open mouth`, title: "Cannot Eat / Open Mouth", description: "Difficulty eating or opening jaw" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Broken or chipped tooth`, title: "Broken Tooth", description: "Tooth is cracked, chipped, or broken" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Tooth sensitivity to hot or cold`, title: "Sensitivity", description: "Pain with hot, cold, or sweet foods" },
        { id: `${SYMPTOM_SELECT_PREFIX}::Other concern`, title: "Other / General Question", description: "Something else or a general question" },
      ],
      this.clinicName
    );
  }
  private async handleSymptomSelected(
    context: WhatsAppInboundContext,
    symptom: string
  ): Promise<void> {
    console.log("[DEBUG TRIAGE] symptom selected:", symptom);

    // Ask one follow-up question to get more detail before calling AI
    await whatsappService.sendTextMessage(
      context.patientPhone,
      `You selected: *${symptom}*\n\nPlease tell us a bit more — for example, how long have you had this, how severe is it, or anything else relevant. Reply with a short message.`
    );

    this.setUserState(context.patientPhone, {
      flow: "TRIAGE",
      step: "AWAITING_DETAIL",
      data: { baseSymptom: symptom },
    });
  }

  private async handleSymptomTriage(
    context: WhatsAppInboundContext,
    symptoms: string
  ): Promise<void> {
    console.log("[DEBUG TRIAGE] symptoms received:", symptoms);

    const triageResult = await this.callGeminiForTriage(symptoms);

    console.log("[DEBUG TRIAGE] result:", triageResult);

    if (triageResult.urgency === "urgent") {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        `${triageResult.reply}\n\nOur staff has been alerted and will contact you shortly. If this is an emergency, please call the clinic directly.`
      );

      emitDashboardUpdate({
        type: "whatsapp_doctor_assistance_requested",
        priority: "urgent",
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: `URGENT triage — ${context.profileName}: ${symptoms}`,
        metadata: { triageReply: triageResult.reply, symptoms, urgency: "urgent" },
      });
      return;
    }

    if (triageResult.urgency === "routine") {
      await whatsappService.sendTextMessage(
        context.patientPhone,
        `${triageResult.reply}\n\nWould you like to book an appointment?`
      );

      await whatsappService.sendListMessage(
        context.patientPhone,
        "Here's what you can do next:",
        "Choose",
        "Next Steps",
        [
          { id: MENU_BOOK_APPOINTMENT, title: "Book Appointment" },
          { id: MENU_DOCTOR_ASSISTANCE, title: "Ask Another Question" },
        ],
        this.clinicName
      );

      emitDashboardUpdate({
        type: "whatsapp_doctor_assistance_requested",
        priority: "high",
        patientName: context.profileName,
        patientPhone: context.patientPhone,
        message: `Routine triage — ${context.profileName}: ${symptoms}`,
        metadata: { triageReply: triageResult.reply, symptoms, urgency: "routine" },
      });
      return;
    }

    // informational
    await whatsappService.sendTextMessage(
      context.patientPhone,
      `${triageResult.reply}\n\nIs there anything else we can help you with?`
    );

    await whatsappService.sendListMessage(
      context.patientPhone,
      "Here's what you can do next:",
      "Choose",
      "Next Steps",
      [
        { id: MENU_BOOK_APPOINTMENT, title: "Book Appointment" },
        { id: MENU_DOCTOR_ASSISTANCE, title: "Ask Another Question" },
        { id: MENU_RESCHEDULE_APPOINTMENT, title: "Reschedule Appointment" },
      ],
      this.clinicName
    );
  }

  // ─── Gemini Triage ───────────────────────────────────────────────────────────

  private async callGeminiForTriage(symptoms: string): Promise<TriageResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[TRIAGE] GEMINI_API_KEY not set, using fallback");
      return {
        urgency: "routine",
        reply:
          "Thank you for describing your concern. A clinic staff member will review this and advise you shortly.",
      };
    }

    const systemPrompt = `You are an experienced dental clinic assistant with strong knowledge of dentistry. A patient has described their symptoms via WhatsApp.

Your job:
1. Assess urgency: "urgent", "routine", or "informational"
2. Write a helpful, specific reply (3-5 sentences) that:
   - Acknowledges their symptom with empathy
   - Gives practical home-care advice relevant to their specific symptom (e.g. which painkiller to take, how to rinse, what to avoid eating, how to brush near the affected area)
   - Tells them what the clinic will do when they come in
   - Keeps language simple and friendly for WhatsApp

Urgency rules:
- urgent: severe pain, spreading swelling to face or neck, abscess with fever, broken tooth with heavy bleeding, cannot open mouth, dental trauma from injury
- routine: mild to moderate tooth pain, sensitivity, cavity concerns, gum bleeding, loose filling, cosmetic issues, cannot eat comfortably
- informational: pricing questions, procedure questions, general dental advice, no current pain

Home care examples by symptom:
- Tooth pain: rinse with warm salt water, take ibuprofen or paracetamol, avoid very hot or cold food
- Swelling: do NOT apply heat, use a cold compress outside the cheek, take ibuprofen, come in urgently if spreading
- Bleeding gums: rinse with salt water, use a soft-bristle brush, avoid hard foods, floss gently
- Sensitivity: use sensitive toothpaste, avoid extreme temperatures, do not press on the tooth
- Broken tooth: rinse mouth gently, cover sharp edge with dental wax if available, avoid chewing on that side
- Cannot eat or open mouth: this is urgent, come in immediately or go to emergency

Respond ONLY with valid JSON, no markdown, no extra text, no code blocks:
{"urgency":"routine","reply":"your reply here"}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: symptoms }],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
          },
        }),
      });

      const data = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        console.error("[TRIAGE] Gemini API error:", response.status, data.error?.message);
        return this.triageFallback();
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log("[DEBUG TRIAGE] raw Gemini response:", rawText);

      // Strip markdown code fences if Gemini wraps the JSON anyway
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { urgency: string; reply: string };

      if (
        ["urgent", "routine", "informational"].includes(parsed.urgency) &&
        typeof parsed.reply === "string"
      ) {
        return {
          urgency: parsed.urgency as TriageResult["urgency"],
          reply: parsed.reply,
        };
      }

      throw new Error("Invalid triage response shape from Gemini");
    } catch (error) {
      console.error("[TRIAGE] Failed to call or parse Gemini response:", error);
      return this.triageFallback();
    }
  }

  private triageFallback(): TriageResult {
    return {
      urgency: "routine",
      reply:
        "Thank you for reaching out. Our team will review your concern and get back to you shortly.",
    };
  }

  // ─── Slot Resolution ─────────────────────────────────────────────────────────

  private async getNextOpenSlots(limit: number, serviceId?: string): Promise<AvailableSlot[]> {
    const service = serviceId
      ? await this.getServiceById(serviceId)
      : await this.getDefaultService();

    console.log("[DEBUG SLOTS] serviceId requested:", serviceId ?? "none (using default)");
    console.log(
      "[DEBUG SLOTS] service found:",
      service
        ? `${service.name} (${service.id})`
        : "NULL ❌ — check WHATSAPP_DEFAULT_SERVICE_ID in .env"
    );

    if (!service) {
      return [];
    }

    const candidateDates = this.getCandidateDates(14);
    const slotTimes = this.getConfiguredSlotTimes();

    console.log("[DEBUG SLOTS] candidateDates:", candidateDates);
    console.log("[DEBUG SLOTS] slotTimes:", slotTimes);

    if (!slotTimes.length) {
      console.warn(
        "[DEBUG SLOTS] slotTimes is EMPTY ❌ — check WHATSAPP_BOOKING_SLOT_TIMES in .env"
      );
      return [];
    }

    const bookedRows = await db
      .select({
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.appointmentDate, candidateDates),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "no_show")
        )
      );

    const bookedKeys = new Set(
      bookedRows.map(
        (row) => `${row.appointmentDate}::${this.normalizeTime(row.appointmentTime)}`
      )
    );

    console.log("[DEBUG SLOTS] already booked keys:", [...bookedKeys]);

    const now = new Date();
    console.log("[DEBUG SLOTS] current time (server):", now.toISOString());

    const slots: AvailableSlot[] = [];

    for (const selectedDate of candidateDates) {
      for (const selectedTime of slotTimes) {
        const slotDate = new Date(`${selectedDate}T${selectedTime}`);

        if (slotDate <= now) {
          console.log(`[DEBUG SLOTS] SKIPPED (past): ${selectedDate} ${selectedTime}`);
          continue;
        }

        if (bookedKeys.has(`${selectedDate}::${selectedTime}`)) {
          console.log(`[DEBUG SLOTS] SKIPPED (booked): ${selectedDate} ${selectedTime}`);
          continue;
        }

        console.log(`[DEBUG SLOTS] AVAILABLE ✅: ${selectedDate} ${selectedTime}`);

        slots.push({
          selectedDate,
          selectedTime,
          label: this.formatSlotLabel(selectedDate, selectedTime),
          serviceId: service.id,
          serviceName: service.name,
        });

        if (slots.length >= limit) {
          return slots;
        }
      }
    }

    console.log("[DEBUG SLOTS] total slots found:", slots.length);
    return slots;
  }

  private async resolveRescheduleSlot(
    requestText: string,
    availableSlots: AvailableSlot[]
  ): Promise<AvailableSlot | null> {
    if (!availableSlots.length) {
      return null;
    }

    const llmSelection = await this.resolveSlotWithOpenAI(requestText, availableSlots);

    if (llmSelection) {
      const matched = availableSlots.find(
        (slot) =>
          slot.selectedDate === llmSelection.selectedDate &&
          slot.selectedTime === this.normalizeTime(llmSelection.selectedTime)
      );

      if (matched) {
        return matched;
      }
    }

    return this.resolveSlotHeuristically(requestText, availableSlots);
  }

  private async resolveSlotWithOpenAI(
    requestText: string,
    availableSlots: AvailableSlot[]
  ): Promise<{ selectedDate: string; selectedTime: string } | null> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return null;
    }

    const model = process.env.OPENAI_RESCHEDULE_MODEL ?? "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You map dental appointment reschedule requests to one available slot. Return only JSON with selectedDate and selectedTime. If no slot matches, return selectedDate and selectedTime as empty strings.",
          },
          {
            role: "user",
            content: JSON.stringify({
              patientRequest: requestText,
              availableSlots: availableSlots.map((slot) => ({
                selectedDate: slot.selectedDate,
                selectedTime: slot.selectedTime,
                label: slot.label,
              })),
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[WhatsApp Automation] OpenAI slot resolution failed: ${response.status} ${errorText}`
      );
      return null;
    }

    const data = (await response.json()) as OpenAIJsonResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    try {
      const parsed = JSON.parse(content) as Partial<{
        selectedDate: string;
        selectedTime: string;
      }>;

      if (this.isDateString(parsed.selectedDate) && this.isTimeString(parsed.selectedTime)) {
        return {
          selectedDate: parsed.selectedDate,
          selectedTime: this.normalizeTime(parsed.selectedTime),
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  private resolveSlotHeuristically(
    requestText: string,
    availableSlots: AvailableSlot[]
  ): AvailableSlot | null {
    const text = requestText.toLowerCase();
    const wantsMorning = text.includes("morning") || text.includes("am");
    const wantsEvening =
      text.includes("evening") || text.includes("pm") || text.includes("afternoon");
    const wantsFriday = text.includes("friday");
    const wantsSaturday = text.includes("saturday");
    const wantsSunday = text.includes("sunday");
    const wantsMonday = text.includes("monday");
    const wantsTuesday = text.includes("tuesday");
    const wantsWednesday = text.includes("wednesday");
    const wantsThursday = text.includes("thursday");

    // Try to match an exact ISO date string like "2026-06-22"
    const dateMatch = requestText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const targetDate = dateMatch[1];
      return (
        availableSlots.find((slot) => {
          if (slot.selectedDate !== targetDate) return false;
          const hour = Number(slot.selectedTime.slice(0, 2));
          if (wantsMorning && hour >= 12) return false;
          if (wantsEvening && hour < 12) return false;
          return true;
        }) ?? null
      );
    }

    return (
      availableSlots.find((slot) => {
        const date = new Date(`${slot.selectedDate}T00:00:00`);
        const day = date.getDay();
        const hour = Number(slot.selectedTime.slice(0, 2));

        if (wantsFriday && day !== 5) return false;
        if (wantsSaturday && day !== 6) return false;
        if (wantsSunday && day !== 0) return false;
        if (wantsMonday && day !== 1) return false;
        if (wantsTuesday && day !== 2) return false;
        if (wantsWednesday && day !== 3) return false;
        if (wantsThursday && day !== 4) return false;
        if (wantsMorning && hour >= 12) return false;
        if (wantsEvening && hour < 12) return false;

        return (
          wantsFriday ||
          wantsSaturday ||
          wantsSunday ||
          wantsMonday ||
          wantsTuesday ||
          wantsWednesday ||
          wantsThursday ||
          wantsMorning ||
          wantsEvening
        );
      }) ?? null
    );
  }

  // ─── DB Helpers ──────────────────────────────────────────────────────────────

  private async findActiveAppointmentByPhone(
    patientPhone: string
  ): Promise<AppointmentRow | null> {
    const digits = patientPhone.replace(/\D/g, "");
    const result = await db
      .select()
      .from(appointments)
      .where(
        and(
          or(
            eq(appointments.patientPhone, patientPhone),
            sql`regexp_replace(${appointments.patientPhone}, '\D', '', 'g') = ${digits}`
          ),
          inArray(appointments.status, ["pending", "confirmed", "Reschedule_Requested"])
        )
      )
      .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime))
      .limit(1);

    return result[0] ?? null;
  }

  private async isSlotOpen(selectedDate: string, selectedTime: string): Promise<boolean> {
    const existing = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentDate, selectedDate),
          eq(appointments.appointmentTime, selectedTime),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "no_show")
        )
      )
      .limit(1);

    return existing.length === 0;
  }

  private async getDefaultService() {
    const configuredServiceId = process.env.WHATSAPP_DEFAULT_SERVICE_ID;

    if (configuredServiceId) {
      const service = await this.getServiceById(configuredServiceId);
      if (service) return service;
    }

    const result = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.createdAt))
      .limit(1);

    return result[0] ?? null;
  }

  private async getServiceById(serviceId: string) {
    const result = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
      .limit(1);

    return result[0] ?? null;
  }

  // ─── Parsing ─────────────────────────────────────────────────────────────────

  private extractInboundMessages(payload: unknown): WhatsAppInboundContext[] {
    if (!this.isRecord(payload)) return [];

    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    const contexts: WhatsAppInboundContext[] = [];

    for (const entry of entries) {
      if (!this.isRecord(entry)) continue;
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        if (!this.isRecord(change) || !this.isRecord(change.value)) continue;

        const contacts = Array.isArray(change.value.contacts) ? change.value.contacts : [];
        const messages = Array.isArray(change.value.messages) ? change.value.messages : [];

        for (const message of messages) {
          if (!this.isRecord(message)) continue;

          const patientPhone =
            typeof message.from === "string" ? message.from : "";
          const contact = contacts.find(
            (candidate) =>
              this.isRecord(candidate) && candidate.wa_id === patientPhone
          );
          const profile =
            this.isRecord(contact) && this.isRecord(contact.profile)
              ? contact.profile
              : {};
          const profileName =
            typeof profile.name === "string" ? profile.name : "WhatsApp Patient";
          const parsedMessage = this.parseMessageContent(message);

          if (!patientPhone || !parsedMessage.messageText) {
            continue;
          }

          contexts.push({
            patientPhone,
            profileName,
            messageText: parsedMessage.messageText,
            payloadId: parsedMessage.payloadId,
          });
        }
      }
    }

    return contexts;
  }

  private parseMessageContent(message: Record<string, unknown>): {
    messageText: string;
    payloadId?: string;
  } {
    const type = typeof message.type === "string" ? message.type : "";

    if (
      type === "text" &&
      this.isRecord(message.text) &&
      typeof message.text.body === "string"
    ) {
      return { messageText: message.text.body };
    }

    if (type === "button" && this.isRecord(message.button)) {
      const payloadId =
        typeof message.button.payload === "string"
          ? message.button.payload
          : undefined;
      const messageText =
        typeof message.button.text === "string"
          ? message.button.text
          : payloadId ?? "";
      return { messageText, payloadId };
    }

    if (type === "interactive" && this.isRecord(message.interactive)) {
      const interactive = message.interactive;

      if (this.isRecord(interactive.button_reply)) {
        const payloadId =
          typeof interactive.button_reply.id === "string"
            ? interactive.button_reply.id
            : undefined;
        const messageText =
          typeof interactive.button_reply.title === "string"
            ? interactive.button_reply.title
            : payloadId ?? "";
        return { messageText, payloadId };
      }

      if (this.isRecord(interactive.list_reply)) {
        const payloadId =
          typeof interactive.list_reply.id === "string"
            ? interactive.list_reply.id
            : undefined;
        const messageText =
          typeof interactive.list_reply.title === "string"
            ? interactive.list_reply.title
            : payloadId ?? "";
        return { messageText, payloadId };
      }
    }

    return { messageText: "" };
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private isLandingPageGreeting(normalizedText: string): boolean {
    return LANDING_PAGE_CLICK_TEXTS.some((text) => normalizedText.includes(text));
  }

  private looksLikeRescheduleRequest(normalizedText: string): boolean {
    return (
      normalizedText.includes("reschedule") ||
      normalizedText.includes("move to") ||
      normalizedText.includes("shift to")
    );
  }

  private getCandidateDates(daysAhead: number): string[] {
    const dates: string[] = [];
    const cursor = new Date();

    for (let offset = 0; offset < daysAhead; offset += 1) {
      const next = new Date(cursor);
      next.setDate(cursor.getDate() + offset);
      dates.push(this.toDateString(next));
    }

    return dates;
  }

  private getConfiguredSlotTimes(): string[] {
    const configured =
      process.env.WHATSAPP_BOOKING_SLOT_TIMES ??
      "09:00:00,10:00:00,11:00:00,14:00:00,15:00:00";

    return configured
      .split(",")
      .map((value) => this.normalizeTime(value.trim()))
      .filter((value) => this.isTimeString(value));
  }

  private formatSlotLabel(selectedDate: string, selectedTime: string): string {
    const date = new Date(`${selectedDate}T00:00:00`);
    const day = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${day} ${this.formatTimeForPatient(selectedTime)}`;
  }

  private formatTimeForPatient(selectedTime: string): string {
    const [hourText = "0", minuteText = "00"] = selectedTime.split(":");
    const hour = Number(hourText);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minuteText} ${suffix}`;
  }

  private buildGuestEmail(patientPhone: string): string {
    const digits = patientPhone.replace(/\D/g, "");
    return `whatsapp-${digits || "patient"}@${this.defaultEmailDomain}`;
  }

  private toDateString(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private normalizeTime(value: string): string {
    const parts = value.split(":");
    const hour = String(Number(parts[0] ?? 0)).padStart(2, "0");
    const minute = String(Number(parts[1] ?? 0)).padStart(2, "0");
    const second = String(Number(parts[2] ?? 0)).padStart(2, "0");
    return `${hour}:${minute}:${second}`;
  }

  private isDateString(value: unknown): value is string {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isTimeString(value: unknown): value is string {
    return typeof value === "string" && /^\d{2}:\d{2}:\d{2}$/.test(value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
