import mysql from 'mysql2/promise';

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env;

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// throw new Error('STOP');


if (!DB_HOST || !DB_USER || !DB_NAME) {
  throw new Error('❌ Missing database environment variables');
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT ?? 3306),
  waitForConnections: true,
  connectionLimit: 10,
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
