import mysql from 'mysql2/promise';

const {
  MYSQL_PUBLIC_URL
} = process.env;

console.log("CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME);
console.log("MYSQL_PUBLIC_URL", MYSQL_PUBLIC_URL)

// throw new Error('STOP');


if (!MYSQL_PUBLIC_URL) {
  throw new Error('❌ Missing database environment variables');
}

const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL || '');

// Test the connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    console.error('✗ MySQL Database connection failed:', error);
    throw error;
  }
};

export default pool;
