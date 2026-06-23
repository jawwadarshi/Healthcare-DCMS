/*
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";

export type AppointmentRow = InferSelectModel<typeof appointments>;
export type NewAppointmentRow = InferInsertModel<typeof appointments>;

export type AppointmentsListOptions = {
  page: number;
  limit: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  appointmentDate?: string;
  sortBy: "appointmentDate" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
};

export class AppointmentsRepository {
  async create(payload: NewAppointmentRow): Promise<AppointmentRow> {
    const result = await db.insert(appointments).values(payload).returning();
    return result[0]!;
  }

  async findById(id: string): Promise<AppointmentRow | null> {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async updateById(
    id: string,
    patch: Partial<NewAppointmentRow>
  ): Promise<AppointmentRow | null> {
    const result = await db
      .update(appointments)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<AppointmentRow | null> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    return result[0] ?? null;
  }

  async list(options: AppointmentsListOptions): Promise<{
    items: AppointmentRow[];
    total: number;
  }> {
    const { page, limit, status, doctorId, patientId, appointmentDate, sortBy, sortOrder } =
      options;
    const offset = (page - 1) * limit;

    const whereConditions: SQL[] = [];

    if (status) {
      whereConditions.push(eq(appointments.status, status));
    }
    if (doctorId) {
      whereConditions.push(eq(appointments.doctorId, doctorId));
    }
    if (patientId) {
      whereConditions.push(eq(appointments.patientId, patientId));
    }
    if (appointmentDate) {
      whereConditions.push(eq(appointments.appointmentDate, appointmentDate));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const orderColumnMap = {
      appointmentDate: appointments.appointmentDate,
      createdAt: appointments.createdAt,
      status: appointments.status,
    };

    const orderColumn = orderColumnMap[sortBy];
    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const itemsQuery = db
      .select()
      .from(appointments)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(whereClause);

    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}

export const appointmentsRepository = new AppointmentsRepository();
*/

import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";

export type AppointmentRow = InferSelectModel<typeof appointments>;
export type NewAppointmentRow = InferInsertModel<typeof appointments>;

export type AppointmentsListOptions = {
  page: number;
  limit: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  appointmentDate?: string;
  // Made sortBy optional to handle cases where it's missing from the request
  sortBy?: "appointmentDate" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
};

export class AppointmentsRepository {
  async create(payload: NewAppointmentRow): Promise<AppointmentRow> {
    const result = await db.insert(appointments).values(payload).returning();
    return result[0]!;
  }

  async findById(id: string): Promise<AppointmentRow | null> {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async updateById(
    id: string,
    patch: Partial<NewAppointmentRow>
  ): Promise<AppointmentRow | null> {
    const result = await db
      .update(appointments)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<AppointmentRow | null> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    return result[0] ?? null;
  }

  async list(options: AppointmentsListOptions): Promise<{
    items: AppointmentRow[]; //async list(options: AppointmentsListOptions): Declares a background asynchronous method named list that accepts an object of configuration options (options) structured by a TypeScript rulebook called AppointmentsListOptions
    total: number; //Promise<{...}>: A TypeScript rule ensuring this method promises to return an object containing two specific things: an array of database rows (items) and a total count number (total).
  }> {
    //Uses Object Destructuring to unpack all your search filters, pagination rules, and sorting parameters out of the single options bundle into standalone variables.
    const { page, limit, status, doctorId, patientId, appointmentDate, sortBy, sortOrder } = options;

    const offset = (page - 1) * limit; // A standard math formula used for database pagination. It calculates how many database rows to skip. For example, if you are on Page 3 and your limit is 10 items per page, it calculates $(3 - 1) \times 10 = 20$. The database will skip the first 20 records and give you records 21 through 30.

    const whereConditions: SQL[] = []; // Initializes an empty array container meant to store chunks of raw SQL conditions.

    if (status) { // An if-statement that asks: "Did the user select a status filter?" If they did, it uses Drizzle's eq (equals) tool to create a query condition: appointments.status = status and pushes it into the array. The subsequent blocks do the exact same check for doctorId, patientId, and appointmentDate
      whereConditions.push(eq(appointments.status, status));
    }
    if (doctorId) {
      whereConditions.push(eq(appointments.doctorId, doctorId));
    }
    if (patientId) {
      whereConditions.push(eq(appointments.patientId, patientId));
    }
    if (appointmentDate) {
      whereConditions.push(eq(appointments.appointmentDate, appointmentDate));
    }
    //const whereClause = ...: This combines your dynamic conditions using a Ternary Operator (? :).
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    //you pushed any filters into the array (length > 0), it links them all together using an and(...) wrapper (e.g., WHERE status = 'confirmed' AND doctorId = 'xyz').
    // --- FIX FOR "ORDER BY desc" ERROR ---
    const orderColumnMap = {   //const orderColumnMap = { ... }: A secure dictionary map that translates plain text strings coming from the website URL (like the string "appointmentDate") into actual structural column references known by your database model
      appointmentDate: appointments.appointmentDate,
      createdAt: appointments.createdAt,
      status: appointments.status,
    };

    // Use a fallback (appointments.appointmentDate) if sortBy is missing or invalid
    const orderColumn = (sortBy && orderColumnMap[sortBy]) //const orderColumn = ...: Another ternary operator safeguard. It checks: "Did the user provide a sortBy string, and does it match a column inside our dictionary map?" If yes, use that column. If no, fall back safely to sorting by
      ? orderColumnMap[sortBy]
      : appointments.appointmentDate;

    const orderDirection = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);
    //const itemsQuery = db.select()...: This defines (but does not execute yet) the query blueprint responsible for pulling the raw data rows out of your database.
    const itemsQuery = db //SELECT * FROM appointments WHERE ... ORDER BY ... LIMIT ... OFFSET ...;
      .select()
      .from(appointments)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const countQuery = db //This defines a separate, light query blueprint whose only job is to count matching rows.
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(whereClause);
    //const [items, countResult]  This fires both query requests to the database simultaneously using Promise.all.
    const [items, countResult] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}
//total: Number(countResult[0]?.count ?? 0): Cleans up the database count return formatting. It grabs the count property from the first array row slot safely (countResult[0]?.count). If the database returns something completely blank or null, the nullish coalescing operator (??) falls back safely to 0. Finally, it wraps it in a Number() cast to make sure it acts as a true numeric value

export const appointmentsRepository = new AppointmentsRepository();