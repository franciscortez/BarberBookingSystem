import type { Service } from "../../../types";
import { formatPrice, parseAmount } from "../../../utils/booking";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GroupedService = {
  name: string;
  description: string | null;
  durationMins: number;
  minPrice: number;
  maxPrice: number;
  minDownpayment: number;
  maxDownpayment: number;
  services: Service[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const formatPriceRange = (min: number, max: number) =>
  min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;

export const getServiceBadge = (name: string) => {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("massage") || lowercase.includes("shave")) {
    return { label: "Ritual", className: "bg-indigo-500/10 text-indigo-400" };
  }
  if (lowercase.includes("color") || lowercase.includes("facial")) {
    return { label: "Luxury", className: "bg-amber-500/10 text-amber-400" };
  }
  return { label: "Classic", className: "bg-amber-500/10 text-amber-400" };
};

export const normalizeBarberName = (name?: string) => {
  if (!name) return "Assigned Barber";
  return name.split(" - ")[0];
};

export const getBarberRole = (name?: string) => {
  if (!name) return "Professional Barber";
  const role = name.split(" - ")[1];
  return role || "Professional Barber";
};

export const groupServicesByName = (services: Service[]): GroupedService[] => {
  const groups = services.reduce<Map<string, Service[]>>((acc, service) => {
    const serviceGroup = acc.get(service.name) ?? [];
    serviceGroup.push(service);
    acc.set(service.name, serviceGroup);
    return acc;
  }, new Map());

  return Array.from(groups.entries())
    .map(([name, groupedServices]) => {
      const prices = groupedServices.map((service) =>
        parseAmount(service.total_price),
      );
      const downpayments = groupedServices.map((service) =>
        parseAmount(service.downpayment_amount),
      );
      const firstService = groupedServices[0];

      return {
        name,
        description: firstService.description,
        durationMins: firstService.duration_mins,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        minDownpayment: Math.min(...downpayments),
        maxDownpayment: Math.max(...downpayments),
        services: [...groupedServices].sort(
          (a, b) => parseAmount(b.total_price) - parseAmount(a.total_price),
        ),
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);
};
