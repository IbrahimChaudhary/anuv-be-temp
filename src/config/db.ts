import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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
