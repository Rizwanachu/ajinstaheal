import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === SERVICES ===
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes (30 or 60)
  description: text("description").notNull(),
  price: text("price").default("Contact for pricing"),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// === BOOKINGS ===
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(), // AJIH-YYYYMMDD-XXXX format
  serviceId: integer("service_id").notNull(), // Foreign key logic handled in app
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  comments: text("comments"),
  status: text("status").default("confirmed"), // confirmed, cancelled, rescheduled
  token: text("token").notNull().unique(), // Secure token for manage-booking access
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true,
  bookingId: true,  // Generated server-side
  token: true,      // Generated server-side
  status: true      // Has default value
});
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// === ENQUIRIES ===
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnquirySchema = createInsertSchema(enquiries).omit({ id: true, createdAt: true });
export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;

// === BLOCKED DATES & TIMES ===
export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time"), // HH:mm (optional - null means full day block)
  endTime: text("end_time"), // HH:mm (optional)
  reason: text("reason"),
});

export const insertBlockedDateSchema = createInsertSchema(blockedDates).omit({ id: true });
export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = z.infer<typeof insertBlockedDateSchema>;

// === DOCTOR SESSIONS (for Vercel compatibility) ===
export const doctorSessions = pgTable("doctor_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDoctorSessionSchema = createInsertSchema(doctorSessions).omit({ id: true, createdAt: true });
export type DoctorSession = typeof doctorSessions.$inferSelect;
export type InsertDoctorSession = z.infer<typeof insertDoctorSessionSchema>;

// === FORM TYPES ===
export const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  comments: z.string().optional(),
});
export type BookingFormData = z.infer<typeof bookingFormSchema>;

// === API TYPES ===
export type CreateBookingRequest = InsertBooking;
export type CreateEnquiryRequest = InsertEnquiry;

// Response types
export type AvailabilityResponse = {
  date: string;
  slots: string[];
};
