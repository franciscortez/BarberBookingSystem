import pool = require("../database");
const db = pool.db;
import {
  barbers,
  services,
  users,
  appointments,
  payments,
  auth_sessions,
  refresh_tokens,
} from "./schema";
import bcrypt from "bcryptjs";

const seed = async () => {
  console.log("Seeding database...");
  try {
    // 1. Clear existing data
    await db.delete(payments);
    await db.delete(appointments);
    await db.delete(refresh_tokens);
    await db.delete(auth_sessions);
    await db.delete(services);
    await db.delete(barbers);
    await db.delete(users);

    // 2. Seed Barbers (creating user account with role 'barber' and linking to barbers table)
    const barberPassword = "barber123";
    const barberSalt = await bcrypt.genSalt(10);
    const barberHash = await bcrypt.hash(barberPassword, barberSalt);

    const barberInfos = [
      { name: "Marco", email: "marco@barbershop.com", phone: "09111111111" },
      { name: "Luis", email: "luis@barbershop.com", phone: "09222222222" },
      { name: "Kevin", email: "kevin@barbershop.com", phone: "09333333333" },
    ];

    const seededBarbers = [];
    for (const info of barberInfos) {
      const userRows = await db
        .insert(users)
        .values({
          name: info.name,
          email: info.email,
          phone: info.phone,
          password_hash: barberHash,
          role: "barber",
        })
        .returning();

      const barberRows = await db
        .insert(barbers)
        .values({
          user_id: userRows[0].id,
          name: info.name,
          email: info.email,
        })
        .returning();

      seededBarbers.push(barberRows[0]);
    }

    console.log(`Seeded ${seededBarbers.length} barbers.`);

    // 3. Seed Services for each barber
    const servicesToInsert = [];
    for (const barber of seededBarbers) {
      servicesToInsert.push(
        {
          barber_id: barber.id,
          name: "Haircut",
          description:
            "Premium haircut tailored to your face shape, including hair wash and styling.",
          total_price: "500.00",
          downpayment_amount: "100.00",
          duration_mins: 30,
        },
        {
          barber_id: barber.id,
          name: "Beard Trim",
          description:
            "Precision beard trim and line-up with hot towel treatment and beard oil.",
          total_price: "350.00",
          downpayment_amount: "50.00",
          duration_mins: 30,
        },
        {
          barber_id: barber.id,
          name: "Haircut & Beard Trim Combo",
          description:
            "The ultimate grooming combo. Includes haircut, beard styling, hair wash, and hot towel.",
          total_price: "750.00",
          downpayment_amount: "150.00",
          duration_mins: 60,
        },
        {
          barber_id: barber.id,
          name: "Luxury Hot Towel Shave",
          description:
            "Traditional straight razor shave with premium pre-shave oil, hot towels, and soothing balm.",
          total_price: "400.00",
          downpayment_amount: "100.00",
          duration_mins: 45,
        },
      );
    }

    const seededServices = await db
      .insert(services)
      .values(servicesToInsert)
      .returning();
    console.log(`Seeded ${seededServices.length} services.`);

    // 4. Seed Admin User
    const adminPassword = "adminpassword123";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    const seededAdmin = await db
      .insert(users)
      .values({
        name: "Admin",
        email: "admin@barbershop.com",
        phone: "0000000000",
        password_hash: passwordHash,
        role: "admin",
      })
      .returning();

    console.log(`Seeded admin user: ${seededAdmin[0].email}`);
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
