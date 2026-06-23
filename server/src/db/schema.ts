/*import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  date,
  time,
  integer,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 })
    .notNull()
    .unique(),

  password: varchar("password", { length: 255 }).notNull(),

  role: varchar("role", { length: 50 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 255 }),

  gender: varchar("gender", { length: 20 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),

  address: text("address").notNull(),
  medicalHistory: text("medical_history").notNull(),
  allergies: text("allergies").notNull(),

  emergencyContactName: varchar("emergency_contact_name", { length: 255 }).notNull(),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }).notNull(),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    durationInMinutes: integer("duration_in_minutes").notNull(),
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("services_name_idx").on(table.name),
    createdAtIdx: index("services_created_at_idx").on(table.createdAt),
  })
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id").references(() => patients.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict", onUpdate: "cascade" }),

    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 30 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }).notNull(),

    appointmentDate: date("appointment_date").notNull(),
    appointmentTime: time("appointment_time").notNull(),

    status: varchar("status", { length: 50 }).notNull().default("pending"),
    notes: text("notes"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("appointments_doctor_id_idx").on(table.doctorId),
    statusIdx: index("appointments_status_idx").on(table.status),
    appointmentDateIdx: index("appointments_appointment_date_idx").on(table.appointmentDate),
  })
); */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  date,
  time,
  integer,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 255 }),
  gender: varchar("gender", { length: 20 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  address: text("address").notNull(),
  medicalHistory: text("medical_history").notNull(),
  allergies: text("allergies").notNull(),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }).notNull(),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    durationInMinutes: integer("duration_in_minutes").notNull(),
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("services_name_idx").on(table.name),
    createdAtIdx: index("services_created_at_idx").on(table.createdAt),
  })
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id").references(() => patients.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    doctorId: uuid("doctor_id")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict", onUpdate: "cascade" }),
    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 30 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }).notNull(),
    appointmentDate: date("appointment_date").notNull(),
    appointmentTime: time("appointment_time").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    notes: text("notes"),

    // UPDATED: Nullable to allow public bookings without a registered user
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("appointments_doctor_id_idx").on(table.doctorId),
    statusIdx: index("appointments_status_idx").on(table.status),
    appointmentDateIdx: index("appointments_appointment_date_idx").on(table.appointmentDate),
  })
);

// Treatment History Table
export const treatmentHistories = pgTable(
  "treatment_histories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade", onUpdate: "cascade" }),

    appointmentId: uuid("appointment_id")
      .notNull()
      .unique()
      .references(() => appointments.id, { onDelete: "restrict", onUpdate: "cascade" }),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

    // Medical details
    diagnosis: text("diagnosis"),
    prescription: text("prescription"),
    notes: text("notes"),
    treatmentDate: date("treatment_date").notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("treatment_histories_patient_id_idx").on(table.patientId),
    appointmentIdIdx: index("treatment_histories_appointment_id_idx").on(table.appointmentId),
    doctorIdIdx: index("treatment_histories_doctor_id_idx").on(table.doctorId),
    treatmentDateIdx: index("treatment_histories_treatment_date_idx").on(table.treatmentDate),
  })
);

// Treatment History Services Junction Table
export const treatmentHistoryServices = pgTable(
  "treatment_history_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    treatmentHistoryId: uuid("treatment_history_id")
      .notNull()
      .references(() => treatmentHistories.id, { onDelete: "cascade", onUpdate: "cascade" }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict", onUpdate: "cascade" }),

    // Service details at time of treatment
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    servicePrice: numeric("service_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    treatmentHistoryIdIdx: index("treatment_history_services_treatment_id_idx").on(table.treatmentHistoryId),
    serviceIdIdx: index("treatment_history_services_service_id_idx").on(table.serviceId),
  })
);

// Invoices Table
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict", onUpdate: "cascade" }),

    treatmentHistoryId: uuid("treatment_history_id")
      .references(() => treatmentHistories.id, { onDelete: "set null", onUpdate: "cascade" }),

    // Billing details
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),

    // Payment details
    paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
    paymentMethod: varchar("payment_method", { length: 100 }),
    paymentDate: timestamp("payment_date"),
    paymentNotes: text("payment_notes"),

    issuedDate: timestamp("issued_date").defaultNow().notNull(),
    dueDate: timestamp("due_date"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("invoices_patient_id_idx").on(table.patientId),
    treatmentHistoryIdIdx: index("invoices_treatment_history_id_idx").on(table.treatmentHistoryId),
    invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
    paymentStatusIdx: index("invoices_payment_status_idx").on(table.paymentStatus),
  })
);

// Feedback Table
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    visitDate: date("visit_date").notNull(),
    rating: integer("rating").notNull(),
    comments: text("comments"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
  })
);

// Invoice Items Junction Table
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade", onUpdate: "cascade" }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict", onUpdate: "cascade" }),

    description: varchar("description", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceIdIdx: index("invoice_items_invoice_id_idx").on(table.invoiceId),
    serviceIdIdx: index("invoice_items_service_id_idx").on(table.serviceId),
  })
);