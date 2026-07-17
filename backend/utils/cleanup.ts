import pool = require("../config/database");
import { appointments } from "../config/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getPendingHoldMinutes } from "./bookingRules";

export const cleanupExpiredPendingBookings = async (): Promise<void> => {
  const holdMinutes = getPendingHoldMinutes();
  try {
    const result = await pool.db
      .delete(appointments)
      .where(
        and(
          eq(appointments.status, "pending"),
          sql`${appointments.created_at} < CURRENT_TIMESTAMP - (${holdMinutes} * INTERVAL '1 minute')`,
        ),
      )
      .returning({ id: appointments.id });

    if (result.length > 0) {
      console.log(`Cleaned up ${result.length} expired pending bookings.`);
    }
  } catch (error) {
    console.error("Failed to run pending booking cleanup:", error);
  }
};
