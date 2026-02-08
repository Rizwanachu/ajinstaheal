import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { format, parse, addMinutes, isBefore, isAfter, isEqual } from "date-fns";
import { randomBytes } from "crypto";
import { sendEmail, createConfirmationEmailHtml } from "./email";
import { addEventToCalendar, archiveEventInCalendar } from "./google-calendar";
import { db } from "./db";
import { blockedDates } from "@shared/schema";

import { eq } from "drizzle-orm";

// Convert 24-hour format (HH:mm) to 12-hour format (h:mm AM/PM)
function format12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

function generateBookingId(date: string): string {
  // Format: AJIH-YYYYMMDD-XXXX (4 random hex chars)
  const cleanDate = date.replace(/-/g, ""); // Convert YYYY-MM-DD to YYYYMMDD
  const randomPart = randomBytes(2).toString("hex").toUpperCase().padStart(4, "0");
  return `AJIH-${cleanDate}-${randomPart}`;
}

// Check if doctor token is valid using database
async function isValidDoctorToken(token: string): Promise<boolean> {
  const session = await storage.getDoctorSession(token);
  return !!session && session.expiresAt > new Date();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === DOCTOR AUTHENTICATION ===
  app.post("/api/doctor/verify", async (req, res) => {
    try {
      const { password } = req.body;
      const doctorPassword = process.env.DOCTOR_PASSWORD;
      
      if (!doctorPassword) {
        console.error("DOCTOR_PASSWORD env var is missing");
        return res.status(500).json({ message: "Server configuration error" });
      }

      if (String(password).trim() !== String(doctorPassword).trim()) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.createDoctorSession(token, expiresAt);
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // === ADMIN ===
  // Get all bookings (for admin dashboard)
  app.get(api.bookings.list.path, async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // === BLOCKED DATES/TIMES ===
  // Get all blocked dates/times
  app.get("/api/admin/blocked-dates", async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const blocked = await storage.getBlockedDates();
      res.json(blocked);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch blocked dates" });
    }
  });

  // Create blocked date/time
  app.post("/api/admin/blocked-dates", async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { date, startTime, endTime, reason } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const blocked = await storage.createBlockedDate({ date, startTime, endTime, reason });
      
      // Add blocking event to Google Calendar
      if (startTime && endTime) {
        // Blocked time range
        const eventTitle = `BLOCKED – ${reason || 'Unavailable'}`;
        const eventDate = new Date(date);
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);
        
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(eventDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
        
        await addEventToCalendar({
          title: eventTitle,
          description: reason || "Doctor unavailable",
          startTime: startDateTime,
          endTime: endDateTime,
        });
      } else {
        // Full day blocked (leave)
        const eventDate = new Date(date);
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(0, 0, 0, 0);
        
        const endDateTime = new Date(eventDate);
        endDateTime.setHours(23, 59, 59, 999);
        
        await addEventToCalendar({
          title: `BLOCKED – ${reason || 'Leave'}`,
          description: reason || "Doctor on leave",
          startTime: startDateTime,
          endTime: endDateTime,
        });
      }
      
      res.status(201).json(blocked);
    } catch (err) {
      console.error("Error creating blocked date:", err);
      res.status(500).json({ message: "Failed to create blocked date" });
    }
  });

  // Delete blocked date/time
  app.delete("/api/admin/blocked-dates/:id", async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      await storage.deleteBlockedDate(parseInt(id));
      res.json({ message: "Blocked date deleted" });
    } catch (err) {
      console.error("Error deleting blocked date:", err);
      res.status(500).json({ message: "Failed to delete blocked date" });
    }
  });

  // === AVAILABILITY ===
  app.get(api.availability.get.path, async (req, res) => {
    try {
      const { date } = api.availability.get.input.parse(req.query);
      
      // Check if date is blocked
      const isBlocked = await storage.isDateBlocked(date);
      if (isBlocked) {
        return res.json({ date, slots: [] });
      }

      const dayOfWeek = parse(date, "yyyy-MM-dd", new Date()).getDay();

      let startHour = 0;
      let endHour = 0;

      // Working hours logic
      if (dayOfWeek === 6) { // Saturday
        startHour = 16;
        endHour = 18;
      } else if (dayOfWeek === 0) { // Sunday
        startHour = 8;
        endHour = 10;
      } else { // Mon-Fri
        startHour = 16;
        endHour = 18;
      }

      const slots: string[] = [];
      let currentTime = parse(`${date} ${startHour}:00`, "yyyy-MM-dd H:mm", new Date());
      const endTime = parse(`${date} ${endHour}:00`, "yyyy-MM-dd H:mm", new Date());

      const existingBookings = await storage.getBookingsByDate(date);
      const blockedDatesForDate = await db.select().from(blockedDates).where(eq(blockedDates.date, date));
      const timeBlock = blockedDatesForDate.filter(b => b.startTime && b.endTime);

      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutes(currentTime, 60); // Default 60 min slots
        
        if (isAfter(slotEnd, endTime) && !isEqual(slotEnd, endTime)) {
          break;
        }

        const timeString = format(currentTime, "HH:mm");
        const isTaken = existingBookings.some(booking => booking.status === "confirmed" && booking.time === timeString);
        const isBlocked = timeBlock && timeBlock.some(block => 
          block.startTime && block.endTime && timeString >= block.startTime && timeString < block.endTime
        );

        if (!isTaken && !isBlocked) {
          slots.push(timeString);
        }

        currentTime = addMinutes(currentTime, 30); // 30 min intervals
      }

      res.json({ date, slots });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === BOOKINGS ===
  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const token = randomBytes(32).toString("hex");
      const bookingId = generateBookingId(input.date);
      
      const existingBookings = await storage.getBookingsByDate(input.date);
      const isConflict = existingBookings.some(
        b => b.time === input.time && b.status === "confirmed"
      );
      
      if (isConflict) {
        return res.status(400).json({ message: "This time slot is already booked." });
      }
      
      const booking = await storage.createBooking({
        ...input,
        token,
        bookingId,
      });
      
      const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.REPLIT_DEV_DOMAIN) || 'http://localhost:5000';
      const manageLink = `${appUrl}/manage-booking?id=${booking.bookingId}&email=${encodeURIComponent(input.customerEmail)}`;
      const emailHtml = createConfirmationEmailHtml(
        input.customerName,
        "Consultation",
        format(new Date(input.date), "MMMM d, yyyy"),
        input.time,
        manageLink,
        booking.bookingId
      );
      
      try {
        await Promise.all([
          sendEmail({
            to: input.customerEmail,
            subject: `Booking Confirmation - AJ Insta Heal`,
            html: emailHtml,
          }),
          process.env.DOCTOR_EMAIL ? sendEmail({
            to: process.env.DOCTOR_EMAIL,
            subject: `New Booking: ${input.customerName}`,
            html: `New booking received for ${input.customerName} on ${input.date} at ${input.time}`,
          }) : Promise.resolve(true)
        ]);
      } catch (postErr) {
        console.error("❌ Email error:", postErr);
      }

      try {
        const startDateTime = new Date(`${input.date}T${input.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60000);

        const googleEventId = await addEventToCalendar({
          title: `${input.customerName} - Consultation`,
          description: `Customer: ${input.customerName}\nEmail: ${input.customerEmail}\nPhone: ${input.customerPhone}`,
          startTime: startDateTime,
          endTime: endDateTime,
        });

        if (googleEventId) {
          await storage.updateBookingGoogleEventId(booking.id, googleEventId);
        }
      } catch (calErr) {
        console.error("❌ Google Calendar error:", calErr);
      }

      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data" });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get(api.bookings.get.path, async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.query as { email: string };
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      let booking = id.startsWith("AJIH-") 
        ? await storage.getBookingByBookingId(id)
        : await storage.getBookingById(Number(id));
      
      if (!booking || booking.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch("/api/bookings/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const booking = await storage.cancelBooking(Number(id), email);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.googleEventId) {
        const { removeEventFromCalendar } = await import("./google-calendar");
        await removeEventFromCalendar(booking.googleEventId);
      }

      await sendEmail({
        to: booking.customerEmail,
        subject: "Booking Cancelled - AJ Insta Heal",
        html: `Your booking for ${booking.date} at ${booking.time} has been cancelled.`,
      });

      res.json(booking);
    } catch (err) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, newDate, newTime } = req.body;

      if (!email || !newDate || !newTime) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const existingBookings = await storage.getBookingsByDate(newDate);
      if (existingBookings.some(b => b.time === newTime && b.status === "confirmed")) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }

      const booking = await storage.rescheduleBooking(Number(id), email, newDate, newTime);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.googleEventId) {
        const { updateEventInCalendar } = await import("./google-calendar");
        const startDateTime = new Date(`${newDate}T${newTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60000);

        await updateEventInCalendar(booking.googleEventId, {
          title: `${booking.customerName} - Consultation`,
          startTime: startDateTime,
          endTime: endDateTime,
        });
      }

      res.json(booking);
    } catch (err) {
      res.status(500).json({ message: "Failed to reschedule" });
    }
  });

  return httpServer;
}
