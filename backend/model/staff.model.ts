import pool = require("../config/database");
import {
  AppointmentFilters,
  BarberProfileInput,
  WorkingHourInput,
  AvailabilityBlockInput,
} from "../validation/staff.validation";

export const getBarberIdForUser = async (
  userId: string,
): Promise<string | null> => {
  const result = await pool.query("SELECT id FROM barbers WHERE user_id = $1", [
    userId,
  ]);
  return result.rows[0]?.id ?? null;
};

export const listAppointments = async (
  filters: AppointmentFilters,
  ownerBarberId?: string,
) => {
  const values: unknown[] = [];
  const where: string[] = [];
  const add = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };
  if (ownerBarberId) where.push(`a.barber_id = ${add(ownerBarberId)}`);
  else if (filters.barberId)
    where.push(`a.barber_id = ${add(filters.barberId)}`);
  if (filters.date) where.push(`a.appointment_date = ${add(filters.date)}`);
  if (filters.status) where.push(`a.status = ${add(filters.status)}`);
  if (filters.serviceId) where.push(`a.service_id = ${add(filters.serviceId)}`);
  if (filters.paymentStatus)
    where.push(`p.status = ${add(filters.paymentStatus)}`);
  if (filters.search) {
    const search = add(`%${filters.search}%`);
    where.push(
      `(a.customer_name ILIKE ${search} OR a.customer_email ILIKE ${search} OR a.customer_phone ILIKE ${search})`,
    );
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const result = await pool.query(
    `
    SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.barber_id, a.service_id,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') appointment_date, a.start_time, a.end_time, a.status,
      b.name barber_name, s.name service_name, s.total_price, s.downpayment_amount,
      p.status payment_status, p.amount payment_amount, p.paymongo_payment_id
    FROM appointments a
    LEFT JOIN barbers b ON b.id = a.barber_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN payments p ON p.appointment_id = a.id
    ${clause}
    ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT 250`,
    values,
  );
  return result.rows;
};

export const getAppointment = async (id: string, ownerBarberId?: string) => {
  const filters: AppointmentFilters = {};
  const rows = await listAppointments(filters, ownerBarberId);
  return rows.find((row) => row.id === id) ?? null;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const result = await pool.query(
    "UPDATE appointments SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
    [id, status],
  );
  return result.rows[0] ?? null;
};

export const dashboard = async (ownerBarberId?: string) => {
  const values: unknown[] = [];
  const owner = ownerBarberId ? "AND a.barber_id = $1" : "";
  if (ownerBarberId) values.push(ownerBarberId);
  const result = await pool.query(
    `SELECT
    COUNT(*) FILTER (WHERE a.appointment_date = CURRENT_DATE) today,
    COUNT(*) FILTER (WHERE a.appointment_date >= CURRENT_DATE AND a.status = 'confirmed') upcoming,
    COUNT(*) FILTER (WHERE a.status = 'confirmed') confirmed,
    COUNT(*) FILTER (WHERE a.status = 'completed') completed,
    COUNT(*) FILTER (WHERE a.status = 'cancelled') cancelled,
    COUNT(*) FILTER (WHERE a.status = 'no_show') no_show
    FROM appointments a WHERE TRUE ${owner}`,
    values,
  );
  const next = await pool.query(
    `SELECT a.id, a.customer_name, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') appointment_date, a.start_time
    FROM appointments a WHERE a.status = 'confirmed' AND (a.appointment_date > CURRENT_DATE OR (a.appointment_date = CURRENT_DATE AND a.start_time > CURRENT_TIME)) ${owner}
    ORDER BY a.appointment_date, a.start_time LIMIT 1`,
    values,
  );
  return { ...result.rows[0], next_appointment: next.rows[0] ?? null };
};

export const listBarbers = async () =>
  (
    await pool.query(
      `SELECT b.id, b.user_id, b.name, b.email, b.phone, b.is_active, b.created_at, u.is_active account_active FROM barbers b LEFT JOIN users u ON u.id=b.user_id ORDER BY b.name`,
    )
  ).rows;
