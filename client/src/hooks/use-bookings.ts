import { useMutation, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateBookingRequest } from "@shared/schema";
import { z } from "zod";

export function useAvailability(date: string | undefined, serviceId: number | undefined) {
  return useQuery({
    queryKey: [api.availability.get.path, date, serviceId],
    queryFn: async () => {
      if (!date || !serviceId) return null;
      
      const url = buildUrl(api.availability.get.path) + `?date=${date}&serviceId=${serviceId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return api.availability.get.responses[200].parse(await res.json());
    },
    enabled: !!date && !!serviceId,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create booking");
      }

      return api.bookings.create.responses[201].parse(await res.json());
    },
  });
}
