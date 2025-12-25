import nodemailer from "nodemailer";

// Email service that supports multiple providers
// Configure via environment variables:
// EMAIL_PROVIDER: 'sendgrid' | 'resend' | 'smtp' (default: smtp)
// For SendGrid: SENDGRID_API_KEY
// For Resend: RESEND_API_KEY
// For SMTP: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function initializeTransporter() {
  if (transporter) return transporter;

  const provider = process.env.EMAIL_PROVIDER || "smtp";

  if (provider === "sendgrid" && process.env.SENDGRID_API_KEY) {
    // SendGrid configuration
    transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (provider === "resend" && process.env.RESEND_API_KEY) {
    // Resend configuration (via SMTP)
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  } else if (
    provider === "smtp" &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER
  ) {
    // Generic SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: log emails to console for development
    console.warn(
      "No email provider configured. Emails will be logged to console."
    );
  }

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const provider = initializeTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@ajinstaheal.com";

    if (!provider) {
      console.warn("No email provider configured. Logging to console.");
      console.log("📧 Email (Development Mode):", { to: options.to, subject: options.subject });
      return true;
    }

    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const result = await Promise.race([
      provider.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout")), 30000))
    ]);

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
}

function format12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

export function createConfirmationEmailHtml(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  manageLink: string,
  bookingId?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4af37; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #d4af37; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .button { display: inline-block; background: #d4af37; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Booking Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Thank you for booking with AJ Insta Heal. Your appointment has been confirmed and we're looking forward to seeing you!</p>
            
            <div class="details">
              <h3 style="margin-top: 0; color: #d4af37;">Appointment Details</h3>
              ${bookingId ? `<div class="detail-row">
                <span class="detail-label">Booking ID</span>
                <span class="detail-value" style="font-weight: bold; font-size: 16px;">${bookingId}</span>
              </div>` : ""}
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${format12Hour(time)}</span>
              </div>
            </div>
            
            <p>You can manage your booking (reschedule or cancel) using the link below:</p>
            <a href="${manageLink}" class="button">Manage Your Booking</a>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              <strong>📍 Location:</strong> Mattancherry, Ernakulam, Kerala, India<br>
              <strong>📞 Contact:</strong> +91 70253 98998
            </p>
          </div>
          
          <div class="footer">
            <p>AJ Insta Heal - Holistic Healing & Spiritual Growth</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function createReminderEmailHtml(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  hoursUntilAppointment: number
): string {
  const reminderText =
    hoursUntilAppointment <= 24
      ? "Your appointment is coming up very soon!"
      : `Your appointment is in ${hoursUntilAppointment} hours.`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4af37; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
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
            <h1>⏰ Appointment Reminder</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>${reminderText}</p>
            
            <div class="details">
              <h3 style="margin-top: 0; color: #d4af37;">Appointment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${format12Hour(time)}</span>
              </div>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              <strong>📍 Location:</strong> Mattancherry, Ernakulam, Kerala, India<br>
              <strong>📞 Contact:</strong> +91 987 654 3210
            </p>
          </div>
          
          <div class="footer">
            <p>AJ Insta Heal - Holistic Healing & Spiritual Growth</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
