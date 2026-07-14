import type { AppointmentRow } from "../appointments/appointments.repository.js";

type WhatsAppTextPayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    preview_url: boolean;
    body: string;
  };
};

type WhatsAppTemplatePayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: "body";
      parameters: Array<{
        type: "text";
        text: string;
      }>;
    }>;
  };
};

type WhatsAppInteractiveButtonPayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
};

type WhatsAppInteractiveListPayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "list";
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
};

type WhatsAppDocumentPayload = {
  messaging_product: "whatsapp";
  to: string;
  type: "document";
  document: {
    filename: string;
    mimetype: string;
    data: string;
  };
};

type WhatsAppMessagePayload =
  | WhatsAppTextPayload
  | WhatsAppTemplatePayload
  | WhatsAppInteractiveButtonPayload
  | WhatsAppInteractiveListPayload
  | WhatsAppDocumentPayload;

export type WhatsAppReplyButton = {
  id: string;
  title: string;
};

export type WhatsAppListRow = {
  id: string;
  title: string;
  description?: string;
};

export class WhatsAppService {
  private readonly apiVersion = process.env.WHATSAPP_API_VERSION ?? "v20.0";
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private readonly defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "";
  private readonly clinicName = process.env.CLINIC_NAME ?? "Dental Clinic";
  private readonly templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";
  private readonly bookedTemplateName = process.env.WHATSAPP_APPOINTMENT_BOOKED_TEMPLATE_NAME;
  private readonly updatedTemplateName = process.env.WHATSAPP_APPOINTMENT_UPDATED_TEMPLATE_NAME;

  isConfigured(): boolean {
    const result = Boolean(this.phoneNumberId && this.accessToken);
    console.log("[DEBUG SERVICE] isConfigured:", result);
    console.log("[DEBUG SERVICE] WHATSAPP_PHONE_NUMBER_ID:", this.phoneNumberId ? "SET" : "MISSING ❌");
    console.log("[DEBUG SERVICE] WHATSAPP_ACCESS_TOKEN:", this.accessToken ? "SET" : "MISSING ❌");
    //return Boolean(this.phoneNumberId && this.accessToken);
    return result;
  }

  verifyWebhook(mode: unknown, token: unknown, challenge: unknown): string | null {
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN;

    if (
      mode === "subscribe" &&
      typeof token === "string" &&
      token === verifyToken &&
      typeof challenge === "string"
    ) {
      return challenge;
    }

    return null;
  }

  async sendAppointmentBooked(
    appointment: AppointmentRow,
    serviceName?: string
  ): Promise<void> {
    try {
      const templateParameters = this.getAppointmentTemplateParameters(
        appointment,
        serviceName
      );

      if (this.bookedTemplateName) {
        await this.sendTemplateMessage(
          appointment.patientPhone,
          this.bookedTemplateName,
          templateParameters
        );
        console.info(
          `[WhatsApp] Appointment booking confirmation sent to ${appointment.patientPhone}`
        );
        return;
      }

      const message = [
        `Hi ${appointment.patientName}, your appointment request at ${this.clinicName} has been received.`,
        `Service: ${serviceName || "Dental Service"}`,
        `Date: ${this.formatDate(appointment.appointmentDate)}`,
        `Time: ${this.formatTime(appointment.appointmentTime)}`,
        `Status: ${appointment.status}`,
        "We will contact you if anything else is needed.",
      ].join("\n");

      await this.sendTextMessage(appointment.patientPhone, message);
      console.info(
        `[WhatsApp] Appointment booking confirmation sent to ${appointment.patientPhone}`
      );
    } catch (error) {
      console.error(
        `[WhatsApp] Failed to send appointment booking confirmation to ${appointment.patientPhone}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  async sendAppointmentUpdated(
    appointment: AppointmentRow,
    serviceName?: string
  ): Promise<void> {
    try {
      const templateParameters = this.getAppointmentTemplateParameters(
        appointment,
        serviceName
      );

      if (this.updatedTemplateName) {
        await this.sendTemplateMessage(
          appointment.patientPhone,
          this.updatedTemplateName,
          templateParameters
        );
        console.info(
          `[WhatsApp] Appointment update confirmation sent to ${appointment.patientPhone}`
        );
        return;
      }

      const message = [
        `Hi ${appointment.patientName}, your appointment at ${this.clinicName} has been updated.`,
        `Service: ${serviceName || "Dental Service"}`,
        `Date: ${this.formatDate(appointment.appointmentDate)}`,
        `Time: ${this.formatTime(appointment.appointmentTime)}`,
        `Status: ${appointment.status}`,
      ].join("\n");

      await this.sendTextMessage(appointment.patientPhone, message);
      console.info(
        `[WhatsApp] Appointment update confirmation sent to ${appointment.patientPhone}`
      );
    } catch (error) {
      console.error(
        `[WhatsApp] Failed to send appointment update confirmation to ${appointment.patientPhone}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  async sendTemplateMessage(to: string, templateName: string, bodyParameters: string[]): Promise<void> {
    if (!this.isConfigured()) {
      console.warn("WhatsApp is not configured. Skipping template message.");
      return;
    }

    const payload: WhatsAppTemplatePayload = {
      messaging_product: "whatsapp",
      to: this.normalizeAndAssertPhoneNumber(to),
      type: "template",
      template: {
        name: templateName,
        language: {
          code: this.templateLanguage,
        },
        components: [
          {
            type: "body",
            parameters: bodyParameters.map((text) => ({ type: "text", text })),
          },
        ],
      },
    };

    await this.sendPayload(payload);
  }

  async sendInvoiceSummary(
    to: string,
    summary: string,
    pdfBuffer?: Buffer
  ): Promise<void> {
    if (!this.isConfigured()) {
      console.warn("WhatsApp is not configured. Skipping invoice message.");
      return;
    }

    const recipientPhone = this.normalizeAndAssertPhoneNumber(to);

    // Send the text summary first
    const textPayload: WhatsAppTextPayload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: {
        preview_url: false,
        body: summary,
      },
    };

    await this.sendPayload(textPayload);
    console.info(`[WhatsApp] Invoice summary sent to ${to}`);

    // If a PDF buffer is provided, send it as a document
    if (pdfBuffer) {
      try {
        // Convert buffer to base64 for media upload
        const base64Pdf = pdfBuffer.toString("base64");

        const documentPayload = {
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "document",
          document: {
            filename: "Invoice.pdf",
            mimetype: "application/pdf",
            data: base64Pdf,
          },
        } as any;

        await this.sendPayload(documentPayload);
        console.info(`[WhatsApp] Invoice PDF sent to ${to}`);
      } catch (pdfError) {
        console.error(`[WhatsApp] Failed to send invoice PDF to ${to}:`, pdfError);
      }
    }
  }

  async sendTextMessage(to: string, body: string): Promise<void> {
    console.log("[DEBUG SERVICE] sendTextMessage called, to:", to);
    if (!this.isConfigured()) {
      console.warn("WhatsApp is not configured. Skipping text message.");
      return;
    }

    const payload: WhatsAppTextPayload = {
      messaging_product: "whatsapp",
      to: this.normalizeAndAssertPhoneNumber(to),
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    };

    await this.sendPayload(payload);
  }

  async sendReplyButtons(
    to: string,
    body: string,
    buttons: WhatsAppReplyButton[],
    footer?: string
  ): Promise<void> {
    console.log("[DEBUG SERVICE] sendReplyButtons called, to:", to); // LOG 4c

    if (!this.isConfigured()) {
      console.warn("WhatsApp is not configured. Skipping button message.");
      return;
    }

    const safeButtons = buttons.slice(0, 3).map((button) => ({
      type: "reply" as const,
      reply: {
        id: button.id.slice(0, 256),
        title: button.title.slice(0, 20),
      },
    }));

    const payload: WhatsAppInteractiveButtonPayload = {
      messaging_product: "whatsapp",
      to: this.normalizeAndAssertPhoneNumber(to),
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: body.slice(0, 1024),
        },
        ...(footer ? { footer: { text: footer.slice(0, 60) } } : {}),
        action: {
          buttons: safeButtons,
        },
      },
    };

    await this.sendPayload(payload);
  }

