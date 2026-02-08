import { google, calendar_v3 } from "googleapis";

// Google Calendar Service
// Completely FREE integration - no costs, ever
// Setup: User provides Google Service Account JSON credentials via env variable

interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
}

let calendar: calendar_v3.Calendar | null = null;

function initializeCalendar() {
  if (calendar) return calendar;

  try {
    const credentialsJson = process.env.GOOGLE_CALENDAR_CREDENTIALS;
    if (!credentialsJson) {
      console.warn("GOOGLE_CALENDAR_CREDENTIALS not configured");
      return null;
    }

    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    calendar = google.calendar({
      version: "v3",
      auth,
    });

    return calendar;
  } catch (err) {
    console.error("Failed to initialize Google Calendar:", err);
    return null;
  }
}

export async function addEventToCalendar(event: CalendarEvent): Promise<string | null> {
  try {
    const cal = initializeCalendar();
    if (!cal) {
      console.log("Google Calendar not configured - skipping event creation");
      return null;
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";

    // Format the date as an ISO string but replace the 'Z' with the target timezone
    // to ensure Google Calendar interprets it correctly as local time
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace('Z', '');
    };

    const response = await cal.events.insert({
      calendarId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: formatDateTime(event.startTime),
          timeZone,
        },
        end: {
          dateTime: formatDateTime(event.endTime),
          timeZone,
        },
      },
    });

    console.log("Event added to Google Calendar:", (response as any).data.id);
    return (response as any).data.id || null;
  } catch (err) {
    console.error("Failed to add event to Google Calendar:", err);
    return null;
  }
}

export async function updateEventInCalendar(eventId: string, event: CalendarEvent): Promise<boolean> {
  try {
    const cal = initializeCalendar();
    if (!cal) {
      console.log("Google Calendar not configured - skipping event update");
      return false;
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace('Z', '');
    };

    await cal.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: formatDateTime(event.startTime),
          timeZone,
        },
        end: {
          dateTime: formatDateTime(event.endTime),
          timeZone,
        },
      },
    });

    console.log("Event updated in Google Calendar:", eventId);
    return true;
  } catch (err) {
    console.error("Failed to update event in Google Calendar:", err);
    return false;
  }
}

export async function removeEventFromCalendar(eventId: string): Promise<boolean> {
  try {
    const cal = initializeCalendar();
    if (!cal) {
      console.log("Google Calendar not configured - skipping event deletion");
      return false;
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    await cal.events.delete({
      calendarId,
      eventId,
    });

    console.log("Event removed from Google Calendar:", eventId);
    return true;
  } catch (err) {
    console.error("Failed to remove event from Google Calendar:", err);
    return false;
  }
}

// Archive event by adding archived label to extended properties
export async function archiveEventInCalendar(eventId: string): Promise<boolean> {
  try {
    const cal = initializeCalendar();
    if (!cal) {
      console.log("Google Calendar not configured - skipping event archival");
      return false;
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    // Get the event first to preserve its data
    const eventResponse = await cal.events.get({
      calendarId,
      eventId,
    });

    const event = eventResponse.data;

    // Add archived flag to extended properties
    const updatedEvent = {
      ...event,
      extendedProperties: {
        ...event.extendedProperties,
        private: {
          ...(event.extendedProperties?.private || {}),
          archived: "true",
        },
      },
    };

    await cal.events.update({
      calendarId,
      eventId,
      requestBody: updatedEvent,
    });

    console.log("Event archived in Google Calendar:", eventId);
    return true;
  } catch (err) {
    console.error("Failed to archive event in Google Calendar:", err);
    return false;
  }
}
