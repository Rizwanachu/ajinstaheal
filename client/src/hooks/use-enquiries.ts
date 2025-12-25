import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { CreateEnquiryRequest } from "@shared/schema";

export function useCreateEnquiry() {
  return useMutation({
    mutationFn: async (data: CreateEnquiryRequest) => {
      const res = await fetch(api.enquiries.create.path, {
        method: api.enquiries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to send enquiry");
      }
      return api.enquiries.create.responses[201].parse(await res.json());
    },
  });
}
