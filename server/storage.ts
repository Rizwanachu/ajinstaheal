import { db } from "./db";
import {
  services, bookings, enquiries, blockedDates, doctorSessions,
  type Service, type Booking, type Enquiry, type BlockedDate, type DoctorSession,
  type InsertService, type InsertBooking, type InsertEnquiry, type InsertBlockedDate, type InsertDoctorSession
} from "@shared/schema";
import { eq, and, like, lt } from "drizzle-orm";

export interface IStorage {
  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  
  // Bookings
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking & { token: string; bookingId: string }): Promise<Booking>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  cancelBooking(id: number, email: string): Promise<Booking | undefined>;
  rescheduleBooking(id: number, email: string, newDate: string, newTime: string): Promise<Booking | undefined>;
  
  // Enquiries
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  
  // Blocked Dates
  getBlockedDates(): Promise<BlockedDate[]>;
  isDateBlocked(date: string): Promise<boolean>;
  isTimeBlocked(date: string, time: string): Promise<boolean>;
  createBlockedDate(blocked: InsertBlockedDate): Promise<BlockedDate>;
  deleteBlockedDate(id: number): Promise<void>;
  
  // Doctor Sessions (for authentication)
  createDoctorSession(token: string, expiresAt: Date): Promise<DoctorSession>;
  getDoctorSession(token: string): Promise<DoctorSession | undefined>;
  deleteDoctorSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // Seeding
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(bookings.createdAt);
  }

  async createBooking(booking: InsertBooking & { token: string; bookingId: string }): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.date, date));
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId));
    return booking;
  }

  async cancelBooking(id: number, email: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(and(eq(bookings.id, id), eq(bookings.customerEmail, email)))
      .returning();
    return updated;
  }

  async rescheduleBooking(id: number, email: string, newDate: string, newTime: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ date: newDate, time: newTime })
      .where(and(eq(bookings.id, id), eq(bookings.customerEmail, email)))
      .returning();
    return updated;
  }

  async createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry> {
    const [newEnquiry] = await db.insert(enquiries).values(enquiry).returning();
    return newEnquiry;
  }

  async getBlockedDates(): Promise<BlockedDate[]> {
    return await db.select().from(blockedDates);
  }
  
  async isDateBlocked(date: string): Promise<boolean> {
    // Only return true if the ENTIRE day is blocked (startTime and endTime are null)
    const [blocked] = await db.select().from(blockedDates).where(
      and(
        eq(blockedDates.date, date),
        blockedDates.startTime === null,
        blockedDates.endTime === null
      )
    );
    return !!blocked;
  }

  async isTimeBlocked(date: string, time: string): Promise<boolean> {
    // Check for full-day blocks
    const dayBlock = await db
      .select()
      .from(blockedDates)
      .where(and(eq(blockedDates.date, date), blockedDates.startTime === null));
    if (dayBlock.length > 0) return true;

    // Check for time-range blocks
    const timeBlock = await db
      .select()
      .from(blockedDates)
      .where(
        and(
          eq(blockedDates.date, date),
          blockedDates.startTime !== null,
          blockedDates.startTime !== undefined
        )
      );

    for (const block of timeBlock) {
      if (block.startTime && block.endTime && time >= block.startTime && time < block.endTime) {
        return true;
      }
    }
    return false;
  }

  async createBlockedDate(blocked: InsertBlockedDate): Promise<BlockedDate> {
    const [newBlocked] = await db.insert(blockedDates).values(blocked).returning();
    return newBlocked;
  }

  async deleteBlockedDate(id: number): Promise<void> {
    await db.delete(blockedDates).where(eq(blockedDates.id, id));
  }

  async seedData(): Promise<void> {
    const existingServices = await this.getServices();
    if (existingServices.length === 0) {
      await db.insert(services).values([
        { name: "General Acupuncture", duration: 60, description: "Holistic acupuncture treatment for general wellness.", price: "Contact for pricing" },
        { name: "Pain Management", duration: 60, description: "Targeted therapy for chronic and acute pain relief.", price: "Contact for pricing" },
        { name: "Stress Relief Session", duration: 30, description: "Calming session focused on stress and anxiety reduction.", price: "Contact for pricing" },
        { name: "Cupping Therapy", duration: 30, description: "Traditional suction cup therapy for blood flow and relaxation.", price: "Contact for pricing" },
      ]);
    }
  }

  // Doctor Sessions (for Vercel-safe authentication)
  async createDoctorSession(token: string, expiresAt: Date): Promise<DoctorSession> {
    // Delete expired sessions first
    await this.deleteExpiredSessions();
    
    const [session] = await db.insert(doctorSessions).values({ token, expiresAt }).returning();
    return session;
  }

  async getDoctorSession(token: string): Promise<DoctorSession | undefined> {
    // Delete expired sessions first
    await this.deleteExpiredSessions();
    
    const [session] = await db.select().from(doctorSessions).where(eq(doctorSessions.token, token));
    return session;
  }

  async deleteDoctorSession(token: string): Promise<void> {
    await db.delete(doctorSessions).where(eq(doctorSessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(doctorSessions).where(lt(doctorSessions.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