export const getBarber = async (id: string) =>
  (
    await pool.query(
      "SELECT b.*, u.phone user_phone FROM barbers b LEFT JOIN users u ON u.id=b.user_id WHERE b.id=$1",
      [id],
    )
  ).rows[0] ?? null;
export const updateBarberProfile = async (
  id: string,
  input: BarberProfileInput,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE barbers SET name=$2, phone=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *",
      [id, input.name, input.phone],
    );
    if (result.rows[0]?.user_id)
      await client.query(
        "UPDATE users SET name=$2, phone=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [result.rows[0].user_id, input.name, input.phone],
      );
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
export const setBarberActive = async (id: string, active: boolean) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE barbers SET is_active=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *",
      [id, active],
    );
    if (result.rows[0]?.user_id)
      await client.query(
        "UPDATE users SET is_active=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
        [result.rows[0].user_id, active],
      );
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteBarber = async (id: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const barber = await client.query(
      "SELECT user_id FROM barbers WHERE id=$1",
      [id],
    );
    const userId = barber.rows[0]?.user_id;
    const result = await client.query(
      "DELETE FROM barbers WHERE id=$1 RETURNING id",
      [id],
    );
    if (userId) {
      await client.query("DELETE FROM users WHERE id=$1", [userId]);
    }
    await client.query("COMMIT");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const listPayments = async () =>
  (
    await pool.query(`SELECT p.id, p.amount, p.status, p.paymongo_checkout_id, p.paymongo_payment_id, p.created_at,
  a.id appointment_id, a.customer_name, a.customer_email, b.name barber_name
  FROM payments p LEFT JOIN appointments a ON a.id=p.appointment_id LEFT JOIN barbers b ON b.id=a.barber_id ORDER BY p.created_at DESC LIMIT 250`)
  ).rows;

export const getAvailability = async (barberId: string) => ({
  hours: (
    await pool.query(
      "SELECT id, weekday, start_time, end_time FROM barber_working_hours WHERE barber_id=$1 ORDER BY weekday, start_time",
      [barberId],
    )
  ).rows,
  blocks: (
    await pool.query(
      "SELECT id, TO_CHAR(block_date, 'YYYY-MM-DD') block_date, start_time, end_time, reason FROM barber_availability_blocks WHERE barber_id=$1 AND block_date >= CURRENT_DATE ORDER BY block_date, start_time",
      [barberId],
    )
  ).rows,
});
export const replaceWorkingHours = async (
  barberId: string,
  hours: WorkingHourInput[],
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM barber_working_hours WHERE barber_id=$1", [
      barberId,
    ]);
    for (const hour of hours)
      await client.query(
        "INSERT INTO barber_working_hours (barber_id, weekday, start_time, end_time) VALUES ($1,$2,$3,$4)",
        [barberId, hour.weekday, hour.start_time, hour.end_time],
      );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
export const addAvailabilityBlock = async (
  barberId: string,
  block: AvailabilityBlockInput,
) =>
  (
    await pool.query(
      "INSERT INTO barber_availability_blocks (barber_id, block_date, start_time, end_time, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [
        barberId,
        block.block_date,
        block.start_time,
        block.end_time,
        block.reason ?? null,
      ],
    )
  ).rows[0];
export const deleteAvailabilityBlock = async (barberId: string, id: string) =>
  (
    await pool.query(
      "DELETE FROM barber_availability_blocks WHERE id=$1 AND barber_id=$2 RETURNING id",
      [id, barberId],
    )
  ).rows[0] ?? null;

export const listInvitations = async () =>
  (
    await pool.query(`SELECT id,email,name,phone,expires_at,accepted_at,revoked_at,created_at,
  CASE WHEN accepted_at IS NOT NULL THEN 'accepted' WHEN revoked_at IS NOT NULL THEN 'revoked' WHEN expires_at < CURRENT_TIMESTAMP THEN 'expired' ELSE 'pending' END status
  FROM barber_invitations ORDER BY created_at DESC`)
  ).rows;
