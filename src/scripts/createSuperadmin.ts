import bcrypt from 'bcryptjs';
import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const createSuperadmin = async () => {
  const name = 'Ujjwal';
  const email = 'Ujjwal@binarychai.com';
  const password = 'Binary@anuv25';
  const role = 'super_admin';

  try {
    console.log(`Connecting to database...`);
    
    // Check if admin already exists
    const [existingAdmins]: any = await pool.query(
      'SELECT id FROM admins WHERE email = ?',
      [email]
    );

    if (existingAdmins.length > 0) {
      console.log(`Admin with email ${email} already exists.`);
      process.exit(0);
    }

    console.log(`Hashing password...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(`Inserting superadmin into database...`);
    const [result]: any = await pool.query(
      'INSERT INTO admins (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, true]
    );

    console.log(`✅ Superadmin created successfully with ID: ${result.insertId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    process.exit(1)
  }
};

createSuperadmin();
