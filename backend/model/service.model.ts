import pool = require("../config/database");
const db = pool.db;
import { services, barbers } from "../config/db/schema";
import { eq, asc, sql, and } from "drizzle-orm";

import {
  Service,
  ServiceWithBarber,
  CreateServiceInput,
  UpdateServiceInput,
} from "../types";

export const getAllServices = async (): Promise<ServiceWithBarber[]> => {
  const rows = await db
    .select({
      id: services.id,
      barber_id: services.barber_id,
      name: services.name,
      description: services.description,
      total_price: services.total_price,
      downpayment_amount: services.downpayment_amount,
      duration_mins: services.duration_mins,
      created_at: services.created_at,
      updated_at: services.updated_at,
      barber_name: barbers.name,
    })
    .from(services)
    .innerJoin(barbers, eq(services.barber_id, barbers.id))
    .where(and(eq(services.is_active, true), eq(barbers.is_active, true)))
    .orderBy(asc(services.name));

  return rows as ServiceWithBarber[];
};

export const getServicesByBarber = async (
  barberId: string,
): Promise<ServiceWithBarber[]> => {
  const rows = await db
    .select({
      id: services.id,
      barber_id: services.barber_id,
      name: services.name,
      description: services.description,
      total_price: services.total_price,
      downpayment_amount: services.downpayment_amount,
      duration_mins: services.duration_mins,
      created_at: services.created_at,
      updated_at: services.updated_at,
      barber_name: barbers.name,
    })
    .from(services)
    .innerJoin(barbers, eq(services.barber_id, barbers.id))
    .where(
      and(
        eq(services.barber_id, barberId),
        eq(services.is_active, true),
        eq(barbers.is_active, true),
      ),
    )
    .orderBy(asc(services.name));

  return rows as ServiceWithBarber[];
};

export const getServiceById = async (
  serviceId: string,
): Promise<Service | null> => {
  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.is_active, true)));
  return (rows[0] as Service) || null;
};

export const createService = async (
  serviceData: CreateServiceInput,
): Promise<Service> => {
  const {
    barber_id,
    name,
    description,
    total_price,
    downpayment_amount,
    duration_mins,
  } = serviceData;
  const rows = await db
    .insert(services)
    .values({
      barber_id,
      name,
      description,
      total_price,
      downpayment_amount,
      duration_mins,
    })
    .returning();

  return rows[0] as Service;
};

export const updateService = async (
  serviceId: string,
  serviceData: UpdateServiceInput,
): Promise<Service | null> => {
  const { name, description, total_price, downpayment_amount, duration_mins } =
    serviceData;
  const rows = await db
    .update(services)
    .set({
      name,
      description,
      total_price,
      downpayment_amount,
      duration_mins,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(services.id, serviceId))
    .returning();

  return (rows[0] as Service) || null;
};

export const deleteService = async (serviceId: string): Promise<boolean> => {
  const rows = await db
    .update(services)
    .set({ is_active: false, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(services.id, serviceId))
    .returning();
  return rows.length > 0;
};
