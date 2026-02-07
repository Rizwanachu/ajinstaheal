import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.services.list.path);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`API Error (${res.status}):`, errorText);
          throw new Error(`Failed to fetch services: ${res.status}`);
        }
        const json = await res.json();
        return api.services.list.responses[200].parse(json);
      } catch (err) {
        console.error("Fetch services error:", err);
        throw err;
      }
    },
  });
}
