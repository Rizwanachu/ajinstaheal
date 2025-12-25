# AJ Insta Heal - Appointment Booking System

## Project Overview
A full-stack appointment booking web application for AJ Insta Heal holistic healing services. Features doctor dashboard with availability control, Google Calendar integration, and customer booking management.

## Recent Updates (Dec 21, 2025 - Latest)

### 12-Hour Time Format + Timezone Fix
- **Entire app now uses 12-hour format** (4:00 PM instead of 16:00)
- Timezone set to Asia/Kolkata (IST) via TIMEZONE env var
- Admin dashboard blocked times display: "4:00 PM - 4:30 PM" 
- All emails show appointment times in 12-hour format
- Google Calendar events use correct IST timezone

### Fixed Availability Bug
- Partial day blocks no longer hide entire date
- Example: Block 4:00-4:30 PM → Patients can book 5:00 PM, 5:30 PM, etc.
- Only full-day blocks hide the date completely

## Previous Updates (Dec 21, 2025)

### Email Content Fix
- Removed "If you have any questions, please contact us at contact@ajinstaheal.com" from:
  - Booking confirmation emails
  - Reminder emails
  - Cancellation emails
  - Reschedule confirmation emails
- All outgoing emails now have clean footers with just the business name

### Doctor Dashboard Features
1. **Block Full Days (Leave)**
   - Doctor selects a date
   - System marks entire day as unavailable
   - Creates BLOCKED event in Google Calendar

2. **Block Specific Time Ranges**
   - Doctor selects date + start/end times
   - System blocks that time range
   - Creates BLOCKED event in Google Calendar
   - Patients cannot see or select blocked times

3. **Real-time Availability**
   - Patient booking UI automatically reflects blocked dates/times
   - Blocked dates completely hidden from calendar picker
   - Blocked time slots marked as unavailable

### Google Calendar Integration
- Blocking events created with clear naming: "BLOCKED – Leave" or "BLOCKED – Unavailable"
- Events include reason in description
- Doctor password protected access (via DOCTOR_PASSWORD env var)
- Single source of truth for availability

## Architecture

### Frontend
- **Framework:** React + TypeScript
- **UI:** Shadcn/ui components + Tailwind CSS
- **Routing:** Wouter
- **State:** React Query
- **Pages:**
  - Home, About, Services, FAQ, Contact
  - Book (booking wizard)
  - ManageBooking (reschedule/cancel)
  - DoctorLogin (password auth)
  - AdminBookings (doctor dashboard)

### Backend
- **Framework:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Email:** Nodemailer (SendGrid/Resend/SMTP)
- **Google Calendar:** googleapis library
- **Auth:** Simple token-based for doctor portal

### Database Schema
- `services`: Available services (duration, price)
- `bookings`: Customer appointments
- `blocked_dates`: Doctor availability blocks (dates/times)
- `enquiries`: Contact form submissions

## Environment Variables

### Required
- `DOCTOR_PASSWORD`: Password for doctor dashboard access
- `GOOGLE_CALENDAR_CREDENTIALS`: Google Service Account JSON (base64 or full JSON)
- `GOOGLE_CALENDAR_ID`: Google Calendar ID (default: "primary")

### Email Configuration
- `EMAIL_PROVIDER`: 'smtp' | 'sendgrid' | 'resend'
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- OR `SENDGRID_API_KEY` / `RESEND_API_KEY`
- `DOCTOR_EMAIL`: Optional, for new booking notifications

### Optional
- `TIMEZONE`: Default timezone (default: "UTC")
- `APP_URL`: Full app URL for email links
- `PORT`: Server port (default: 5000)

## Working Hours
- Monday-Friday: 4:00 PM - 6:00 PM
- Saturday: 4:00 PM - 6:00 PM  
- Sunday: 8:00 AM - 10:00 AM
- 30-minute booking slots

## Deployment
- **Frontend Build:** `npm run build` → `dist/public`
- **Backend:** Node.js runtime
- **Database:** PostgreSQL
- **Hosting:** Vercel (or any Node.js host)

## Security Notes
- Doctor dashboard protected with simple password stored in env vars
- No external auth services used (as requested)
- Booking tokens generated server-side for manage-booking access
- Email content stripped of contact fallbacks for privacy

## Key Files
- `server/routes.ts`: API endpoints (bookings, availability, blocks)
- `server/google-calendar.ts`: Calendar integration
- `server/email.ts`: Email templates (cleaned)
- `client/src/pages/AdminBookings.tsx`: Doctor dashboard (blocking UI)
- `shared/schema.ts`: Database schema + Zod validations
