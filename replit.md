# AJ Insta Heal - Appointment Booking System

## Overview

AJ Insta Heal is a full-stack appointment booking web application for a holistic healing and acupuncture clinic. The system enables patients to book appointments, manage their bookings (cancel/reschedule), and provides a secure doctor dashboard for availability control. The application features Google Calendar integration for appointment management, email notifications, and PDF generation for appointment records.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns and react-day-picker for calendar functionality

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints defined in shared route schemas
- **Validation**: Zod schemas shared between frontend and backend
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit for schema management (`db:push` command)
- **Tables**: services, bookings, enquiries, blockedDates

### Key Design Patterns
1. **Shared Schema Pattern**: Database schemas and validation are defined once in `shared/` and used by both frontend and backend
2. **Type-Safe API Routes**: API routes are defined with Zod schemas in `shared/routes.ts` for request/response validation
3. **Storage Abstraction**: `server/storage.ts` provides an interface layer over database operations

### Authentication
- Doctor dashboard uses simple password-based authentication
- Tokens stored in localStorage with 24-hour expiration
- Environment variable `DOCTOR_PASSWORD` controls access

### Time Handling
- All times displayed in 12-hour format (AM/PM)
- Timezone configured via `TIMEZONE` environment variable (default: Asia/Kolkata)
- Booking dates start from tomorrow (current day disabled)

## External Dependencies

### Google Calendar Integration
- **Purpose**: Sync appointments and blocked dates with Google Calendar
- **Authentication**: Google Service Account credentials via `GOOGLE_CALENDAR_CREDENTIALS` environment variable
- **Features**: Creates calendar events for bookings, blocks leave dates, archives completed appointments

### Email Service
- **Library**: Nodemailer
- **Supported Providers**: SendGrid, Resend, or generic SMTP
- **Configuration**: Via environment variables (`EMAIL_PROVIDER`, `SENDGRID_API_KEY`, `RESEND_API_KEY`, or SMTP credentials)
- **Usage**: Booking confirmations, reminders, cancellation notices, reschedule confirmations

### PDF Generation
- **Library**: PDFKit
- **Usage**: Generate downloadable appointment reports for doctor dashboard

### Database
- **Provider**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM for type-safe database queries

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `DOCTOR_PASSWORD` - Password for doctor dashboard access
- `GOOGLE_CALENDAR_CREDENTIALS` - JSON credentials for Google Calendar API (optional)
- `GOOGLE_CALENDAR_ID` - Calendar ID for event creation (optional)
- `EMAIL_PROVIDER` - Email service provider (sendgrid/resend/smtp)
- Email-specific credentials based on provider choice
- `TIMEZONE` - Timezone for appointment display (default: Asia/Kolkata)

## Recent Upgrades

### Admin Dashboard (AdminBookings.tsx)
- Full rewrite with analytics cards (Today / Upcoming / Cancelled / Total)
- Search by name, email, phone, or booking ID
- Status filter (All / Confirmed / Cancelled)
- Date filter (All / Today / Upcoming / Past)
- CSV export of filtered results
- Enquiries tab showing all contact form submissions
- Admin cancel booking (no email required) via `/api/admin/bookings/:id/cancel`
- Admin enquiries list via `/api/admin/enquiries`

### SEO & Discovery
- Full SEO meta tags in `client/index.html` (title, description, keywords, Open Graph, Twitter Card)
- LocalBusiness / MedicalClinic JSON-LD structured data
- `client/public/robots.txt` and `client/public/sitemap.xml` created
- Google Fonts reduced to only fonts actually in use (faster load)

### UX Improvements
- Sticky mobile Book Now + WhatsApp CTA bar (hidden on /book, /manage-booking, /doctor-dashboard)
- Booking success screen: WhatsApp and Get Directions buttons added
- Footer: fixed broken /services link (removed; replaced with Contact Us)

### Security
- Simple in-memory rate limiting on booking creation (5/min) and contact enquiries (3/min)