  async sendListMessage(
    to: string,
    body: string,
    buttonText: string,
    sectionTitle: string,
    rows: WhatsAppListRow[],
    footer?: string
  ): Promise<void> {
    console.log("[DEBUG SERVICE] sendListMessage called, to:", to);
    if (!this.isConfigured()) {
      console.warn("WhatsApp is not configured. Skipping list message.");
      return;
    }

    const safeRows = rows.slice(0, 10).map((row) => ({
      id: row.id.slice(0, 200),
      title: row.title.slice(0, 24),
      ...(row.description ? { description: row.description.slice(0, 72) } : {}),
    }));

    const payload: WhatsAppInteractiveListPayload = {
      messaging_product: "whatsapp",
      to: this.normalizeAndAssertPhoneNumber(to),
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: body.slice(0, 1024),
        },
        ...(footer ? { footer: { text: footer.slice(0, 60) } } : {}),
        action: {
          button: buttonText.slice(0, 20),
          sections: [
            {
              title: sectionTitle.slice(0, 24),
              rows: safeRows,
            },
          ],
        },
      },
    };

    await this.sendPayload(payload);
  }

  private async sendPayload(payload: WhatsAppMessagePayload): Promise<void> {
    const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    console.log("[DEBUG SERVICE] sendPayload calling Meta API:", endpoint);
    console.log("[DEBUG SERVICE] payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("[DEBUG SERVICE] Meta API response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API error ${response.status}: ${errorBody}`);
    }
  }

  private normalizeAndAssertPhoneNumber(phoneNumber: string): string {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      throw new Error(`Invalid WhatsApp recipient phone number: ${phoneNumber}`);
    }

    return normalizedPhone;
  }

  private getAppointmentTemplateParameters(
    appointment: AppointmentRow,
    serviceName?: string
  ): string[] {
    return [
      appointment.patientName,
      this.clinicName,
      this.formatDate(appointment.appointmentDate),
      this.formatTime(appointment.appointmentTime),
      serviceName || "Dental Service",
      appointment.status,
    ];
  }

  private normalizePhoneNumber(phoneNumber: string): string | null {
    const trimmed = phoneNumber.trim();
    const startsWithPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");

    if (digits.length < 8 || digits.length > 15) {
      return null;
    }

    if (startsWithPlus) {
      return digits;
    }

    if (digits.startsWith("00")) {
      return digits.slice(2);
    }

    if (this.defaultCountryCode && digits.startsWith("0")) {
      return `${this.defaultCountryCode}${digits.slice(1)}`;
    }

    if (this.defaultCountryCode && digits.length <= 10) {
      return `${this.defaultCountryCode}${digits}`;
    }

    return digits;
  }

  private formatDate(value: Date | string): string {
    return value.toString();
  }

  private formatTime(value: Date | string): string {
    return value.toString();
  }
}

export const whatsappService = new WhatsAppService();
