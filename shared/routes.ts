import { z } from 'zod';
import { insertBookingSchema, insertEnquirySchema, blockedDates, bookings } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  availability: {
    get: {
      method: 'GET' as const,
      path: '/api/availability',
      input: z.object({
        date: z.string(), // YYYY-MM-DD
      }),
      responses: {
        200: z.object({
          date: z.string(),
          slots: z.array(z.string()),
        }),
      },
    },
  },
  bookings: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/bookings',
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookings',
      input: insertBookingSchema,
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/bookings/:id',
      input: z.object({
        email: z.string().email(),
      }),
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    cancel: {
      method: 'PATCH' as const,
      path: '/api/bookings/:id/cancel',
      input: z.object({
        email: z.string().email(),
      }),
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    reschedule: {
      method: 'PATCH' as const,
      path: '/api/bookings/:id/reschedule',
      input: z.object({
        email: z.string().email(),
        newDate: z.string(),
        newTime: z.string(),
      }),
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
  },
  enquiries: {
    create: {
      method: 'POST' as const,
      path: '/api/enquiries',
      input: insertEnquirySchema,
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
