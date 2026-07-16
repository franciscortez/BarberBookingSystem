import pool = require('../database');
const db = pool.db;
import { barbers, services, admins } from './schema';
import bcrypt from 'bcryptjs';

const seed = async () => {
  console.log('Seeding database...');
  try {
    // 1. Clear existing data
    await db.delete(services);
    await db.delete(barbers);
    await db.delete(admins);

    // 2. Seed Barbers
    const seededBarbers = await db.insert(barbers).values([
      { name: 'Marco' },
      { name: 'Luis' },
      { name: 'Kevin' }
    ]).returning();

    console.log(`Seeded ${seededBarbers.length} barbers.`);

    // 3. Seed Services for each barber
    const servicesToInsert = [];
    for (const barber of seededBarbers) {
      servicesToInsert.push(
        {
          barber_id: barber.id,
          name: 'Haircut',
          description: 'Premium haircut tailored to your face shape, including hair wash and styling.',
          total_price: '500.00',
          downpayment_amount: '100.00',
          duration_mins: 30
        },
        {
          barber_id: barber.id,
          name: 'Beard Trim',
          description: 'Precision beard trim and line-up with hot towel treatment and beard oil.',
          total_price: '350.00',
          downpayment_amount: '50.00',
          duration_mins: 30
        },
        {
          barber_id: barber.id,
          name: 'Haircut & Beard Trim Combo',
          description: 'The ultimate grooming combo. Includes haircut, beard styling, hair wash, and hot towel.',
          total_price: '750.00',
          downpayment_amount: '150.00',
          duration_mins: 60
        },
        {
          barber_id: barber.id,
          name: 'Luxury Hot Towel Shave',
          description: 'Traditional straight razor shave with premium pre-shave oil, hot towels, and soothing balm.',
          total_price: '400.00',
          downpayment_amount: '100.00',
          duration_mins: 45
        }
      );
    }

    const seededServices = await db.insert(services).values(servicesToInsert).returning();
    console.log(`Seeded ${seededServices.length} services.`);

    // 4. Seed Admin
    const adminPassword = 'adminpassword123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    const seededAdmin = await db.insert(admins).values({
      username: 'admin',
      password_hash: passwordHash
    }).returning();

    console.log(`Seeded admin user: ${seededAdmin[0].username}`);
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
