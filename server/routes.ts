import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { format, parse, addMinutes, isBefore, isAfter, isEqual } from "date-fns";
import { randomBytes } from "crypto";
import { sendEmail, createConfirmationEmailHtml } from "./email";
import { addEventToCalendar, archiveEventInCalendar } from "./google-calendar";
import PDFDocument from "pdfkit";
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
  // Initialize seed data
  await storage.seedData();

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
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Login failed for password: ${password}`);
        }
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

  // === SERVICES ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  // === AVAILABILITY ===
  app.get(api.availability.get.path, async (req, res) => {
    try {
      const { date, serviceId } = api.availability.get.input.parse(req.query);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Check if date is blocked
      const isBlocked = await storage.isDateBlocked(date);
      if (isBlocked) {
        return res.json({ date, slots: [] });
      }

      const dayOfWeek = parse(date, "yyyy-MM-dd", new Date()).getDay();
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      let startHour = 0;
      let endHour = 0;

      // Working hours logic
      // Saturday: 4–6 pm (16:00 - 18:00)
      // Sunday: 8–10 am (08:00 - 10:00)
      // Monday–Friday: 4–6 pm (16:00 - 18:00)
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

      const slots: Array<{ time: string; available: boolean }> = [];
      let currentTime = parse(`${date} ${startHour}:00`, "yyyy-MM-dd H:mm", new Date());
      const endTime = parse(`${date} ${endHour}:00`, "yyyy-MM-dd H:mm", new Date());

      // Get existing bookings
      const existingBookings = await storage.getBookingsByDate(date);

      // Get blocked times for this date
      const blockedDatesForDate = await db.select().from(blockedDates).where(eq(blockedDates.date, date));
      const timeBlock = blockedDatesForDate.filter(b => b.startTime && b.endTime);

      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutes(currentTime, service.duration);
        
        if (isAfter(slotEnd, endTime) && !isEqual(slotEnd, endTime)) {
          break; // Slot exceeds working hours
        }

        const timeString = format(currentTime, "HH:mm");
        
        // Check collision with existing bookings
        const isTaken = existingBookings.some(booking => {
          // Only mark as taken if the booking is confirmed and matches the time
          if (booking.status !== "confirmed") return false;
          if (booking.serviceId !== serviceId) return false; // Different service doesn't conflict
          return booking.time === timeString;
        });

        // Check if time is blocked
        const isBlocked = timeBlock && timeBlock.some(block => 
          block.startTime && block.endTime && timeString >= block.startTime && timeString < block.endTime
        );

        slots.push({
          time: timeString,
          available: !isTaken && !isBlocked,
        });

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
      
      // Generate secure token for manage-booking access
      const token = randomBytes(32).toString("hex");
      const bookingId = generateBookingId(input.date);
      
      // Check if the time slot is already booked
      const existingBookings = await storage.getBookingsByDate(input.date);
      const isConflict = existingBookings.some(
        b => b.time === input.time && b.status === "confirmed" && b.serviceId === input.serviceId
      );
      
      if (isConflict) {
        return res.status(400).json({ message: "This time slot is already booked. Please select another time." });
      }
      
      // 1. Save to DB with token and booking ID
      const booking = await storage.createBooking({
        ...input,
        token,
        bookingId,
      });
      
      // Get service details for email
      const service = await storage.getService(input.serviceId);
      
      // 2. Send confirmation email (non-blocking)
      const appUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
      const manageLink = `${appUrl}/manage-booking?id=${booking.bookingId}&email=${encodeURIComponent(input.customerEmail)}`;
      const emailHtml = createConfirmationEmailHtml(
        input.customerName,
        service?.name || "Service",
        format(new Date(input.date), "MMMM d, yyyy"),
        input.time,
        manageLink,
        booking.bookingId
      );
      
      // Send emails asynchronously without blocking the response
      try {
        await Promise.all([
          // Confirmation email to customer
          sendEmail({
            to: input.customerEmail,
            subject: `Booking Confirmation - ${service?.name || 'AJ Insta Heal'}`,
            html: emailHtml,
          }),
          // Notification email to doctor (if configured)
          process.env.DOCTOR_EMAIL ? sendEmail({
            to: process.env.DOCTOR_EMAIL,
            subject: `New Booking: ${input.customerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
                <div style="background: #d4af37; color: black; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                  <h1 style="margin: 0;">📅 New Booking Received</h1>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #d4af37;">Booking Details</h2>
                  <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
                  <p><strong>Customer:</strong> ${input.customerName}</p>
                  <p><strong>Email:</strong> ${input.customerEmail}</p>
                  <p><strong>Phone:</strong> ${input.customerPhone}</p>
                  <p><strong>Service:</strong> ${service?.name || 'Unknown'}</p>
                  <p><strong>Date:</strong> ${format(new Date(input.date), "MMMM d, yyyy")}</p>
                  <p><strong>Time:</strong> ${format12Hour(input.time)}</p>
                  ${input.comments ? `<p><strong>Comments:</strong> ${input.comments}</p>` : ''}
                  <p style="margin-top: 20px;"><a href="${appUrl}/doctor-dashboard" style="background: #d4af37; color: black; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Dashboard</a></p>
                </div>
              </div>
            `,
          }) : Promise.resolve(true)
        ]);
      } catch (postErr) {
        console.error("❌ Post-booking email task error:", postErr);
      }

      // 3. Add to Google Calendar (if configured)
      try {
        const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
        
        // Construct the date string in the local format for the timezone
        // This ensures the Date constructor treats it as local time in the server's environment
        // then we convert it to an ISO string for Google Calendar API
        const localDateTimeStr = `${input.date}T${input.time}:00`;
        const startDateTime = new Date(localDateTimeStr);
        const endDateTime = new Date(startDateTime.getTime() + (service?.duration || 60) * 60000);

        const googleEventId = await addEventToCalendar({
          title: `${input.customerName} - ${service?.name || 'Appointment'}`,
          description: `Customer: ${input.customerName}\nEmail: ${input.customerEmail}\nPhone: ${input.customerPhone}${input.comments ? '\nComments: ' + input.comments : ''}`,
          startTime: startDateTime,
          endTime: endDateTime,
          attendeeEmail: input.customerEmail,
        });

        if (googleEventId) {
          await storage.updateBookingGoogleEventId(booking.id, googleEventId);
          console.log(`✅ Event added to Google Calendar: ${googleEventId}`);
        }
        
        // Log the exact payload for debugging
        console.log(`✅ Event sync details:`);
        console.log(`   Local Time: ${input.date} ${input.time}`);
        console.log(`   ISO String (UTC): ${startDateTime.toISOString()}`);
        console.log(`   Target Timezone: ${timeZone}`);
      } catch (calErr) {
        console.error("❌ Google Calendar error (non-fatal):", calErr);
      }

      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data" });
      }
      console.error("Booking error:", err);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking by ID and email (for manage-booking page)
  app.get(api.bookings.get.path, async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.query as { email: string };
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      // Support both numeric ID and booking ID format (AJIH-YYYYMMDD-XXXX)
      let booking;
      if (id.startsWith("AJIH-")) {
        // Find by booking ID
        booking = await storage.getBookingByBookingId(id);
      } else {
        // Find by numeric ID
        booking = await storage.getBookingById(Number(id));
      }
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify email matches
      if (booking.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Cancel booking
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

      // Sync with Google Calendar
      if (booking.googleEventId) {
        const { removeEventFromCalendar } = await import("./google-calendar");
        await removeEventFromCalendar(booking.googleEventId);
      }

      // Send cancellation confirmation email
      const service = await storage.getService(booking.serviceId);
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #d4af37; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .details { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #d4af37; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Booking Cancelled</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${booking.customerName}</strong>,</p>
                <p>Your booking has been successfully cancelled.</p>
                
                <div class="details">
                  <h3 style="margin-top: 0; color: #d4af37;">Cancelled Appointment</h3>
                  <div class="detail-row">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">${service?.name || 'Service'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${booking.date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${format12Hour(booking.time)}</span>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  If you'd like to rebook, you can do so anytime by visiting our website.
                </p>
              </div>
              
              <div class="footer">
                <p>AJ Insta Heal - Holistic Healing & Spiritual Growth</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      await sendEmail({
        to: booking.customerEmail,
        subject: "Booking Cancelled - AJ Insta Heal",
        html: emailHtml,
      });

      res.json(booking);
    } catch (err) {
      console.error("Cancel error:", err);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Reschedule booking
  app.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, newDate, newTime } = req.body;

      if (!email || !newDate || !newTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify new slot isn't taken
      const existingBookings = await storage.getBookingsByDate(newDate);
      const isConflict = existingBookings.some(b => b.time === newTime && b.status === "confirmed");
      if (isConflict) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }

      const booking = await storage.rescheduleBooking(Number(id), email, newDate, newTime);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Sync with Google Calendar
      if (booking.googleEventId) {
        const service = await storage.getService(booking.serviceId);
        const { updateEventInCalendar } = await import("./google-calendar");
        
        const localDateTimeStr = `${newDate}T${newTime}:00`;
        const startDateTime = new Date(localDateTimeStr);
        const endDateTime = new Date(startDateTime.getTime() + (service?.duration || 60) * 60000);

        await updateEventInCalendar(booking.googleEventId, {
          title: `${booking.customerName} - ${service?.name || 'Appointment'}`,
          description: `Customer: ${booking.customerName}\nEmail: ${booking.customerEmail}\nPhone: ${booking.customerPhone}${booking.comments ? '\nComments: ' + booking.comments : ''}`,
          startTime: startDateTime,
          endTime: endDateTime,
          attendeeEmail: booking.customerEmail,
        });
      }

      // Send reschedule confirmation email
      const service = await storage.getService(booking.serviceId);
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #d4af37; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .details { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #d4af37; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✏️ Booking Rescheduled</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${booking.customerName}</strong>,</p>
                <p>Your booking has been successfully rescheduled.</p>
                
                <div class="details">
                  <h3 style="margin-top: 0; color: #d4af37;">New Appointment</h3>
                  <div class="detail-row">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">${service?.name || 'Service'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${newDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${format12Hour(newTime)}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <p>AJ Insta Heal - Holistic Healing & Spiritual Growth</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      await sendEmail({
        to: booking.customerEmail,
        subject: "Booking Rescheduled - AJ Insta Heal",
        html: emailHtml,
      });

      res.json(booking);
    } catch (err) {
      console.error("Reschedule error:", err);
      res.status(500).json({ message: "Failed to reschedule booking" });
    }
  });

  // === ENQUIRIES ===
  app.post(api.enquiries.create.path, async (req, res) => {
    try {
      const input = api.enquiries.create.input.parse(req.body);
      const enquiry = await storage.createEnquiry(input);
      
      console.log("New Enquiry received:", enquiry);

      // Send email to doctor
      const doctorEmail = process.env.DOCTOR_EMAIL;
      if (doctorEmail) {
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">New Enquiry from AJ Insta Heal Website</h2>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <p><strong>Name:</strong> ${input.name}</p>
                  <p><strong>Email:</strong> ${input.email}</p>
                  <p><strong>Phone:</strong> ${input.phone}</p>
                  <p><strong>Message:</strong></p>
                  <p style="background-color: white; padding: 15px; border-left: 4px solid #007bff;">${input.message}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">You can reply directly to ${input.email} or call ${input.phone}</p>
                
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  <p style="color: #999; font-size: 12px;">AJ Insta Heal - Holistic Healing & Spiritual Growth</p>
                </div>
              </div>
            </body>
          </html>
        `;

        await sendEmail({
          to: doctorEmail,
          subject: `New Enquiry from ${input.name} - AJ Insta Heal`,
          html: emailHtml,
        });
      }

      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Invalid enquiry data" });
    }
  });

  // === COMPLETED APPOINTMENTS & PDF ===
  // Archive completed appointment
  app.post("/api/admin/archive-appointment", async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID required" });
      }

      // Mark as archived in the database by updating status
      const booking = await storage.getBookingByBookingId(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to archive appointment" });
    }
  });

  // Generate PDF of appointments
  app.get("/api/admin/appointments-pdf", async (req, res) => {
    try {
      const token = req.headers["x-doctor-token"] as string;
      if (!token || !(await isValidDoctorToken(token))) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { type } = req.query; // "all" or "completed"
      const allBookings = await storage.getAllBookings();
      const services = await storage.getServices();
      const serviceMap = new Map(services.map(s => [s.id, s]));

      // Filter by completion status
      let bookings = allBookings.filter(b => b.status === "confirmed");
      
      if (type === "completed") {
        const now = new Date();
        bookings = bookings.filter(booking => {
          const service = serviceMap.get(booking.serviceId);
          const duration = service?.duration || 60;
          const bookingTime = parse(booking.time, "HH:mm", new Date());
          const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
          const endTime = new Date(bookingDateTime.getTime() + duration * 60000);
          return endTime < now;
        });
      }

      // Create PDF
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="appointments.pdf"');
      doc.pipe(res);

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("AJ Insta Heal", 50, 50);
      doc.fontSize(12).font("Helvetica").text("Holistic Healing & Spiritual Growth", 50, 80);
      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      // Title and date
      doc.fontSize(16).font("Helvetica-Bold").text(`Patient Appointments Report - ${type === "completed" ? "Completed" : "All"}`, 50, 120);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${format(new Date(), "MMMM d, yyyy HH:mm")}`, 50, 145);
      
      doc.moveTo(50, 165).lineTo(550, 165).stroke();
      let yPos = 190;

      // Appointments
      if (bookings.length === 0) {
        doc.fontSize(12).text("No appointments found.", 50, yPos);
      } else {
        bookings.forEach((booking) => {
          const service = serviceMap.get(booking.serviceId);
          const serviceHours = service?.duration || 60;
          const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
          const endTime = new Date(bookingDateTime.getTime() + serviceHours * 60000);
          const isCompleted = endTime < new Date();
          const status = isCompleted ? "Completed" : "Upcoming";

          // Check if we need a new page
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          // Appointment entry
          doc.fontSize(11).font("Helvetica-Bold").text(`${booking.customerName}`, 50, yPos);
          yPos += 18;

          doc.fontSize(9).font("Helvetica");
          doc.text(`Booking ID: ${booking.bookingId}`, 60, yPos);
          yPos += 14;
          doc.text(`Email: ${booking.customerEmail}`, 60, yPos);
          yPos += 14;
          doc.text(`Phone: ${booking.customerPhone}`, 60, yPos);
          yPos += 14;
          doc.text(`Service: ${service?.name || "Unknown"}`, 60, yPos);
          yPos += 14;
          doc.text(`Date: ${format(new Date(booking.date + "T00:00:00"), "MMMM d, yyyy")}`, 60, yPos);
          yPos += 14;
          doc.text(`Time: ${format12Hour(booking.time)}`, 60, yPos);
          yPos += 14;
          doc.font("Helvetica-Bold").text(`Status: ${status}`, 60, yPos);
          yPos += 20;

          doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
          yPos += 15;
        });
      }

      // Footer
      doc.fontSize(8).font("Helvetica").text("© AJ Insta Heal - Confidential", 50, 750, { align: "center" });

      doc.end();
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  return httpServer;
}
