import catalog from "./landing-catalog.json";
import type { Barber, Service } from "../../../types";
import type { CatalogResponse } from "../../../services/api";

export const landingBarbers: Barber[] = catalog.barbers;
export const landingServices: Service[] = catalog.services;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAmount = (value: unknown) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));

export const isLandingCatalog = (value: unknown): value is CatalogResponse =>
  isRecord(value) &&
  Array.isArray(value.barbers) &&
  Array.isArray(value.services) &&
  value.barbers.every(
    (barber: unknown) =>
      isRecord(barber) &&
      typeof barber.id === "string" &&
      typeof barber.name === "string",
  ) &&
  value.services.every(
    (service: unknown) =>
      isRecord(service) &&
      typeof service.id === "string" &&
      typeof service.barber_id === "string" &&
      typeof service.name === "string" &&
      (service.description === null ||
        typeof service.description === "string") &&
      isAmount(service.total_price) &&
      isAmount(service.downpayment_amount) &&
      typeof service.duration_mins === "number" &&
      Number.isFinite(service.duration_mins) &&
      (service.barber_name === undefined ||
        typeof service.barber_name === "string"),
  );
